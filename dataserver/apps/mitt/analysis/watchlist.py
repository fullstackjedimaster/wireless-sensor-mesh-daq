
from apps.issue.report_util import *


def wrap_fault_funcs(ctx):

    def fault_clear_for(graph_keys, freezetime, *categories, **kwargs):
        if not isinstance(graph_keys, (list, tuple, dict)):
            graph_keys = [graph_keys]

        for graph_key in graph_keys:
            for category in categories:
                if freezetime not in ctx['faults']:
                    ctx['faults'][freezetime] = {}

                if graph_key not in ctx['faults'][freezetime]:
                    ctx['faults'][freezetime][graph_key] = {}

                if category not in ctx['faults'][freezetime][graph_key]:
                    ctx['faults'][freezetime][graph_key][category] = {}

                info = ctx['faults'][freezetime][graph_key][category]

                if 'extras' not in info:
                    info['extras'] = {}

                #: This issue should not have been flagged
                info['flagged'] = False
                #: Tell issue resolver to immediatly resolve any issue
                #: for this guy that may be active in postgres.
                info['resolve'] = True#kwargs.get('resolve', False)

    def _log_fault(graph_keys, freezetime, categories, extras, flagged):
        if not isinstance(graph_keys, (list, tuple, dict)):
            graph_keys = [graph_keys]

        if freezetime not in ctx['faults']:
            ctx['faults'][freezetime] = {}

        for graph_key in graph_keys:
            if graph_key not in ctx['faults'][freezetime]:
                ctx['faults'][freezetime][graph_key] = {}

            for category in categories:
                ctx['faults'][freezetime][graph_key][category] = {'extras': extras,
                                                                  'flagged': flagged}

    def fault_watch(graph_keys, freezetime, *categories,  **extras):
        _log_fault(graph_keys, freezetime, categories, extras, True)

    def fault_ok(graph_keys, freezetime, *categories, **extras):
        _log_fault(graph_keys, freezetime, categories, extras, False)

    return fault_clear_for, fault_ok, fault_watch
