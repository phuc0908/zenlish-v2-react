import type { Screen } from '../lib/screens'

interface AnswerSheetProps {
  screens: Screen[]
  answers: Record<number, string>
  flagged: Set<number>
  currentScreen: number
  onJump: (screenIndex: number, questionNo: number) => void
}

export default function AnswerSheet({
  screens,
  answers,
  flagged,
  currentScreen,
  onJump,
}: AnswerSheetProps) {
  // Group screens by part so the sheet mirrors the exam's structure.
  const byPart = new Map<number, Screen[]>()
  for (const screen of screens) {
    const bucket = byPart.get(screen.partNo)
    if (bucket) bucket.push(screen)
    else byPart.set(screen.partNo, [screen])
  }

  const answered = screens.reduce(
    (count, screen) =>
      count +
      screen.groups.reduce(
        (sum, group) => sum + group.questions.filter((q) => answers[q.no] !== undefined).length,
        0,
      ),
    0,
  )
  const total = screens.reduce(
    (count, screen) => count + screen.groups.reduce((sum, group) => sum + group.questions.length, 0),
    0,
  )

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-navy-800 dark:bg-navy-900">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-bold text-slate-900 dark:text-navy-50">Phiếu trả lời</h2>
        <span className="text-xs font-medium text-slate-500 dark:text-navy-400">
          {answered}/{total}
        </span>
      </div>

      <div className="mt-3 grid gap-3">
        {[...byPart.entries()].map(([partNo, partScreens]) => (
          <div key={partNo}>
            <p className="mb-1.5 text-[11px] font-bold tracking-wide text-slate-400 uppercase dark:text-navy-400">
              Part {partNo}
            </p>
            <div className="grid grid-cols-8 gap-1 sm:grid-cols-10 lg:grid-cols-6 xl:grid-cols-8">
              {partScreens.flatMap((screen) =>
                screen.groups.flatMap((group) =>
                  group.questions.map((question) => {
                    const isAnswered = answers[question.no] !== undefined
                    const isFlagged = flagged.has(question.no)
                    const isCurrent = screen.index === currentScreen

                    return (
                      <button
                        key={question.no}
                        type="button"
                        onClick={() => onJump(screen.index, question.no)}
                        title={`Câu ${question.no}${isFlagged ? ' (đã đánh dấu)' : ''}`}
                        className={`relative aspect-square rounded-md text-[11px] font-semibold transition-colors ${
                          isAnswered
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-navy-800 dark:text-navy-200 dark:hover:bg-navy-700'
                        } ${isCurrent ? 'ring-2 ring-slate-900 ring-offset-1 dark:ring-navy-100 dark:ring-offset-navy-900' : ''}`}
                      >
                        {question.no}
                        {isFlagged && (
                          <span
                            className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-amber-400"
                            aria-hidden
                          />
                        )}
                      </button>
                    )
                  }),
                ),
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-slate-100 pt-3 text-[11px] text-slate-500 dark:border-navy-800 dark:text-navy-400">
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-indigo-600" /> Đã trả lời
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-slate-100 dark:bg-navy-800" /> Chưa làm
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-amber-400" /> Đánh dấu
        </span>
      </div>
    </div>
  )
}
