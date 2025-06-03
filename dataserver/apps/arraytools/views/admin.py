import datetime
import glob
import re

from flask import render_template, request, session, jsonify, flash, redirect, url_for, g, json

from clarity_util.utctime import utcepochnow
from clarity_util.mq import DAQClient
from clarity_util.metakit import MetakitManager, metakit_record_to_dict
from clarity_util.util import apply_to_dict

from apps import db

from apps.sitedata.access import DeviceNode
from apps.sitedata.models import SiteDailySummary, SiteData, SiteBaselinePeak, DeviceDailySummary
#from apps.equipment.models import PanelType

from apps.alerts.models.alerts import *
from apps.alerts.models.faults import *
from apps.issue.report_util import *

from apps.util import login_required, sitename_required, admin_required

from apps.arraytools.util import command_request, check_command_request,\
    clean_command_request, subprocessor, naturalsorted
from apps.arraytools.forms import UploadFirmwareForm, SelectParameterForm
from apps.arraytools.models import FirmwareImage

@admin_required
@sitename_required
def index():
    macaddr_graphkey = g.mgr.macaddr_graphkey() # macaddr_panel_ulabel
    graphkey_nodeid = g.mgr.graphkey_nodeid()
    firmwares = FirmwareImage.query.all()

    return render_template("admin/arraytools/index.html", macaddr_graphkey=macaddr_graphkey,
                           graphkey_nodeid=graphkey_nodeid,
                           firmwares=firmwares)

@admin_required
@sitename_required
def fault_browser(filter_on=FAULT_STATUS_OPEN):
    sitedata = SiteData.query.filter_by(sitename=g.sitename).one()
    faults = Fault.query.filter_by(sitedata_id=sitedata.id) \
                        .filter(Fault.status_code == filter_on)

    return render_template('admin/arraytools/fault_browser.html',
                           faults=faults,
                           Issue_category_dict=Issue_category_dict)

@admin_required
@sitename_required
def fix_faults():
    sitedata = SiteData.query.filter_by(sitename=g.sitename).one()
    faults = Fault.query.filter_by(sitedata_id=sitedata.id)

    for fault in faults:
        stch = fault.last_stch()

        if stch.resolve_stop and stch.resolve_start:
            dura = (stch.resolve_stop - stch.resolve_start).total_seconds()
            if dura > Fault_time_to_resolve.get(fault.category, Fault_time_to_resolve['default']):
                fault.resolve()

    db.session.commit()

    return redirect(url_for('fault_browser'))


@admin_required
@sitename_required
def array_performance():
    sitedata = SiteData.query.filter_by(sitename=g.sitename).one()

    system_area, system_kWp, system_eff = sitedata.basic_array_info()

    daily_summaries = SiteDailySummary.query.filter_by(sitedata_id=sitedata.id) \
                                            .order_by(SiteDailySummary.summary_date.desc())

    peaks = SiteBaselinePeak.query.filter_by(sitedata_id=sitedata.id)

    return render_template("admin/arraytools/array_perf.html",
                           system_area=system_area,
                           system_kWp=system_kWp,
                           system_eff=system_eff,
                           daily_summaries=daily_summaries,
                           peaks=peaks)

@admin_required
@sitename_required
def array_performance_chart():
    return render_template("admin/arraytools/array_perf_chart.html")

@admin_required
@sitename_required
def array_performance_chart_data(data_type='irrad_eff'):
    sitedata = SiteData.query.filter_by(sitename=g.sitename).one()

    system_area, system_kWp, system_eff = sitedata.basic_array_info()

    daily_summaries = SiteDailySummary.query.filter_by(sitedata_id=sitedata.id) \
                                            .order_by(SiteDailySummary.summary_date.desc())

    data = {'data': [],
            'labels': []}

    funcs = {}
    def is_data_func(f):
        funcs[f.__name__] = f
        def wrap(*args, **kwargs):
            return f(*args, **kwargs)
        return wrap

    @is_data_func
    def irrad_pnleff():
        summaries = DeviceDailySummary.query.filter_by(sitedata_id=sitedata.id) \
                                               .order_by(DeviceDailySummary.summary_date.desc())

        as_dates = {}

        for dsummary in daily_summaries:
            as_dates[dsummary.summary_date] = dsummary.irradiance_energy

        data['labels'] = ['Irradiance', 'Panel Efficiency']

        for summary in summaries:
            irrad = as_dates.get(summary.summary_date, None)

            data['data'].append((irrad, summary.eff_total))

    @is_data_func
    def irrad_eff():
        data['labels'] = ['Irradiance', 'Efficiency']

        for summary in daily_summaries:
            data['data'].append((summary.irradiance_energy, summary.eff_total))

    @is_data_func
    def irrad_eff_adj():
        data['labels'] = ['Irradiance', 'Efficiency']

        for summary in daily_summaries:
            data['data'].append((summary.irradiance_energy, summary.eff_adjusted))

    @is_data_func
    def eff_eff_adj():
        data['labels'] = ['Efficiency Total', 'Efficiency Adjusted']

        for summary in daily_summaries:
            data['data'].append((summary.eff_total, summary.eff_adjusted))

    @is_data_func
    def eff_pr():
        data['labels'] = ['Efficiency', 'Performance Ratio']

        for summary in daily_summaries:
            data['data'].append((summary.eff_total, summary.NREL_perf_ratio(system_kWp)[2]))

    funcs[data_type]()

    return jsonify(data)

