import { formatClock } from '../hooks/useCountdown'

interface TimerProps {
  remainingMs: number
  totalMs: number
}

export default function Timer({ remainingMs, totalMs }: TimerProps) {
  const minutesLeft = remainingMs / 60000
  const urgent = minutesLeft <= 5
  const warning = !urgent && minutesLeft <= 15
  const ratio = totalMs > 0 ? Math.max(0, Math.min(1, remainingMs / totalMs)) : 0

  return (
    <div
      className={`flex items-center gap-2.5 rounded-xl border px-3 py-1.5 tabular-nums ${
        urgent
          ? 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/50 dark:bg-rose-500/15 dark:text-rose-300'
          : warning
            ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/50 dark:bg-amber-500/15 dark:text-amber-200'
            : 'border-slate-200 bg-white text-slate-700 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-100'
      }`}
      role="timer"
      aria-live={urgent ? 'assertive' : 'off'}
    >
      <span aria-hidden>⏱</span>
      <div>
        <div className="text-base leading-5 font-bold">{formatClock(remainingMs)}</div>
        <div className="mt-1 h-1 w-20 overflow-hidden rounded-full bg-black/10 dark:bg-white/15">
          <div
            className="h-full rounded-full bg-current transition-[width] duration-500"
            style={{ width: `${ratio * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
