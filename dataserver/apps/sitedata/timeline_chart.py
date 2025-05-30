import csv
import io

from apps.mkdata.util import csvify
from apps.mkdata.util import date_ranged_mkfiles
from apps.mkdata.util import get_mkfiles
from apps.sitedata.access_utils import get_human_readable
from apps.sitedata.util import sort_row_data
from fastapi.responses import JSONResponse
from fastapi.responses import StreamingResponse
from jinja2 import Template
from starlette.responses import HTMLResponse


class TimeLineChart:
    """
    A convenience mechanism that enforces properly formatted data for timeline charts.

    Typical use:
        chart = TimeLineChart(cubetype, cols)
        for mkfile in chart.mkfiles:
            my_data = my_fetch_function(mkfile, chart.cubetype, chart.cols, ...)
            chart.add_file_data(mkfile, my_data)
        return chart.as_json()
    """

    def __init__(self, cubetype, cols, period="300", find_mkfiles=True, min_date=None, max_date=None, data_dir=None):
        self.data_array = []
        self.xaxis = "Missing Data"
        self.cubetype = cubetype
        self.cols = cols
        self.period = period
        self.node_id = "SA-1"
        self.has_nodes = False

        if "env" in cubetype:
            self.node_id = "ESI-1"

        if find_mkfiles:
            if min_date is not None and max_date is not None:
                self.mkfiles = date_ranged_mkfiles(min_date, max_date, cubetype, period, data_dir=data_dir)
            else:
                self.mkfiles = get_mkfiles(cubetype, period)
        else:
            self.mkfiles = []

        if len(self.mkfiles) < 1:
            self.xaxis = "No Data Files"

    def add_data(self, date_label, file_data, has_nodes):
        """
        Generally not called directly.
        Use add_file_data() or add_db_data() instead.
        """
        if has_nodes:
            self.has_nodes = True
            self.data_array.append((date_label, file_data))
        else:
            node_array = [(self.node_id, file_data)]
            self.data_array.append((date_label, node_array))
        self.xaxis = "Time"

    def add_file_data(self, mkfile, file_data, has_nodes=False):
        """
        Adds the data culled from an mkfile.
        """
        date_label = f"{mkfile.date.year}-{mkfile.date.month:02d}-{mkfile.date.day:02d}"
        self.add_data(date_label, file_data, has_nodes=has_nodes)

    def add_db_data(self, dt, db_data, has_nodes=False):
        """
        Add data directly from the database.
        """
        date_label = f"{dt.year}-{dt.month:02d}-{dt.day:02d}"
        self.add_data(date_label, db_data, has_nodes=has_nodes)

    def as_json(self):
        """
        Return the chart data as a JSON response.
        """
        return JSONResponse(
            content={
                "cubetype": self.cubetype,
                "xaxis": self.xaxis,
                "cols": self.cols,
                "period": self.period,
                "data": self.data_array,
            }
        )

    def as_csv(self, filename="DeviceTimeline.csv", client=None):
        """
        Return the chart data as a CSV file.
        """
        csvcols = ["Time", "Device"]
        csvcols.extend(self.cols)

        # Flatten data for CSV
        flattened_data = self.flattened_data(client=client)

        # Use StreamingResponse for CSV output
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(csvcols)  # Write headers
        writer.writerows(flattened_data)  # Write rows
        output.seek(0)

        return StreamingResponse(
            output,
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    def as_html_report(self, header="Report", client=None):
        """
        Return the chart data as an HTML report.
        """
        csvcols = ["Time", "Device"]
        csvcols.extend(self.cols)

        # Flatten data for HTML rendering
        flattened_data = self.flattened_data(client=client)

        # Jinja2 template for rendering
        template = Template(
            """
            <html>
                <head><title>{{ header }}</title></head>
                <body>
                    <h1>{{ header }}</h1>
                    <table border="1">
                        <thead>
                            <tr>
                                {% for col in cols %}
                                    <th>{{ col }}</th>
                                {% endfor %}
                            </tr>
                        </thead>
                        <tbody>
                            {% for row in data %}
                                <tr>
                                    {% for cell in row %}
                                        <td>{{ cell }}</td>
                                    {% endfor %}
                                </tr>
                            {% endfor %}
                        </tbody>
                    </table>
                </body>
            </html>
            """
        )
        rendered_html = template.render(header=header, cols=csvcols, data=flattened_data)
        return HTMLResponse(content=rendered_html)

    def get_label(self, node_id, client=None):
        """
        Get a human-readable label for the device.
        """
        if node_id.startswith("A:"):
            return node_id
        if client is None:
            client = "redis_client_placeholder"
        return get_human_readable(node_id, client=client)

    def flattened_data(self, client=None):
        """
        Flatten the data array so it can be emitted to CSV or HTML.
        """
        if client is None:
            client = "redis_client_placeholder"
        node_names = {}
        data = []

        for date_label, node_array in self.data_array:
            for node_id, file_data in node_array:
                if node_id not in node_names:
                    node_names[node_id] = self.get_label(node_id, client)
                for row in file_data:
                    time_label = row[0]
                    outrow = [date_label, time_label, node_names[node_id]]
                    outrow.extend(row[1:])
                    data.append(outrow)

        if len(data) > 0:
            data = sort_row_data(data)
        return data
