interface ChoiceButtonProps {
  label: string
  text: string
  selected: boolean
  onSelect: () => void
  /** Review mode only — leave undefined while the exam is running. */
  state?: 'correct' | 'wrong' | undefined
  disabled?: boolean
}

export default function ChoiceButton({
  label,
  text,
  selected,
  onSelect,
  state,
  disabled = false,
}: ChoiceButtonProps) {
  const base =
    'flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors'

  const tone =
    state === 'correct'
      ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-500/50 dark:bg-emerald-500/10'
      : state === 'wrong'
        ? 'border-rose-300 bg-rose-50 dark:border-rose-500/50 dark:bg-rose-500/10'
        : selected
          ? 'border-indigo-400 bg-indigo-50 dark:border-indigo-400/60 dark:bg-indigo-500/15'
          : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40 dark:border-navy-700 dark:bg-navy-800/50 dark:hover:border-indigo-400/60 dark:hover:bg-indigo-500/10'

  const badge =
    state === 'correct'
      ? 'bg-emerald-600 text-white'
      : state === 'wrong'
        ? 'bg-rose-600 text-white'
        : selected
          ? 'bg-indigo-600 text-white'
          : 'bg-slate-100 text-slate-600 dark:bg-navy-700 dark:text-navy-100'

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      className={`${base} ${tone} ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
    >
      <span
        className={`mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${badge}`}
      >
        {label}
      </span>
      {text ? (
        <span className="text-[15px] leading-6 text-slate-800 dark:text-navy-100">{text}</span>
      ) : (
        <span className="text-[15px] leading-6 text-slate-400 italic dark:text-navy-400">
          (đáp án chỉ có trong audio)
        </span>
      )}
    </button>
  )
}
