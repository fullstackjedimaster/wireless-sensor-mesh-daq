// /static/scripts/modules/maps.js
"use strict";

const draw = SVG().addTo('#map').size('100%', '100%');
let panelElements = {};  // { mac: SVG rect }

// Fetch real-time panel data from the server every 2 seconds
document.addEventListener("DOMContentLoaded", () => {
  const panelUpdateInterval = 3000; // ms
  const panelClassPrefix = "status-";

  async function updatePanelStatuses() {
    try {
      const res = await fetch("/sitearray/map/status");
      const statusData = await res.json();

      statusData.forEach(panel => {
        const mac = panel.mac.toLowerCase(); // normalize
        const status = panel.status.toLowerCase(); // 'red', 'yellow', etc.
        const selector = `[data-mac="${mac}"]`;
        const panelEl = document.querySelector(selector);

        if (panelEl) {
          // Remove all status-* classes
          panelEl.classList.forEach(cls => {
            if (cls.startsWith(panelClassPrefix)) {
              panelEl.classList.remove(cls);
            }
          });

          // Add the new one
          panelEl.classList.add(`status-${status}`);
        }
      });
    } catch (err) {
      console.error("Error fetching panel status:", err);
    }
  }

  setInterval(updatePanelStatuses, panelUpdateInterval);
  updatePanelStatuses(); // First run
});


// Initial fetch and interval polling
fetchPanelStatus();
setInterval(fetchPanelStatus, 2000);
