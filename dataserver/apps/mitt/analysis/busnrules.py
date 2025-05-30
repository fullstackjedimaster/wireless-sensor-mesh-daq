"""
Contains the business rules analysis and triggering

Author: Rock Howard

Copyright (c) 2011 Solar Power Technologies Inc.
"""

from apps.issue.util import notify_users
from apps.mitt.cubesets import AtSunsetExecuter

verbose = False

class NotifyUsersBusinessRule(AtSunsetExecuter):
    order = 99

    def process(self, dt, day, mgr, ctx, verbose=True):
        return None

        if verbose:
            self.logger.info( "NotifyUsersBusinessRule Invoked" )
        dt = dt.astimezone(ctx['tz']).date()

        notify_users(dt)

