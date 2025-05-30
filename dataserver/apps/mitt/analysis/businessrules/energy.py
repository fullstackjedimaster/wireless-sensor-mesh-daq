"""
Business rules associated with energy calculations:
    - Defining or calculating energy values
    - Examining threshold energy performance
    - Performing PPA-based rules

Author: Rock Howard
Converted to HDF5 by [Your Name]

Copyright (c) 2012-2025 Solar Power Technologies Inc.
"""

import datetime
from mitt.cubesets import CubeBase
from mitt.analysis.businessrules.util import get_currency_symbol, get_percentage


class EnergyValueRedisRule(CubeBase):
    """
    Calculate the energy value and store it in the Redis-based context.

    For some sites, this is an estimate; for others, it is hard-wired.

    The base rate can be adjusted via:
        - A service rate added to the base rate (adjustable via an annual escalator)
        - A base rate multiplier
        - A base rate annual escalator

    """

    def process(self, dt, day, mgr, ctx, params, verbose=False):
        """
        Calculate the energy value and store it in `ctx["wb"]`.
        """
        if verbose:
            self.logger.info("In EnergyValueRedisRule")

        org = params.get("org")

        currency_symbol = get_currency_symbol(ctx, org, mgr)
        if currency_symbol is None:
            return False

        # Default to 10 cents per kWh
        base_kwh_value = 0.1
        if "BaseKWhValue" in params:
            base_kwh_value_str = params["BaseKWhValue"].lstrip(currency_symbol)
            try:
                base_kwh_value = float(base_kwh_value_str)
            except ValueError:
                return False

        # Service rate adjustments
        service_rate = 0.0
        if "ServiceRate" in params:
            try:
                service_rate_str = params["ServiceRate"].lstrip(currency_symbol)
                service_rate = float(service_rate_str)
            except ValueError:
                self.logger.error(f"Failed to convert service rate: {params['ServiceRate']}")
                return False

            service_rate_escalator = 1.0
            if "ServiceRateEscalator" in params:
                try:
                    service_rate_annual_escalator = get_percentage(params["ServiceRateEscalator"])
                except ValueError:
                    self.logger.error(f"Invalid ServiceRateEscalator: {params['ServiceRateEscalator']}")
                    return False

                if not (0.0 <= service_rate_annual_escalator <= 0.10):
                    self.logger.error(f"Service rate escalator out of range: {service_rate_annual_escalator}")
                    return False

                service_rate_start_date = params.get("ServiceRateEscalatorStartDate", mgr.property("commission_date", "2012-01-01"))
                pdt = datetime.datetime.strptime(service_rate_start_date, "%Y-%m-%d")

                years = (datetime.datetime.now() - pdt).days // 365
                for _ in range(years):
                    service_rate_escalator *= (1.0 + service_rate_annual_escalator)

                service_rate *= service_rate_escalator

        base_kwh_value += service_rate

        # Multiplier adjustments
        multiplier = 1.0
        if "KWhMultiplier" in params:
            try:
                multiplier = float(params["KWhMultiplier"])
            except ValueError:
                self.logger.error(f"Invalid KWhMultiplier: {params['KWhMultiplier']}")
                return False

        adjusted_kwh_value = multiplier * base_kwh_value

        # Annual escalator
        escalator = 1.0
        if "KWhEscalator" in params:
            try:
                annual_escalator = get_percentage(params["KWhEscalator"])
            except ValueError:
                self.logger.error(f"Invalid KWhEscalator: {params['KWhEscalator']}")
                return False

            if not (0.0 <= annual_escalator <= 0.10):
                self.logger.error(f"Annual escalator out of range: {annual_escalator}")
                return False

            start_date = params.get("KWhEscalatorStartDate", mgr.property("commission_date", "2012-01-01"))
            pdt = datetime.datetime.strptime(start_date, "%Y-%m-%d")

            years = (datetime.datetime.now() - pdt).days // 365
            for _ in range(years):
                escalator *= (1.0 + annual_escalator)

            if verbose:
                self.logger.info(f"Escalator applied: {escalator}")

        ctx["wb"][org]["KWhValue"] = adjusted_kwh_value * escalator

        if "KWhValue" not in ctx["wb"][org]:
            return False

        if verbose:
            self.logger.info(f"Whiteboard after EnergyValue: {ctx['wb']}")

        return True


SupportedMessagesTypes = ["KWhLoss"]


class DailyEnergyLossMessageRedisRule(CubeBase):
    """
    Set up the message to use for energy loss summary statements.
    """

    def process(self, dt, day, mgr, ctx, params, verbose=False):
        """
        Set the energy loss string in `ctx["wb"]`.
        """
        if verbose:
            self.logger.info("In DailyEnergyLossMessageRedisRule")

        org = params.get("org")

        for msgtype in SupportedMessagesTypes:
            if msgtype in params:
                bool_value = params[msgtype].lower()
                if bool_value in {"true", "yes"}:
                    msg = params.get(f"{msgtype}Msg")
                    ctx["wb"][org]["EnergyLossMsgType"] = msgtype
                    ctx["wb"][org]["EnergyLossMsg"] = msg
                    break

        if verbose:
            self.logger.info(f"Whiteboard after DailyEnergyLossMessage: {ctx['wb']}")

        return True
