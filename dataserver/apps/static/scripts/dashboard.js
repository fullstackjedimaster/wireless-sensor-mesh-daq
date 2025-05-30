"use strict";

/* global Chart */

document.addEventListener("DOMContentLoaded", function () {
    // ✅ DOM Elements
    const ctx = document.getElementById("timeSeriesChart").getContext("2d");
    const mapContainer = document.getElementById("array-map-container");

    // ✅ Configurations
    const SCALING_FACTOR = 5; // Adjust for proper node positioning
    const MAX_DATA_POINTS = 25; // Prevent infinite growth

    // ✅ State Variables
    let timeSeriesChart;

    // ===========================
    // 🚀 FETCH TIME SERIES DATA (One-time load)
    // ===========================
    async function fetchTimeSeriesData() {
        try {
            const response = await fetch("/sitedata/api/time_series_data");
            if (!response.ok) throw new Error("Failed to fetch time-series data");
            return await response.json();
        } catch (error) {
            console.error("Error fetching time-series data:", error);
            return [];
        }
    }

    // ✅ Render Time-Series Chart (Only runs once)
    async function renderTimeSeriesChart() {
        try {
            const data = await fetchTimeSeriesData();

            if (!data || data.length === 0) {
                console.error("No data available for the chart.");
                return;
            }

            // ✅ Extract timestamps & power values
            let timestamps = data.map(entry => new Date(entry.timestamp));
            let totalPower = data.map(entry => entry.total_power);

            console.log("Chart Timestamps:", timestamps);
            console.log("Chart Power Values:", totalPower);

            // ✅ Keep only last MAX_DATA_POINTS entries
            if (timestamps.length > MAX_DATA_POINTS) {
                timestamps = timestamps.slice(-MAX_DATA_POINTS);
                totalPower = totalPower.slice(-MAX_DATA_POINTS);
            }

            console.log("Final Timestamps:", timestamps);
            console.log("Final Power Values:", totalPower);

            // ✅ Initialize Chart (Only once)
            timeSeriesChart = new Chart(ctx, {
                type: "line",
                data: {
                    labels: timestamps,
                    datasets: [{
                        label: "Total Power Output (W)",
                        data: totalPower,
                        borderColor: "rgb(75, 192, 192)",
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: false, // ✅ Disable animations to prevent lag
                    layout: { padding: { bottom: 30 } },
                    scales: {
                        x: {
                            type: "time",
                            time: { unit: "second" },
                            ticks: { autoSkip: true, maxRotation: 45, minRotation: 45 },
                            title: { display: true, text: "Timestamp", padding: { top: 10 } }
                        },
                        y: {
                            title: { display: true, text: "Total Power (W)" },
                            min: 0,
                            suggestedMax: 8000
                        }
                    },
                    plugins: { legend: { display: true } }
                }
            });

        } catch (error) {
            console.error("Error rendering time-series chart:", error);
        }
    }

    // ===========================
    // 🚀 FETCH ARRAY MAP DATA (One-time load)
    // ===========================
    async function fetchArrayMapData() {
        try {
            const response = await fetch("/sitedata/api/array_map_data");
            if (!response.ok) throw new Error("Failed to fetch array map data");
            return await response.json();
        } catch (error) {
            console.error("Error fetching array map data:", error);
            return [];
        }
    }

    // ✅ Render Array Map (Only runs once)
    async function renderArrayMap() {
        try {
            const nodes = await fetchArrayMapData();
            if (!nodes.length) {
                mapContainer.innerHTML = "<p>No nodes found.</p>";
                return;
            }

            // ✅ Clear old nodes before rendering
            mapContainer.innerHTML = "";

            nodes.forEach((node) => {
                const nodeElement = document.createElement("div");
                nodeElement.className = "array-node";

                // ✅ Properly scale position to avoid infinite growth
                nodeElement.style.left = `${node.x * SCALING_FACTOR}px`;
                nodeElement.style.top = `${node.y * SCALING_FACTOR}px`;

                // ✅ Color based on status
                nodeElement.style.backgroundColor =
                    node.status === "OK" ? "green" : "red";

                nodeElement.title = `Node ${node.id} - Status: ${node.status}`;
                mapContainer.appendChild(nodeElement);
            });
        } catch (error) {
            console.error("Error rendering array map:", error);
        }
    }

    // ===========================
    // 🚀 INITIALIZE DASHBOARD
    // ===========================
    renderTimeSeriesChart(); // ❌ No refresh, runs ONCE
    renderArrayMap();        // ❌ No refresh, runs ONCE
});
