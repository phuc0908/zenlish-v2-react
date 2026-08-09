import type { Part } from '../types/toeic'
import type { AnswerMap } from '../lib/scoring'
import { isCorrect } from '../lib/scoring'

interface ReviewNavigatorProps {
  parts: Part[]
  answers: AnswerMap
  onJump: (questionNo: number) => void
  /** Question numbers of the group being reviewed — highlighted with a ring. */
  currentNos?: ReadonlySet<number>
}

/**
 * Results-page twin of the exam's AnswerSheet: a grid of every question number
 * grouped by part, coloured by correct / wrong / blank, so a learner can jump
 * straight to the question they want the explanation for.
 */
export default function ReviewNavigator({ parts, answers, onJump, currentNos }: ReviewNavigatorProps) {
  const questions = parts.flatMap((part) => part.groups.flatMap((group) => group.questions))
  const correctCount = questions.filter((q) => isCorrect(answers[q.no], q.correctAnswer)).length
  const total = questions.length

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-navy-800 dark:bg-navy-900">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-bold text-slate-900 dark:text-navy-50">Tìm câu nhanh</h2>
        <span className="text-xs font-medium text-slate-500 dark:text-navy-400">
          {correctCount}/{total} đúng
        </span>
      </div>

      <div className="mt-3 grid gap-3">
        {parts.map((part) => (
          <div key={part.no}>
            <p className="mb-1.5 text-[11px] font-bold tracking-wide text-slate-400 uppercase dark:text-navy-400">
              Part {part.no}
            </p>
            <div className="grid grid-cols-8 gap-1 sm:grid-cols-10 lg:grid-cols-6 xl:grid-cols-8">
              {part.groups.flatMap((group) =>
                group.questions.map((question) => {
                  const answer = answers[question.no]
                  const blank = answer === undefined || answer === ''
                  const correct = !blank && answer === question.correctAnswer
                  const tone = blank
                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-navy-800 dark:text-navy-200 dark:hover:bg-navy-700'
                    : correct
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                      : 'bg-rose-500 text-white hover:bg-rose-600'
                  const current = currentNos?.has(question.no)
                    ? 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-navy-900'
                    : ''

                  return (
                    <button
                      key={question.no}
                      type="button"
                      onClick={() => onJump(question.no)}
                      title={`Xem câu ${question.no}`}
                      aria-current={currentNos?.has(question.no) ? 'true' : undefined}
                      className={`aspect-square rounded-md text-[11px] font-semibold transition-colors ${tone} ${current}`}
                    >
                      {question.no}
                    </button>
                  )
                }),
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-slate-100 pt-3 text-[11px] text-slate-500 dark:border-navy-800 dark:text-navy-400">
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-emerald-500" /> Đúng
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-rose-500" /> Sai
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-slate-100 dark:bg-navy-800" /> Bỏ trống
        </span>
      </div>
    </div>
  )
}