@admin_required
@sitename_required
def system_status():
    return render_template("admin/arraytools/system_status.html")

@admin_required
@sitename_required
def basic_status(emit='json'):
    cmd_req = {'func': 'basic_status',
               'ttl': 15}

    resp = command_request(cmd_req, iresp=True)

    def encode_datetime(key, value):
        if isinstance(value, datetime.datetime):
            value = value.isoformat()
            #value.astimezone(g.tz).strftime('%Y-%m-%d %I:%M %p')
        return key,value

    if resp is not None:
        apply_to_dict(resp, encode_datetime)
    else:
        resp = dict(status=False)

    if emit == 'json':
        return jsonify(resp)
    else:
        resp = sorted(resp.items(), key=lambda x:x[0])
        return render_template("admin/arraytools/mod/basic_status.html", resp=resp)

@admin_required
@sitename_required
def rabbitmq_status(emit='html'):
    sa = g.mgr.current_sitearray()

    rabbitmq_vhost = sa.property('rabbitmq_vhost')

    status = subprocessor(['sudo', 'rabbitmqctl', 'status'])
    connections = subprocessor(['sudo', 'rabbitmqctl', 'list_connections',
                                'vhost', 'client_properties', 'peer_address'])
    queues = subprocessor(['sudo', 'rabbitmqctl', '-p', rabbitmq_vhost, 'list_queues'])
    consumers = subprocessor(['sudo', 'rabbitmqctl', '-p', rabbitmq_vhost, 'list_consumers'])

    def cmsort(x):
        xx = x.split('\t')
        try:
            return xx[0], xx[1]
        except:
            return None

    def load_keys(string):
        tokens = list(x.strip('"{[]}') for x in string.split(','))
        d = {}
        for k in range(0, len(tokens), 2):
            d[tokens[k]] = tokens[k+1]
        return d

    connections = sorted(connections.split('\n'), key=cmsort)
    def process_connections(x):
        for c in x:
            try:
                vhost, client_properties, peer_address = c.split('\t')
            except:
                yield c
                continue
            client_properties = load_keys(client_properties)
            client_properties = '%s, %s' % (client_properties.get('program'),
                                            client_properties.get('connection_count'))
            yield '%s\t%s\t%s' % (vhost, client_properties, peer_address)
    connections = '\n'.join(process_connections(connections))

    return render_template("admin/arraytools/mod/rabbitmq_status.html",
                           connections=connections,
                           queues=queues,
                           status=status,
                           consumers=consumers)

@admin_required
@sitename_required
def mitt_status(emit='html'):
    status = subprocessor(['sudo', 'supervisorctl', 'status'])
    maintail = subprocessor(['sudo', 'supervisorctl', 'maintail'])
    catcher = subprocessor(['sudo', 'supervisorctl', 'tail', 'catcher', 'stderr'])
    steam_roller = subprocessor(['sudo', 'supervisorctl', 'tail', 'steam_roller', 'stderr'])

    return render_template("admin/arraytools/mod/mitt_status.html",
                           status=status,
                           maintail=maintail,
                           catcher=catcher,
                           steam_roller=steam_roller)

