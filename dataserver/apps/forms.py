from flask_wtf import Form
from flask_wtf import PasswordField
from flask_wtf import TextField


class LoginForm(Form):
    email      = TextField('Email Address')
    password   = PasswordField('Password')

