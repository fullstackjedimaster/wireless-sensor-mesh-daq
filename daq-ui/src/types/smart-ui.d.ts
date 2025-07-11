// types/smart-ui.d.ts
declare module "smart-ui" {
    import { FC } from "react"

    export interface Fault {
        graph_key: string
        category: string
        freezetime: number
        extras?: Record<string, unknown>
    }

    export interface FaultProfile {
        [category: string]: number
    }

    export interface FaultMetadata {
        label: string
        threshold?: number
        unit?: string
        color?: string
        priority?: number
    }

    export const ExplanationPanel: FC<{ mac: string }>
    export const StatusCard: FC<{ panelId: string; profile: FaultProfile }>
    export const FaultLegend: FC
}
