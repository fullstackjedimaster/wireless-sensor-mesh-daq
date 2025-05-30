"""
Utility functions to support Redis-based Business Rules
"""

def wb_get(ctx, label, org, default=None):
    """
    Return the whiteboard value for the org.
    If not found, check the 'ALL' section.
    """
    org = org.upper() if org else "ALL"
    return ctx["wb"].get(org, {}).get(label, ctx["wb"].get("ALL", {}).get(label, default))


def wb_get_title(ctx, is_alert, org, default=None):
    """
    Return the appropriate alert or warning title.
    """
    return wb_get(ctx, "AlertTitle" if is_alert else "WarningTitle", org, default)


def wb_get_message(ctx, is_alert, org, default=None):
    """
    Return the appropriate alert or warning message.
    """
    return wb_get(ctx, "AlertMsg" if is_alert else "WarningMsg", org, default)


def get_currency_symbol(ctx, org, mgr):
    """
    Get the currency symbol for the organization.
    If not cached in Redis, retrieve from the manager.
    """
    currency_symbol = wb_get(ctx, "CurrencySymbol", org)
    if currency_symbol is None:
        currency_symbol = mgr.property("CurrencySymbol")
        ctx["wb"].setdefault(org, {})["CurrencySymbol"] = currency_symbol
    return currency_symbol


def get_percentage(value):
    """
    Convert percentage-like strings to floats.
    Examples:
        "3.2%"  → 0.032
        "2.1"   → 0.021
        "0.025" → 0.00025 (careful!)
    """
    if "%" in value:
        return float(value.strip("%")) / 100.0
    return float(value) / 100.0


def get_boolean(value):
    """
    Convert common boolean-like strings to True/False.
    """
    value = value.lower()
    return value in {"true", "yes", "t", "y"}


#
# Functions supporting payback and cost calculations
#

def lost_watts_cost(kwatt_value, inst_watts_lost, dt, mgr, ctx):
    """
    Calculate lost dollars per day based on instantaneous power loss.
    Assumes a daily sunlight duration of 5 hours.
    """
    daily_sun = 5.0  # Default daily sunlight duration (FIXME: Make dynamic?)
    return daily_sun * kwatt_value * (inst_watts_lost / 1000.0)


def payback_days(cost, kwatt_value, inst_watt_loss, dt, mgr, ctx):
    """
    Calculate payback period in days based on cost and power loss.
    If power loss is negligible, return an arbitrarily high value.
    """
    if inst_watt_loss < 1.0:
        return 10000
    daily_loss = lost_watts_cost(kwatt_value, inst_watt_loss, dt, mgr, ctx)
    return int(round(cost / daily_loss))


def loss_threshold(cost, kwatt_value, payback_days, dt, mgr, ctx):
    """
    Calculate the maximum allowable daily lost watt-hours before payback becomes impractical.
    """
    daily_sun = 5.0  # Default daily sunlight duration
    return (cost * 1000.0) / (daily_sun * kwatt_value * float(payback_days))
