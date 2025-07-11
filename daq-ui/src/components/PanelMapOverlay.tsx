"use client"

import React, { useEffect, useState } from "react"
import { getLayout, getPanelStatus } from "@/hooks/usePanelLayout"
import { useFaultStatus, StatusCard } from "smart-ui"

interface PanelInfo {
    mac: string
    x: number
    y: number
}

interface Props {
    selectedMac: string
    onPanelClick: (mac: string) => void
    width?: number
    height?: number
    showStatusCard?: boolean
}

const statusColorMap: Record<string, string> = {
    normal: "#22c55e",
    low_voltage: "#facc15",
    dead_panel: "#dc2626",
    short_circuit: "#db2777",
    open_circuit: "#9333ea",
    unknown: "#9ca3af",
}

export const PanelMapOverlay: React.FC<Props> = ({
                                                     selectedMac,
                                                     onPanelClick,
                                                     width = 300,
                                                     height = 300,
                                                     showStatusCard = false,
                                                 }) => {
    const [layout, setLayout] = useState<PanelInfo[]>([])
    const [statuses, setStatuses] = useState<Record<string, string>>({})
    const { profile } = useFaultStatus()

    useEffect(() => {
        const fetchLayout = async () => {
            const data = await getLayout()
            setLayout(data)
        }
        fetchLayout()
    }, [])

    useEffect(() => {
        const fetchStatuses = async () => {
            const newStatuses: Record<string, string> = {}
            for (const panel of layout) {
                try {
                    const raw = await getPanelStatus(panel.mac)
                    let status = "unknown"
                    if (typeof raw === "object" && raw !== null && "status" in raw) {
                        status = (raw as any).status?.toLowerCase() || "unknown"
                    } else {
                        try {
                            const parsed = JSON.parse(raw)
                            status = parsed?.status?.toLowerCase() || "unknown"
                        } catch {
                            status = "unknown"
                        }
                    }
                    newStatuses[panel.mac] = status
                } catch {
                    newStatuses[panel.mac] = "unknown"
                }
            }
            setStatuses(newStatuses)
        }

        fetchStatuses()
        const interval = setInterval(fetchStatuses, 2000)
        return () => clearInterval(interval)
    }, [layout])

    const padding = 20
    const panelW = 40
    const panelH = 30

    return (
        <div className="relative flex justify-center items-center">
            <svg
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                className="bg-white rounded shadow border"
            >
                {layout.map((panel, idx) => {
                    const x = panel.x + padding
                    const y = panel.y + padding
                    const status = statuses[panel.mac] || "unknown"
                    const fillClass = statusColorMap[status] || statusColorMap.unknown
                    const isSelected = selectedMac === panel.mac

                    return (
                        <g key={panel.mac}>
                            <rect
                                x={x}
                                y={y}
                                width={panelW}
                                height={panelH}
                                rx={6}
                                ry={6}
                                stroke="black"
                                strokeWidth={isSelected ? 2 : 1}
                                fill={fillClass}
                                onClick={() => onPanelClick(panel.mac)}
                            />
                            <text
                                x={x + panelW / 2}
                                y={y - 5}
                                textAnchor="middle"
                                className="text-[10px] fill-black"
                            >
                                Panel {idx + 1}
                            </text>
                            <text
                                x={x + panelW / 2}
                                y={y + panelH + 10}
                                textAnchor="middle"
                                className="text-[10px] fill-black"
                            >
                                {panel.mac}
                            </text>
                            <title>{`${panel.mac}\nStatus: ${status}`}</title>
                        </g>
                    )
                })}
            </svg>

            {showStatusCard && selectedMac && (
                <div
                    style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        backgroundColor: "#fff",
                        padding: "1rem",
                        border: "1px solid #ccc",
                        boxShadow: "0 0 10px rgba(0,0,0,0.1)",
                        zIndex: 10,
                    }}
                >
                    <StatusCard
                        panelId={selectedMac}
                        profile={profile[selectedMac] || {}}
                    />
                </div>
            )}
        </div>
    )
}