@admin_required
@sitename_required
def data_status(emit='html'):
    opt_files = glob.glob('%s/*/*/*/2*_opt_raw.mk' % (g.mgr.data_dir()))
    opt_files = naturalsorted(opt_files, reverse=True)

    if len(opt_files):
        mkdb = MetakitManager(opt_files[0])
        mkdb.open_ro()
        vw = mkdb.view('data')
        vw = vw.sort(vw.freezetime)
        row = vw[-1]
        data = metakit_record_to_dict(vw, row)
        data['freezetime'] = data['freezetime'].isoformat()
        latest_data_report = data

        now = utcepochnow()

        vw_hour = vw.select({'freezetime': now - 3600},
                            {'freezetime': now}) \
                   .project(vw.macaddr) \
                   .unique()

        vw_min = vw.select({'freezetime': now - 300},
                           {'freezetime': now}) \
                   .project(vw.macaddr) \
                   .unique()
        vw_min2 = vw.select({'freezetime': now - (300*5)},
                           {'freezetime': now}) \
                   .project(vw.macaddr) \
                   .unique()
        vw_today = vw.project(vw.macaddr).unique()

        last_hours_reports = len(vw_hour)
        last_5_minutes = len(vw_min)
        last_15_minutes = len(vw_min2)
        today_reports = len(vw_today)
        mkdb.close()
    else:
        latest_data_report = None
        last_hours_reports = 0
        today_reports = 0
        last_5_minutes = 0
        last_15_minutes = 0

    env_files = glob.glob('%s/*/*/*/2*_env_raw.mk' % (g.mgr.data_dir()))
    env_files = naturalsorted(env_files, reverse=True)

    if len(env_files):
        mkdb = MetakitManager(env_files[0])
        mkdb.open_ro()
        vw = mkdb.view('data')
        vw = vw.sort(vw.freezetime)
        row = vw[-1]
        data = metakit_record_to_dict(vw, row)
        mkdb.close()
        data['freezetime'] = data['freezetime'].isoformat()
        latest_env_report = data
    else:
        latest_env_report = None

    return render_template("admin/arraytools/mod/data_status.html",
                           latest_data_report=latest_data_report,
                           last_hours_reports=last_hours_reports,
                           today_reports=today_reports,
                           last_5_minutes=last_5_minutes,
                           last_15_minutes=last_15_minutes,
                           latest_env_report=latest_env_report,
                           json=json,
                           opt_files=opt_files,
                           env_files=env_files)

@admin_required
@sitename_required
def data_control():
    generate_data = request.form.get('generate_data', 'on')
    flow_general = request.form.get('flow_general', 'on')
    debug = request.form.get('debug', 'off')

    generate_data = (generate_data == 'on')
    flow_general = (flow_general == 'on')
    debug = (debug == 'on')

    cmd_req = {'func': 'data_control',
               'ttl': 15,
               'args': dict(generate_data=generate_data,
                            flow_general=flow_general,
                            debug=debug,
                            rreq=False)}

    resp = command_request(cmd_req, iresp=True)

    if resp is None:
        resp = dict(status=False)

    return jsonify(resp)

@admin_required
@sitename_required
def e(start_or_stop='start'):
    if start_or_stop == 'start':
        start_or_stop = 'enable_modules'
    else:
        start_or_stop = 'disable_modules'

    cmd_req = {'func': start_or_stop,
               'ttl': 15}

    resp = command_request(cmd_req, iresp=True)

    if resp is None:
        resp = dict(status=False)

    return jsonify(resp)

@admin_required
@sitename_required
def chart():
    return render_template("admin/arraytools/a_chart.html")

@admin_required
@sitename_required
def get_parameters():
    macs = request.form.getlist('macs[]')

    if not macs:
        flash('Please select some mac address')
        return redirect(url_for('index'))

    firmware = FirmwareImage.latest()

    if not firmware:
        flash("No firmware image found.")
        return redirect(url_for('index'))

    parameters = firmware.parse_parameters()

    return render_template('admin/arraytools/get_parameters.html',
                           firmware=firmware,
                           parameters=parameters,
                           macs=macs)

