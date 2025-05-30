import datetime

from dataserver.apps.util.utctime import utcnow


def get_now( day, tz ):
    """
    Return a reasonable 'now' given the problem day being analyzed
    """
    now = utcnow().astimezone(tz)

    # if the now time is more than 48 hours later than the data date, use a better date for 'now'
    td = datetime.timedelta( days=1 )
    checkday = datetime.datetime( day.year, day.month, day.day, 0, 0, 0, tzinfo=tz)
    if (now - checkday) > (td * 2):
        now = datetime.datetime( day.year, day.month, day.day, 4, 0, 0, tzinfo=tz) + td
    return now
