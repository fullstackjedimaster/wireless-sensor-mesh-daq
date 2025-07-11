// components/ControlPanel.tsx
import { useState } from "react"

const panelOptions = [
    { mac: "fa:29:eb:6d:87:01", label: "Panel 1" },
    { mac: "fa:29:eb:6d:87:02", label: "Panel 2" },
    { mac: "fa:29:eb:6d:87:03", label: "Panel 3" },
    { mac: "fa:29:eb:6d:87:04", label: "Panel 4" },
]

const faultOptions = [
    { value: "short_circuit", label: "Short Circuit" },
    { value: "open_circuit", label: "Open Circuit" },
    { value: "low_voltage", label: "Low Voltage" },
    { value: "dead_panel", label: "Dead Panel" },
    { value: "random", label: "Random" },
    { value: "reset", label: "✅ Reset to Normal" },
]

export default function ControlPanel() {
    const [selectedPanel, setSelectedPanel] = useState("")
    const [fault, setFault] = useState("")
    const [message, setMessage] = useState("")

    const injectFault = async () => {
        if (!selectedPanel || !fault) return
        try {
            const res = await fetch("http://localhost:8000/daq-demo/api/inject_fault", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mac: selectedPanel, fault }),
            })
            if (!res.ok) throw new Error("Fault injection failed")
            setMessage("✅ Fault injected!")
        } catch {
            setMessage("❌ Failed to inject fault")
        }
    }

    const clearAllFaults = async () => {
        try {
            const res = await fetch("http://localhost:8000/daq-demo/api/clear_all_faults", {
                method: "POST",
            })
            if (!res.ok) throw new Error("Clear failed")
            setMessage("✅ All faults cleared")
        } catch {
            setMessage("❌ Failed to clear faults")
        }
    }

    return (
        <div className="space-y-4">
            <select
                value={selectedPanel}
                onChange={(e) => setSelectedPanel(e.target.value)}
                className="w-full p-2 border rounded"
            >
                <option value="">Choose a Panel</option>
                {panelOptions.map((opt) => (
                    <option key={opt.mac} value={opt.mac}>
                        {opt.label}
                    </option>
                ))}
            </select>

            <select
                value={fault}
                onChange={(e) => setFault(e.target.value)}
                className="w-full p-2 border rounded"
            >
                <option value="">Choose a Fault</option>
                {faultOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>

            <div className="flex flex-col space-y-2">
                <button
                    onClick={injectFault}
                    className="w-full bg-red-600 text-white rounded px-4 py-2 font-bold"
                >
                    Inject Fault
                </button>
                <button
                    onClick={clearAllFaults}
                    className="w-full bg-gray-700 text-white rounded px-4 py-2 font-bold"
                >
                    Clear All Faults
                </button>
            </div>

            {message && <div className="mt-2 italic text-sm text-center">{message}</div>}
        </div>
    )
}
