// pages/api/inject_fault.ts
import type { NextApiRequest, NextApiResponse } from "next"

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "POST") {
        const { macaddr, fault } = req.body
        console.log(`Injecting fault ${fault} into ${macaddr}`)
        res.status(200).json({ ok: true, macaddr, fault })
    } else {
        res.status(405).end()
    }
}
