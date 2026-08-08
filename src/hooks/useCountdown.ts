import { useEffect, useRef, useState } from 'react'

export interface Countdown {
  /** Milliseconds remaining (>= 0). */
  remainingMs: number
  /** `true` once the deadline has passed. */
  expired: boolean
}

/**
 * Countdown to an absolute `endsAt` timestamp. Driven by wall-clock time
 * rather than accumulated ticks, so pausing the tab or reloading the page
 * cannot stretch or reset the deadline. Calls `onExpire` once when the
 * deadline passes and the timer is armed.
 */
export function useCountdown(endsAt: number, onExpire?: () => void): Countdown {
  const [remainingMs, setRemainingMs] = useState(() => Math.max(0, endsAt - Date.now()))
  const [expired, setExpired] = useState(() => endsAt - Date.now() <= 0)
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire
  const firedRef = useRef(false)

  useEffect(() => {
    const tick = () => {
      const remaining = endsAt - Date.now()
      if (remaining <= 0) {
        setRemainingMs(0)
        setExpired(true)
        if (!firedRef.current) {
          firedRef.current = true
          onExpireRef.current?.()
        }
      } else {
        setRemainingMs(remaining)
      }
    }

    tick()
    const interval = window.setInterval(tick, 250)
    return () => window.clearInterval(interval)
  }, [endsAt])

  return { remainingMs, expired }
}

export function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
