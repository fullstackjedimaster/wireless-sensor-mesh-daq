// components/FaultInjectionControls.tsx
import React, { useState } from 'react'

const panels = [
    { id: "fa:29:eb:6d:87:01", label: "Panel 1" },
    { id: "fa:29:eb:6d:87:02", label: "Panel 2" },
    { id: "fa:29:eb:6d:87:03", label: "Panel 3" },
    { id: "fa:29:eb:6d:87:04", label: "Panel 4" },
]

const faults = [
    "normal",
    "short_circuit",
    "open_circuit",
    "low_voltage",
    "dead_panel",
    "random",
]

export default function FaultInjectionControls() {
    const [selectedPanel, setSelectedPanel] = useState(panels[0].id)
    const [selectedFault, setSelectedFault] = useState("normal")

    const injectFault = async () => {
        const res = await fetch("/daq-demo/api/inject_fault", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ macaddr: selectedPanel, fault: selectedFault }),
        })
        console.log("Inject result:", await res.json())
    }

    return (
        <div className="bg-white p-4 rounded-lg shadow space-y-4">
            <h2 className="text-lg font-semibold text-gray-700">Inject Fault</h2>

            <div className="space-y-2">
                <select
                    value={selectedPanel}
                    onChange={(e) => setSelectedPanel(e.target.value)}
                    className="w-full p-2 border rounded"
                >
                    {panels.map((panel) => (
                        <option key={panel.id} value={panel.id}>{panel.label}</option>
                    ))}
                </select>

                <select
                    value={selectedFault}
                    onChange={(e) => setSelectedFault(e.target.value)}
                    className="w-full p-2 border rounded"
                >
                    {faults.map((f) => (
                        <option key={f} value={f}>{f}</option>
                    ))}
                </select>
            </div>

            <button
                onClick={injectFault}
                className="bg-blue-700 hover:bg-blue-800 text-white py-2 px-4 rounded"
            >
                Inject
            </button>
        </div>
    )
}
