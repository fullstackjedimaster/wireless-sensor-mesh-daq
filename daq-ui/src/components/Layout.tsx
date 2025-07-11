import React, { ReactNode } from "react"
import Head from "next/head"

export default function Layout({ children }: { children: ReactNode }) {
    return (
        <>
            <Head>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>

            <div className="min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
                <main className="max-w-md mx-auto px-4 py-6">
                    {children}
                </main>
            </div>
        </>
    )
}
