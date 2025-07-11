// src/hooks/useFaultStatus.ts
import { useEffect, useState } from "react"
import { FaultProfile, getProfile } from "../../lib/api"

export function useFaultStatus(pollInterval: number = 3000) {
  const [profile, setProfile] = useState<FaultProfile>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isActive = true

    async function fetchStatus() {
      try {
        const data = await getProfile()
        if (isActive) {
          setProfile(data)
        }
      } catch (err) {
        console.error("Failed to fetch fault profile:", err)
      } finally {
        if (isActive) setLoading(false)
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, pollInterval)

    return () => {
      isActive = false
      clearInterval(interval)
    }
  }, [pollInterval])

  return { profile, loading }
}
