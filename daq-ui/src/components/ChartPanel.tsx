import React, { useContext, useEffect, useState } from "react"
import { Line } from "react-chartjs-2"
import {
    Chart as ChartJS,
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Legend,
    Tooltip
} from "chart.js"
import { SelectedPanelContext } from "@/contexts/SelectedPanelContext"
import { getPanelStatus } from "@/hooks/usePanelLayout"

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Legend, Tooltip)

interface PanelStats {
    voltage: number[]
    current: number[]
}

const DEFAULT_SAMPLE_SIZE = 30

export default function ChartPanel() {
    const { selectedPanel } = useContext(SelectedPanelContext)
    const [stats, setStats] = useState<PanelStats>({ voltage: [], current: [] })

    useEffect(() => {
        if (!selectedPanel) return

        const interval = setInterval(async () => {
            try {
                const data = await getPanelStatus(selectedPanel)
                const voltage = parseFloat(String(data.voltage ?? "0"))
                const current = parseFloat(String(data.current ?? "0"))

                setStats(prev => ({
                    voltage: [...prev.voltage.slice(-DEFAULT_SAMPLE_SIZE + 1), voltage],
                    current: [...prev.current.slice(-DEFAULT_SAMPLE_SIZE + 1), current]
                }))
            } catch (error) {
                console.error("Failed to fetch panel stats:", error)
            }
        }, 1000)

        return () => clearInterval(interval)
    }, [selectedPanel])

    if (!selectedPanel) {
        return (
            <div className="text-center text-gray-500 italic py-10">
                Select a panel to view live voltage and current data.
            </div>
        )
    }

    const chartData = {
        labels: stats.voltage.map((_, i) => i + 1),
        datasets: [
            {
                label: "Voltage (V)",
                data: stats.voltage,
                borderColor: "green",
                backgroundColor: "rgba(34, 197, 94, 0.2)",
                fill: true,
                tension: 0.3
            },
            {
                label: "Current (A)",
                data: stats.current,
                borderColor: "blue",
                backgroundColor: "rgba(59, 130, 246, 0.2)",
                fill: true,
                tension: 0.3
            }
        ]
    }

    return (
        <div className="w-full">
            <h3 className="text-lg font-semibold mb-2 text-center">
                Panel: <span className="text-blue-600">{selectedPanel}</span>
            </h3>
            <div className="bg-white dark:bg-gray-800 p-4 rounded shadow overflow-x-auto">
                <Line
                    data={chartData}
                    options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: { beginAtZero: true }
                        }
                    }}
                    height={300}
                />
            </div>
        </div>
    )
}
