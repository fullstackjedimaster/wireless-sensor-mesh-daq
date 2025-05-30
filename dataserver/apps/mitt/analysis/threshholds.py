import math

from apps.issue.report_util import *

BASELINE_UNCERTAINTY = 0.0025

#: Currents from multiple monitors must be within
#: this percentage of the string current to be considered
#: for inclusion to the string calculation
#: Default less than 35% of string current
#: DO NOT FORGET TO UPDATE /util/clarity_util/handler/rollup.py
THRESHHOLD_CURRENT_PERCENTAGE = .035
THRESHHOLD_SNAPPED_DIODE = 3.5
THRESHHOLD_POWER_DROP = 95
THRESHHOLD_GROSS_POWER_DROP = 50
THRESHHOLD_VOLTAGE_DEAD_PANEL = 1.5

REMOVE_OUTLIERS = set([#POWER_DROP, SNAPPED_DIODE, GROSS_POWER_DROP,
                       OPEN_CIRCUIT,
                       DEAD_PANEL,
                       SHADING])

IRRADIANCE_NOANALYSIS_THRESHHOLD = 175
IRRADIANCE_INCLUSION_THRESHHOLD_LOW   = 0.0
IRRADIANCE_INCLUSION_THRESHHOLD_HIGH  = 1100.0
IRRADIANCE_CONFIDENT_THRESHHOLD_LOW   = 400.0
IRRADIANCE_CONFIDENT_THRESHHOLD_HIGH  = 1000.0
EFF_CONFIDENT_THRESHHOLD = .5

EFF_IRRADIANCE_THRESSHOLD = 500 # W/m2
EFF_IRRADIANCE_CONFIDENCE_THRESHHOLD = 400 # W/m2
EFF_LOWEST = 0.6 #: 1.0 == 100%

IS_OPEN_CIRCUIT_LOW = -0.5
IS_OPEN_CIRCUIT_HIGH = 0.5

#: Used to be .15, however after discussions with Jeff/Seth it was decided
#: its better to be more conservative about detecting open circuits.
IS_OPEN_CIRCUIT = .02

def get_percentage(column, record, avgrecord):
    if isinstance(column, (list, tuple)):
        columna = column[0]
        columnb = column[1]
    else:
        columna = column
        columnb = column

    if getattr(avgrecord, columnb) != 0:
        return (getattr(record, columna) / getattr(avgrecord, columnb)) * 100.0
    else:
        return 100.0

def is_projected_open_circuit(P, Pp):
    if P <= 0:
        return True
    if Pp == 0:
        return False
    return (P / Pp) < IS_OPEN_CIRCUIT

def is_open_circuit(I, V=None):
    if V is not None:
        if V == 0.0 \
        or math.isnan(V):
            return False

    if math.isnan(I):
        return True

    if I == 0.0:
        return True

    # if IS_OPEN_CIRCUIT_LOW < I < IS_OPEN_CIRCUIT_HIGH:
    #     return True

    return False

def has_dead_panel(avg_voltage, str_voltage, num_panels, printer=False):
    num_dead = 0

    for i in range(1,num_panels/2):
        real_voltage = avg_voltage * (float(num_panels)/(num_panels-i))
        thresh = avg_voltage / num_panels
        thresh /= 2

        low = real_voltage-thresh
        high = real_voltage+thresh

        if printer:
            print((i,real_voltage, avg_voltage, num_panels, thresh, low, str_voltage, high))

        if low <= str_voltage <= high:
            num_dead = i
            break

    return num_dead
