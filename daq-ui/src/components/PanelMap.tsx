import React, { useEffect, useState } from "react"
import { getLayout, getPanelStatus } from "@/hooks/usePanelLayout"

interface Panel {
    mac: string
    x: number
    y: number
}

const STATUS_COLORS: Record<string, string> = {
    normal: "fill-green-500",
    short_circuit: "fill-red-500",
    open_circuit: "fill-yellow-400",
    dead_panel: "fill-gray-600",
    low_voltage: "fill-blue-400",
    unknown: "fill-gray-400",
}

export default function PanelMap() {
    const [layout, setLayout] = useState<Panel[]>([])
    const [statuses, setStatuses] = useState<Record<string, string>>({})
    const [selectedMac, setSelectedMac] = useState<string | null>(null)

    useEffect(() => {
        let isMounted = true

        const fetchLayoutAndStatuses = async () => {
            try {
                const data = await getLayout()
                if (!Array.isArray(data)) return
                const newStatuses: Record<string, string> = {}

                for (const panel of data) {
                    const res = await getPanelStatus(panel.mac)
                    let status = "unknown"

                    if (typeof res === "object" && res !== null && "status" in res) {
                        status = (res as any).status?.toLowerCase() || "unknown"
                    } else {
                        try {
                            const parsed = JSON.parse(res)
                            status = parsed?.status?.toLowerCase() || "unknown"
                        } catch {
                            status =  "unknown"
                        }
                    }

                    newStatuses[panel.mac] = status
                }

                if (isMounted) {
                    setLayout(data)
                    setStatuses(newStatuses)
                }
            } catch (e) {
                console.error("Failed to fetch layout/statuses:", e)
            }
        }

        fetchLayoutAndStatuses()
        const interval = setInterval(fetchLayoutAndStatuses, 2000)
        return () => {
            isMounted = false
            clearInterval(interval)
        }
    }, [])

    return (
        <div className="flex justify-center">
            <svg width="240" height="200" viewBox="0 0 240 200" className="bg-white dark:bg-gray-800 rounded shadow">
                {layout.map((panel, idx) => {
                    const x = panel.x
                    const y = panel.y
                    const mac = panel.mac.toLowerCase()
                    const status = statuses[mac] || "unknown"
                    const fillClass = STATUS_COLORS[status] || STATUS_COLORS.unknown

                    return (
                        <g key={idx} onClick={() => setSelectedMac(mac)} className="cursor-pointer transition-all">
                            <rect
                                x={x}
                                y={y}
                                width={60}
                                height={40}
                                className={fillClass + " stroke-black"}
                            />
                            <title>{`MAC: ${mac}\nStatus: ${status}`}</title>
                        </g>
                    )
                })}
            </svg>
        </div>
    )
}
