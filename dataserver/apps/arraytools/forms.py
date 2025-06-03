import re

from wtforms import validators, widgets

from flaskext.wtf import Form, Required, FileField, SelectMultipleField

class MultiCheckboxField(SelectMultipleField):
    widget = widgets.ListWidget(prefix_label=False)
    option_widget = widgets.CheckboxInput()

class UploadFirmwareForm(Form):
    firmware_file = FileField("Firmware Image File")

    def validate_firmware_file(self, field):
        if field.data:
            field.data = re.sub(r'[^a-z0-9_.-]', '_', field.data)

class SelectParameterForm(Form):
    parameters = MultiCheckboxField("Parameters")

    def __init__(self, parameter_options, *args, **kwargs):
        super(SelectParameterForm, self).__init__(*args, **kwargs)

        self.parameters.choices = parameter_options
