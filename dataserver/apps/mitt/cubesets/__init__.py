import datetime
import multiprocessing
import queue
import signal
import pytz
from dataserver.apps.util.redis.access import GraphManager
from dataserver.apps.util.data_file_processing import detokenize_groupdict, tokenize_fpath
from dataserver.apps.util.logger import make_logger
from dataserver.apps.util.hdf5.hdf5_util import HDF5Manager  # Replace MetakitManager with HDF5Manager
from dataserver.apps.util.utctime import sunset, utcnow

cubes = []
cubes_analysis = []
cubes_busnrules = []
cubes_redisrules = {}
define_counter = 0

def register_new_cube(cube):
    for required_cube in cube.requires:
        if required_cube not in cubes:
            register_new_cube(required_cube)

    if cube not in cubes:
        cubes.append(cube)

    cubes.sort(key=lambda x:x.order)

def register_new_analysis(cube):
    for required_cube in cube.requires:
        if required_cube not in cubes:
            register_new_analysis(required_cube)

    if cube not in cubes_analysis:
        cubes_analysis.append(cube)

    cubes_analysis.sort(key=lambda x:x.order)

def register_new_busnrule(cube):
    for required_cube in cube.requires:
        if required_cube not in cubes:
            register_new_busnrule(required_cube)

    if cube not in cubes_busnrules:
        cubes_busnrules.append(cube)

    cubes_busnrules.sort(key=lambda x:x.order)

def register_new_redisrule(cube):
    for required_cube in cube.requires:
        if required_cube not in cubes:
            register_new_redisrule(required_cube)

    if cube.__name__ not in cubes_redisrules:
        cubes_redisrules[cube.__name__] = cube

class Cube(type):
    def __new__(cls, name, bases, attrs):
        global define_counter
        newclass = type.__new__(cls, name, bases, attrs)
        newclass.define_counter = define_counter
        define_counter += 1

        if name not in ['CubeBase', 'Cube', 'Analysis', 'BusinessRule'] \
        and name.endswith('Cube'):
            register_new_cube(newclass)
        elif name.endswith('Analysis'):
            register_new_analysis(newclass)
        elif name.endswith('BusinessRule'):
            register_new_busnrule(newclass)
        elif name.endswith('RedisRule'):
            register_new_redisrule(newclass)

        return newclass

class CubeBase(object, metaclass=Cube):
    filenames = []
    requires = []
    order = 0
    define_counter = 0

    def __init__(self, *args, **kwargs):
        self.logger = make_logger(self.__class__.__name__)

        self._init(*args, **kwargs)

        self.stop_mtime = 0

    def _init(self, *args, **kwargs):
        pass

    def process(self, *args, **kwargs):
        pass

    def _multiprocess(self, queue, ctx, filepath, start, stop):
        import sys

        signal.signal(signal.SIGINT, lambda *args: sys.exit(1))

        from apps import simple_app

        app = simple_app(ctx['config'])
        app.open()

        try:
            returncode = self.process(ctx, filepath, start, stop)
        except:
            queue.put((ctx, (start, [])))
            raise

        queue.put((ctx, returncode))

        app.close()

    def multiprocess(self, ctx, filepath, start, stop):
        queue = multiprocessing.Queue()

        args = [queue, ctx, filepath, start, stop]
        process = multiprocessing.Process(target=self._multiprocess,
                                          args=args)
        process.start()

        subctx = {}
        returncode = start, []

        while process.is_alive():
            try:
                subctx, returncode = queue.get(timeout=.5)
                break
            except queue.Empty:
                continue
            except:
                subctx = {}
                returncode = start, []
                break

        process.join()

        return subctx, returncode

    def _threaded(self, queue, ctx, filepath, start, stop):
        from apps import simple_app

        app = simple_app(ctx['config'])
        app.open()

        try:
            returncode = self.process(ctx, filepath, start, stop)
        except:
            queue.put(None)
            raise

        queue.put((ctx, returncode))

        app.close()

    def threaded(self, ctx, filepath, start, stop):
        import queue
        import threading

        queue = queue.Queue()

        args = [queue, ctx, filepath, start, stop]
        process = threading.Thread(target=self._threaded,
                                    args=args)
        process.start()

        try:
            subctx, returncode = queue.get()
        except:
            subctx = {}
            returncode = start, []

        ctx.update(subctx)

        process.join()
        return returncode

    def _pp(self, ctx, filepath, start, stop):
        return self.process(ctx, filepath, start, stop)

    def pp(self, ctx, filepath, start, stop):
        import pp

        job_server = pp.Server()

        args = (ctx, filepath, start, stop)

        f = job_server.submit(self._pp, args)

        return f()

    def _async(self, ctx, filepath, start, stop, coro=None):
        yield self.process(ctx, filepath, start, stop)

    def async_process(self, ctx, filepath, start, stop):
        import asyncoro

        proc = asyncoro.Coro(self._async, ctx, filepath, start, stop)

        returncode = proc.value()

        return returncode

    def get_cube_fpath(self, fpath):
        info = tokenize_fpath(fpath)
        info['device_type'] = "%s|%s" % (info['device_type'], self.cube_id)
        return detokenize_groupdict(info)

class OnceDailyExecuter(CubeBase):
    execute_times = {'hour': 22,
                     'minute': 15,
                     'second': 0,
                     'microsecond': 0}

    def get_next_process_time(self, dt, mgr, ctx):
        dt = dt.astimezone(ctx['tz'])
        next = dt.replace(**self.execute_times)
        if next < dt:
            next += datetime.timedelta(days=1)
        return next.astimezone(pytz.utc)

    def process(self, dt, mgr, ctx):
        pass

class AtSunsetExecuter(CubeBase):
    def get_next_process_time(self, dt, mgr, ctx):
        latitude = ctx['_sitearray'].property('latitude')
        longitude = ctx['_sitearray'].property('longitude')

        dt = dt.astimezone(ctx['tz'])

        start_at = dt
        next = sunset(start_at, latitude, longitude)
        while next <= dt:
            start_at += datetime.timedelta(days=1)
            next = sunset(start_at, latitude, longitude)
        return next

    def process(self, dt, mgr, ctx):
        pass

class AtEndOfDay(CubeBase):
    filenames = ['eod_raw.mk$']
    requires  = []
    order     = 9

    def process(self, ctx, fpath, start, stop):
        mgr = GraphManager(ctx['site_id'])

        finfo = tokenize_fpath(fpath)

        now = utcnow()
        day = datetime.date(int(finfo['year']), int(finfo['month']), int(finfo['day']))

        # Using HDF5Manager to replace MetakitManager
        hdf5db = HDF5Manager(fpath)  # Replace MetakitManager
        hdf5db.open_ro()

        if len(hdf5db.data) == 1:
            self.process_rule(now, day, mgr, ctx, verbose=False)

        hdf5db.close()
