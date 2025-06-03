import os, sys
import unittest
import tempfile
from flaskext.testing import TestCase

from apps import create_app, db

app = create_app(config='etc/testing.cfg')

class ArrayToolsTestCase(TestCase):

    TESTING = True

    def create_app(self):
        return app

    def setUp(self):
        db.drop_all()
        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()

    def test_runs(self):
        pass

if __name__ == '__main__':
    unittest.main()
