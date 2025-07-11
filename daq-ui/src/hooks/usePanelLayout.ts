// src/hooks/usePanelLayout.ts
export async function getLayout(): Promise<{ id: string; mac:string; x: number; y: number }[]> {
    try {
        const res = await fetch("http://fullstackjedi.dev:8000/daq-demo/layout")
        const data = await res.json()
        if (Array.isArray(data)) {
            return data
        } else {
            console.warn("⚠️ Layout response was not an array:", data)
            return []
        }
    } catch (error) {
        console.error("❌ Failed to fetch layout:", error)
        return []
    }
}


// hooks/usePanelLayout.ts
export interface PanelStatusResponse {
    status: string
    voltage?: number
    current?: number
}

export async function getPanelStatus(mac: string): Promise<PanelStatusResponse> {
    const res = await fetch(`http://fullstackjedi.dev:8000/daq-demo/status/${mac}`)
    if (!res.ok) throw new Error("Panel not found")
    const data: PanelStatusResponse = await res.json()
    return data
}