@admin_required
@sitename_required
def do(what):
    if what == 'broadcast_update':
        firmware = FirmwareImage.query.get_or_404(request.form['id_firmware'])
        macs = request.form.getlist('macs[]')

        commands = []

        cmd_req = {'func': 'firmware_upgrade',
                   'args': {'program': firmware.program,
                            'image_size': firmware.image_size,
                            'image_checksum': firmware.image_checksum,
                            'image_parameters': firmware.parse_parameters(True),
                            'image_timestamp': firmware.timestamp,
                            'commit': 'MCP',
                            'macaddrs': macs}}

        try:
            command_request(cmd_req)
        except IOError:
            return jsonify(dict(status=False, msg='No connection to rabbit server'))

        #for macaddr in macs:
        commands.append(dict(macaddr='SELECTED',
                             correlation_id=cmd_req['correlation_id'],
                             callback_queue=cmd_req['callback_queue']))

        return jsonify(dict(commands=commands, status=True))

    if what == 'reload':
        param_type = request.form['param_type']
        macs = request.form.getlist('macs[]')

        commands = []

        for macaddr in macs:
            for cmd in ['mcp_reload_parameters', 'dsp_reload_parameters']:
                cmd_req = {'func': cmd,
                           'ttl': 5,
                           'args': {'macaddr': macaddr}}

                try:
                    command_request(cmd_req)
                except IOError:
                    return jsonify(dict(status=False, msg='No connection to rabbit server'))

                print "Created queue", cmd_req['callback_queue']

                commands.append(dict(macaddr=macaddr,
                                     correlation_id=cmd_req['correlation_id'],
                                     callback_queue=cmd_req['callback_queue']))

        return jsonify(dict(commands=commands, status=True))

    if what.endswith('_parameters') and what.count('_') == 1:
        what = what.split('_')[0]

        param_type = request.form['param_type']
        macs = request.form.getlist('macs[]')
        parameter_keys = request.form.getlist('parameters[]')
        firmware = FirmwareImage.latest()
        parameters = firmware.parse_parameters()

        commands = []

        for param_key in parameter_keys:
            if param_key not in parameters:
                continue

            param = parameters[param_key]

            if what == 'set':
                value = request.form['value']

                try:
                    if param['parser'] == 'float':
                        value = float(value)
                    elif param['parser'] == 'int':
                        value = int(value)
                except:
                    value = None
            elif what == 'default':
                value = param['default_value']
            else:
                value = None

            for macaddr in macs:
                cmd_req = {'func': 'parameter',
                           'ttl': 300,
                           'args': {'address': param_key,
                                    'volatile': param_type == 'temp',
                                    'macaddr': macaddr,
                                    'value': value}}

                try:
                    command_request(cmd_req)
                except IOError:
                    return jsonify(dict(status=False, msg='No connection to rabbit server'))

                print "Created queue", cmd_req['callback_queue']

                commands.append(dict(macaddr=macaddr,
                                     param=param_key,
                                     correlation_id=cmd_req['correlation_id'],
                                     callback_queue=cmd_req['callback_queue']))

        return jsonify(dict(commands=commands, status=True))

    if what == 'poll':
        commands = json.loads(request.form['commands'])
        responded = []

        data = []

        for cmd in commands:
            try:
                status, resp = check_command_request(cmd)
            except:
                print "Invalidness", cmd
                status = True
                resp = dict(status=False, msg='Resp Dropped',
                            macaddr=cmd['macaddr'])

            if status is True:
                dr = dict(param=cmd.get('param'),
                                 **resp)
                if not dr.has_key('macaddr'):
                    dr['macaddr'] = cmd['macaddr']

                data.append(dr)

                responded.append(cmd)

            print "get", cmd['macaddr'], cmd.get('param'), status, resp

        return jsonify(dict(responded=responded,
                            data=data))

    if what == 'done_poll':
        commands = json.loads(request.form['commands'])

        for cmd in commands:
            clean_command_request(cmd)

        return jsonify(dict(status=True))

@admin_required
@sitename_required
def poll_parameters():
    firmware = FirmwareImage.query.get_or_404(session['rwparam']['id_firmware'])

    data = []
    finished = False

    print session

    for cmd in session['rwparam']['incomplete_commands']:
        status, resp = check_command_request(cmd)

        if status is True:
            data.append(dict(macaddr=cmd['macaddr'],
                             param=cmd['param'],
                             **resp))

            session['rwparam']['incomplete_commands'].remove(cmd)
            session['rwparam']['complete_commands'].append(cmd)

            session.modified = True

    return jsonify(dict(finished=finished, data=data))

@admin_required
@sitename_required
def broadcast_firmware():
    firmware = FirmwareImage.query.get(request.form['id_dsp_firmware'])

    if firmware is None:
        flash('Please select a firmware image file')
        return redirect(url_for('index'))

    macs = request.form.getlist('macs[]')

    if not macs:
        flash('Please select some devices for the upgrade')
        return redirect(url_for('index'))

    return render_template('admin/arraytools/broadcast_firmware.html',
                           macs=macs, firmware=firmware)

    return "hello world" + str(request.form.getlist('macs[]')) + request.form['id_dsp_firmware']

@admin_required
@sitename_required
def firmware():
    form = UploadFirmwareForm()

    if form.validate_on_submit():
        if form.firmware_file.file:
            firmware_data = form.firmware_file.file.read()

            image = FirmwareImage()
            image.parse_firmware_image_file(firmware_data)

            if image.is_valid_image():
                db.session.add(image)
                db.session.commit()
                flash('upload successful')
            else:
                flash('the upload file is corrupted', 'error')
        else:
            flash('invalid upload file', 'error')
    elif form.errors:
        for err in form.errors:
            flash(err, 'error')

    firmwares = FirmwareImage.query.all()

    return render_template("admin/arraytools/firmware.html", form=form,
                           firmwares=firmwares)

@admin_required
@sitename_required
def remove_firmware(id_firmware):
    frm = FirmwareImage.query.get_or_404(id_firmware)

    db.session.delete(frm)
    db.session.commit()

    return redirect(url_for("firmware"))

