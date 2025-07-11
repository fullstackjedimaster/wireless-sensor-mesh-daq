// src/components/InjectionPanel.tsx
import { useState } from "react"

const FAULTS = [
    "short_circuit",
    "open_circuit",
    "low_voltage",
    "dead_panel",
    "normal"
]

export default function InjectionPanel() {
    const [panelId, setPanelId] = useState("fa:29:eb:6d:87:01")
    const [fault, setFault] = useState("short_circuit")
    const [status, setStatus] = useState("")

    const injectFault = async () => {
        try {
            const res = await fetch("http://localhost:8000/daq-demo/api/inject_fault", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: panelId, fault })
            })

            if (res.ok) {
                setStatus(`✅ Injected ${fault} into ${panelId}`)
                playSuccessBeep()
            } else {
                setStatus(`❌ Failed to inject fault`)
                playErrorBeep()
            }
        } catch (err) {
            console.error(err)
            setStatus("🚨 Error injecting fault")
            playErrorBeep()
        }
    }

    return (
        <div className="p-4 bg-white rounded-lg shadow-md space-y-4">
            <h2 className="text-lg font-semibold text-slate-700">🔧 Inject Fault</h2>

            <div className="flex flex-col gap-2">
                <label className="text-sm text-slate-600">Panel ID:</label>
                <input
                    className="border rounded px-2 py-1"
                    value={panelId}
                    onChange={(e) => setPanelId(e.target.value)}
                />
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-sm text-slate-600">Fault Type:</label>
                <select
                    className="border rounded px-2 py-1"
                    value={fault}
                    onChange={(e) => setFault(e.target.value)}
                >
                    {FAULTS.map((f) => (
                        <option key={f} value={f}>{f}</option>
                    ))}
                </select>
            </div>

            <button
                onClick={injectFault}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
                Inject
            </button>

            {status && <p className="text-sm text-slate-600">{status}</p>}
        </div>
    )
}

function playSuccessBeep() {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = "square"
    osc.frequency.value = 880
    gain.gain.value = 0.1
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.2)
}

function playErrorBeep() {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = "sawtooth"
    osc.frequency.value = 220
    gain.gain.value = 0.15
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.4)
}
