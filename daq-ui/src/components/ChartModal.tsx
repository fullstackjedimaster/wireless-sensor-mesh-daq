// components/ChartModal.tsx
import { useEffect, useRef, useState } from "react"
import { Line } from "react-chartjs-2"
import {
    Chart as ChartJS,
    LineElement,
    PointElement,
    LinearScale,
    Title,
    CategoryScale,
    Tooltip,
    Legend,
} from "chart.js"

ChartJS.register(LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend)

interface ChartModalProps {
    mac: string
    onClose: () => void
    alwaysVisible?: boolean
}

interface HistoryPoint {
    time: string
    voltage: number
    current: number
}

export const ChartModal: React.FC<ChartModalProps> = ({ mac, onClose, alwaysVisible = false }) => {
    const [history, setHistory] = useState<HistoryPoint[]>([])
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        const fetchPanelMetrics = async (mac: string): Promise<HistoryPoint> => {
            const res = await fetch(`http://localhost:8000/daq-demo/status/${mac}`)
            if (!res.ok) throw new Error("Failed to fetch panel status")
            const json = await res.json()
            return {
                time: new Date().toLocaleTimeString(),
                voltage: parseFloat(json.voltage ?? 0),
                current: parseFloat(json.current ?? 0),
            }
        }

        const fetchData = async () => {
            try {
                const newPoint = await fetchPanelMetrics(mac)
                setHistory((prev) => {
                    const updated = [...prev, newPoint]
                    if (updated.length > 30) updated.shift()
                    return updated
                })
            } catch (err) {
                console.error(`❌ Failed to fetch metrics for ${mac}:`, err)
            }
        }

        fetchData()
        timerRef.current = setInterval(fetchData, 2000)
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [mac])

    const data = {
        labels: history.map((p) => p.time),
        datasets: [
            {
                label: "Voltage (V)",
                data: history.map((p) => p.voltage),
                borderColor: "#22c55e",
                backgroundColor: "#bbf7d0",
            },
            {
                label: "Current (A)",
                data: history.map((p) => p.current),
                borderColor: "#3b82f6",
                backgroundColor: "#dbeafe",
            },
        ],
    }

    return alwaysVisible ? (
        <Line data={data} options={{ responsive: true, animation: false }} />
    ) : (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 border rounded-xl shadow-lg w-[90%] max-w-md p-4 relative">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-sm px-2 py-1 border rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                    Close
                </button>
                <h3 className="text-lg font-semibold mb-4 text-center">
                    Panel: <span className="font-mono">{mac}</span>
                </h3>
                <Line data={data} options={{ responsive: true, animation: false }} />
            </div>
        </div>
    )
}
