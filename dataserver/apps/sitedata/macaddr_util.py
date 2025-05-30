from apps.sitedata.models import Macaddr


def array_macaddrs( sitedata_id, dt=None ):
    """
    Return macaddrs for a sitedata for a given date.
    If dt is None, then return currently commissioned macaddrs.
    Return macaddrs in an array.
    """
    result = []
    if dt == None:
        devices = Macaddr.query.filter_by( sitedata_id=sitedata_id, decomm_date=None ).order_by( Macaddr.target )
        for device in devices:
            if device.comm_date != None:
                result.append( device.macaddr )
    else:
        devices = Macaddr.query.filter_by( sitedata_id=sitedata_id ).order_by( Macaddr.target )
        for device in devices:
            comm_date = device.comm_date
            decomm_date = device.decomm_date
            if comm_date != None and comm_date <= dt:
                if decomm_date == None or dt <= decomm_date:
                    result.append( device.macaddr )
    return result

def array_macaddr_dict( sitedata_id, dt=None ):
    """
    Return macaddrs for a sitedata for a given date.
    If dt is None, then return currently commissioned macaddrs.
    Return macaddrs as a dict with the macaddr as the key and
    and the value as a tuple with devtype and target.
    """
    result = {}
    if dt == None:
        devices = Macaddr.query.filter_by( sitedata_id=sitedata_id, decomm_date=None ).order_by( Macaddr.target )
        for device in devices:
            if device.comm_date != None:
                result[ device.macaddr ] = (device.devtype, device.target)
    else:
        devices = Macaddr.query.filter_by( sitedata_id=sitedata_id ).order_by( Macaddr.target )
        for device in devices:
            comm_date = device.comm_date
            decomm_date = device.decomm_date
            if comm_date != None and comm_date <= dt:
                if decomm_date == None or dt <= decomm_date:
                    result[ device.macaddr ] = (device.devtype, device.target)
    return result

