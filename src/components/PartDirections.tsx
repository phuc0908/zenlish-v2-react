import { useState } from 'react'

interface PartDirectionsProps {
  partName: string
  directions: string
}

export default function PartDirections({ partName, directions }: PartDirectionsProps) {
  const [open, setOpen] = useState(true)
  if (!directions) return null

  return (
    <section className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 dark:border-indigo-400/25 dark:bg-indigo-500/10">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-sm font-bold tracking-wide text-indigo-900 uppercase dark:text-indigo-200">
          {partName} — Directions
        </h2>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="shrink-0 text-xs font-semibold text-indigo-700 hover:underline dark:text-indigo-300"
        >
          {open ? 'Thu gọn' : 'Xem'}
        </button>
      </div>
      {open && <p className="prose-toeic mt-2 text-indigo-900/80 dark:text-indigo-100/80">{directions}</p>}
    </section>
  )
}
