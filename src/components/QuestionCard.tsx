import type { Question } from '../types/toeic'
import ChoiceButton from './ChoiceButton'

interface QuestionCardProps {
  question: Question
  answer: string | undefined
  onAnswer: (label: string) => void
  flagged: boolean
  onToggleFlag: () => void
}

export default function QuestionCard({
  question,
  answer,
  onAnswer,
  flagged,
  onToggleFlag,
}: QuestionCardProps) {
  return (
    <article id={`q-${question.no}`} className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-navy-800 dark:bg-navy-900">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white dark:bg-navy-700 dark:text-navy-50">
            {question.no}
          </span>
          {question.prompt && (
            <p className="pt-1 text-[15px] leading-6 font-medium text-slate-900 dark:text-navy-50">
              {question.prompt}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onToggleFlag}
          aria-pressed={flagged}
          title="Đánh dấu để xem lại"
          className={`shrink-0 rounded-lg border px-2 py-1 text-xs font-semibold transition-colors ${
            flagged
              ? 'border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-500/50 dark:bg-amber-500/15 dark:text-amber-200'
              : 'border-slate-200 bg-white text-slate-500 hover:border-amber-300 hover:text-amber-700 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-300 dark:hover:border-amber-500/50 dark:hover:text-amber-300'
          }`}
        >
          {flagged ? '★ Đã đánh dấu' : '☆ Đánh dấu'}
        </button>
      </header>

      <div className="mt-3 grid gap-2">
        {question.choices.map((choice) => (
          <ChoiceButton
            key={choice.label}
            label={choice.label}
            text={choice.text}
            selected={answer === choice.label}
            onSelect={() => onAnswer(choice.label)}
          />
        ))}
      </div>
    </article>
  )
}
