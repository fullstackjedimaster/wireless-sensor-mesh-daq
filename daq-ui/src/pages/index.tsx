"use client"

import Head from "next/head"
import Layout from "@/components/Layout"
import { PanelMapOverlay } from "@/components/PanelMapOverlay"
import { ChartModal } from "@/components/ChartModal"
import ControlPanel from "@/components/ControlPanel"
import { useEffect, useState } from "react"
import { ExplanationPanel } from "smart-ui"

export default function Home() {
    const [selectedMac, setSelectedMac] = useState<string>("fa:29:eb:6d:87:01")

    useEffect(() => {
        setSelectedMac("fa:29:eb:6d:87:01")
    }, [])

    return (
        <>
            <Head>
                <title>Wireless DAQ + Smart Faults</title>
            </Head>

            <Layout>
                <h1 className="text-2xl font-bold text-center mb-6">
                    Wireless Mesh DAQ Dashboard
                </h1>

                <div className="grid md:grid-cols-2 gap-0 items-start">
                    <div className="bg-white dark:bg-gray-900 p-4 rounded shadow">
                        <PanelMapOverlay selectedMac={selectedMac} onPanelClick={setSelectedMac} />
                    </div>

                    <div className="bg-white dark:bg-gray-900 p-4 rounded shadow">
                        <h2 className="text-xl font-semibold mb-2">Smart Fault Explainer</h2>
                        <ExplanationPanel mac={selectedMac} />
                    </div>
                </div>

                <div className="mt-10 bg-white dark:bg-gray-900 p-4 rounded shadow max-w-xl mx-auto">
                    <ChartModal mac={selectedMac} onClose={() => setSelectedMac(selectedMac)} />
                </div>

                <div className="mt-6 bg-white dark:bg-gray-900 p-4 rounded shadow max-w-xl mx-auto">
                    <h2 className="text-xl font-semibold mb-2">Fault Injection</h2>
                    <ControlPanel />
                </div>
            </Layout>
        </>
    )
}
