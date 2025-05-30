document.addEventListener("DOMContentLoaded", function () {
    console.log("[🔍] Polling.js started...");

    function getStatusClass(status) {
        switch (status) {
            case "OK": return "status-ok";
            case "WARNING": return "status-warning";
            case "FAULT": return "status-fault";
            default: return "status-unknown";
        }
    }

    async function updatePanels() {
        try {
            const response = await fetch("/sitearray/test");
            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.status}`);
            }

            const data = await response.json();
            const panels = data.live_sitearray;

            const container = document.getElementById("array-map");
            container.innerHTML = "";

            panels.forEach(panel => {
                const panelDiv = document.createElement("div");
                panelDiv.className = `panel ${getStatusClass(panel.status)}`;
                panelDiv.style.transform = `translate(${panel.x}px, ${panel.y}px)`;
                panelDiv.innerText = `${panel.id} (${panel.status})`;
                container.appendChild(panelDiv);
            });

        } catch (error) {
            console.error("[❌] Error fetching sitearray data:", error);
        }
    }

    // Poll every 2 seconds
    setInterval(updatePanels, 2000);
    updatePanels();
});
