import subprocess
import re
from dataserver.apps.util.utctime import utcepochnow
from dataserver.apps.util.mq import DAQClient

def naturalsorted(L, reverse=False):
    """
    Performs a natural text sort instead of an ASCII sort.
    """
    convert = lambda text: ('', int(text) if text.isdigit() else (text, 0))
    alphanum = lambda key: [ convert(c) for c in re.split('([0-9]+)', key) ]
    return sorted(L, key=alphanum, reverse=reverse)



