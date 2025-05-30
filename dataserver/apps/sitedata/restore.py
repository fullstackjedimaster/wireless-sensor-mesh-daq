import simplejson
from apps.sitedata.access_utils import clean_json
from apps.sitedata.access_utils import load_business_rules_from_dict
from apps.sitedata.access_utils import load_device_history_from_dict
from apps.sitedata.access_utils import load_device_types_from_dict
from apps.sitedata.access_utils import load_node_from_dict
from apps.sitedata.access_utils import load_zones_from_dict


def restore_to_redis_from_json( json_sitedata, client=None, verbose=False ):
    """
    Restore the Redis SiteArray from json data.
    """
    # if verbose:
    #     print json_sitedata
    json_data = simplejson.loads( json_sitedata )
    # if verbose:
    #     print json_data
    clean_json_data = clean_json( json_data ) # get rid of unicode encoding
    # if verbose:
    #     print clean_json_data

    # try:
    if True:
        if "jsondevs" in client:
            del(client["jsondevs"])
        load_node_from_dict( clean_json_data["sitearray"], client=client, verbose=verbose )
        if "zones" in clean_json_data:
            load_zones_from_dict( clean_json_data["zones"], client=client, verbose=verbose )
        if "devices" in clean_json_data:
            load_device_types_from_dict( clean_json_data["devices"], client=client, verbose=verbose )
        if "history" in clean_json_data:
            load_device_history_from_dict( clean_json_data["history"], client=client, verbose=verbose )
        if "busnrules" in clean_json_data:
            load_business_rules_from_dict( clean_json_data["busnrules"], client=client, verbose=verbose )
    # except:
    #     return False

    return True

