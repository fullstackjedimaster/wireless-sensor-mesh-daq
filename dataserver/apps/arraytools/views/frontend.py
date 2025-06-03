import datetime
import glob
import re
import socket
import os

from flask import render_template, request, session, jsonify, flash, redirect, url_for, g, json, abort

from clarity_util.metakit import MetakitManager, metakit_record_to_dict
from clarity_util.data_file_processing import detokenize_groupdict
from clarity_util.utctime import utcepochnow, utcnow

from apps import db
from apps.util import sitename_required
from apps.sitedata.timeline_chart import TimeLineChart
from apps.arraytools.util import command_request
from apps.arraytools.models import EStopStatus

MODE_NORMAL = 0
MODE_ESTOP  = 3

@sitename_required
def basic_status():
    now = utcnow()
    now = now.astimezone(g.tz)

    fpath = detokenize_groupdict(dict(root='/data',
                                 integrator_id=g.mgr.array_properties['integrator'],
                                 cust_id=g.mgr.array_properties['owner'],
                                 site_id=g.mgr.sitename,
                                 year=str(now.year),
                                 month=str(now.month),
                                 day=str(now.day),
                                 device_type='daq',
                                 rollup_period='raw'))

    if not os.path.exists(fpath):
        return jsonify(dict())

    mkdb = MetakitManager(fpath)
    mkdb.open_ro()
    vw = mkdb.view('data')
    latest = vw[-1]
    record = metakit_record_to_dict(vw, latest)
    mkdb.close()

    for k,v in record.items():
        if isinstance(v, datetime.datetime):
            record[k] = v.strftime('%Y-%m-%d %I:%M %p')
        elif isinstance(v, datetime.date):
            record[k] = v.strftime('%Y-%m-%d')

    return jsonify(record)

@sitename_required
def e(start_or_stop='start', stop_in=None):
    ess = EStopStatus.query.site_status_model(create_if_null=True)

    if start_or_stop == 'start':
        start_or_stop = 'estart'
    else:
        start_or_stop = 'estop'

    ttl = request.form.get('ttl', 15)
    ttl = utcepochnow() + ttl

    timeout = request.form.get('timeout', 10)

    if start_or_stop == 'estop' \
    and stop_in is not None:
        args = dict(stop_in=stop_in)
    else:
        args = dict()

    cmd_req = {'func': start_or_stop,
               'ttl': ttl,
               'args': args}

    try:
        resp = command_request(cmd_req, timeout=timeout, iresp=True)
    except socket.error:
        resp = None

    if resp is None:
        resp = dict(status=False,
                    estopstatus=None)
    else:
        if resp.get('response') is None:
            resp['estopstatus'] = None
        else:
            resp['estopstatus'] = resp['response'] == MODE_ESTOP
            ess.status = resp['estopstatus']

            if start_or_stop == 'estart':
                ess.stop_in = None
            else:
                if stop_in is not None:
                    ess.set_stop_in(stop_in)

            db.session.commit()

    return jsonify(resp)

@sitename_required
def estat():
    return jsonify(estopstatus=EStopStatus.query.site_status(create_if_null=True))
