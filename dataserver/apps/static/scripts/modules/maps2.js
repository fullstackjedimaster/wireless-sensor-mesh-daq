const API_URL = "/sitedata/api/array_map_data"; // FastAPI endpoint

async function fetchArrayData() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        updateArrayMap(data.sitearray);
    } catch (error) {
        console.error("Error fetching array data:", error);
    }
}

function updateArrayMap(panels) {
    panels.forEach(panel => {
        let node = document.getElementById(panel.id);
        if (node) {
            node.style.fill = getStatusColor(panel.status);
            node.setAttribute("data-voltage", panel.voltage);
            node.setAttribute("data-current", panel.current);
            node.setAttribute("data-power", panel.power);
            node.setAttribute("data-alert", panel.alert);
        } else {
            console.warn(`[ARRAY MAP] Panel ${panel.id} not found in the DOM`);
        }
    });
}

function getStatusColor(status) {
    switch (status) {
        case "OK": return "green";
        case "WARNING": return "yellow";
        case "FAULT": return "red";
        default: return "gray";
    }
}

// Fetch data every 5 seconds
setInterval(fetchArrayData, 5000);
fetchArrayData(); // Initial load
