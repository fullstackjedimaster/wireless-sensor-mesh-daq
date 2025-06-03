import datetime
import functools
import time

from sqlalchemy.orm import relationship, synonym, backref
from sqlalchemy.util import classproperty

from flask import g, redirect, request, url_for, current_app, session, abort

from flaskext.sqlalchemy import BaseQuery

from clarity_util.crypto import crypt
from clarity_util.utctime import utcnow

from apps import db
from apps.sitedata.models import SiteData

class EStatusQuery(BaseQuery):
    def site_status_model(self, create_if_null=True):
        qry = self.filter(EStopStatus.id_sitedata == g.mgr.site_id()).first()

        if qry:
            return qry
        elif create_if_null:
            ess = EStopStatus()
            ess.id_sitedata = g.mgr.site_id()

            db.session.add(ess)
            db.session.commit()

            return ess
        else:
            return None

    def site_status(self, create_if_null=True):
        obj = self.site_status_model(create_if_null=create_if_null)

        if obj:
            if obj.stop_in is not None:
                if obj.stop_in < utcnow():
                    obj.status = False
                    obj.stop_in = None
                    db.session.commit()

            return obj.status
        else:
            return None

class EStopStatus(db.Model):
    query_class = EStatusQuery

    id              = db.Column(db.Integer, primary_key=True)
    id_sitedata     = db.Column(db.Integer, db.ForeignKey(SiteData.id))
    updated_on      = db.Column(db.DateTime(), default=utcnow, onupdate=utcnow)
    status          = db.Column(db.Boolean, default=False)
    stop_in         = db.Column(db.DateTime())

    sitearray = db.relationship(SiteData)

    def set_stop_in(self, stop_in):
        self.stop_in = utcnow() + datetime.timedelta(seconds=stop_in)

class FirmwareImage(db.Model):
    id              = db.Column(db.Integer, primary_key=True)
    timestamp       = db.Column(db.Integer)
    version         = db.Column(db.String(120), unique=True)
    device_type     = db.Column(db.String(10))
    firmware_type   = db.Column(db.String(10))
    program         = db.Column(db.Text())
    image_size      = db.Column(db.String(4))
    image_checksum  = db.Column(db.String(4))
    parameters      = db.Column(db.Text())
    uploaded_on     = db.Column(db.DateTime(), default=utcnow)

    @staticmethod
    def latest():
        firmware = FirmwareImage.query.order_by(FirmwareImage.id.desc()) \
                                  .limit(1) \
                                  .first()
        return firmware

    @staticmethod
    def parse_section(lines, section_name, _raw=False, _strip=False):
        try:
            start_index = lines.index('SECTION %s' % section_name)
            end_index = lines[start_index:].index('END SECTION') + start_index

            # cut out the section
            data = lines[start_index+1:end_index]

            if _strip:
                data = [x.strip() for x in data
                        if x.strip()]

            if _raw:
                return data

            return ''.join(data)
        except ValueError:
            return None

    def is_valid_image(self):
        return True # FIXME: should perform actual sanity checks

    def parse_firmware_image_file(self, text):
        text = text.replace('\r\n', '\n')
        lines = text.split('\n')

        self.timestamp = int(FirmwareImage.parse_section(lines, 'TIMESTAMP', _strip=True))
        self.version = FirmwareImage.parse_section(lines, 'VERSION', _strip=True)
        self.device_type = FirmwareImage.parse_section(lines, 'DEVICE_TYPE', _strip=True)
        self.firmware_type = FirmwareImage.parse_section(lines, 'FIRMWARE_TYPE', _strip=True)
        self.program = FirmwareImage.parse_section(lines, 'PROGRAM', _strip=True)
        self.image_size = FirmwareImage.parse_section(lines, 'IMAGE_SIZE', _strip=True)
        self.image_checksum = FirmwareImage.parse_section(lines, 'IMAGE_CHECKSUM', _strip=True)
        parameters = FirmwareImage.parse_section(lines, 'TABLE', _raw=True)
        self.parameters = '\n'.join(parameters)

    def parse_parameters(self, daq_format=False):
        params = {}

        for i,param in enumerate(self.parameters.split('\n')):
            tokens = param.strip().split(' ')

            address = tokens[0]
            default_value = tokens[1]
            data_type = tokens[2]
            parser = tokens[3]
            label = ' '.join(tokens[4:]).strip('"')

            if parser == 'integer':
                default_value = int(default_value)
            elif parser == 'float':
                default_value = float(default_value)

            params[label] = dict(address=address,
                                 default_value=default_value,
                                 data_type=data_type,
                                 parser=parser)

        if daq_format:
            relabled = dict()

            for label, map in params.items():
                relabled[map['address']] = dict(label=label,
                                                default=map['default_value'],
                                                parser=map['parser'],
                                                data_type=map['data_type'])

            params = relabled

        return params

