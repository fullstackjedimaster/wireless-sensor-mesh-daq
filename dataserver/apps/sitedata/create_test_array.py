from apps.sitedata.access import DeviceNode
from apps.sitedata.access import GraphManager


def create_simple_array():
    # Initialize the GraphManager to interact with Redis
    gm = GraphManager()

    # Create the Inverter node
    inverter = DeviceNode(devtype='INVERTER', label='Inverter 1')
    gm.add_node(inverter)

    # Create the String node and connect it to the Inverter
    string = DeviceNode(devtype='STRING', label='String 1', parent=inverter)
    gm.add_node(string)

    # Create Panel 1 and connect it to the String
    panel1 = DeviceNode(devtype='PANEL', label='Panel 1', parent=string)
    panel1.set_prop('offset_x', 0)
    panel1.set_prop('offset_y', 0)
    gm.add_node(panel1)

    # Create Panel 2 and connect it to the String
    panel2 = DeviceNode(devtype='PANEL', label='Panel 2', parent=string)
    panel2.set_prop('offset_x', 1)  # Positioned next to Panel 1
    panel2.set_prop('offset_y', 0)
    gm.add_node(panel2)

    print("Array created successfully in Redis.")

create_simple_array()
