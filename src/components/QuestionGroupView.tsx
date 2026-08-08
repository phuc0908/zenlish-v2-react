import type { Group } from '../types/toeic'
import AudioPlayer from './AudioPlayer'
import MissingContentNotice from './MissingContentNotice'
import QuestionCard from './QuestionCard'

interface QuestionGroupViewProps {
  group: Group
  answers: Record<number, string>
  flagged: Set<number>
  onAnswer: (questionNo: number, label: string) => void
  onToggleFlag: (questionNo: number) => void
  allowReplay: boolean
  audioPlayed: boolean
  onAudioPlayed: (groupId: number) => void
}

/** Part 6/7 read better as passage-left, questions-right on a wide screen. */
const TWO_COLUMN_PARTS = new Set([6, 7])

export default function QuestionGroupView({
  group,
  answers,
  flagged,
  onAnswer,
  onToggleFlag,
  allowReplay,
  audioPlayed,
  onAudioPlayed,
}: QuestionGroupViewProps) {
  const twoColumn = TWO_COLUMN_PARTS.has(group.partNo)

  const questions = (
    <div className="grid gap-3">
      {group.questions.map((question) => (
        <QuestionCard
          key={question.no}
          question={question}
          answer={answers[question.no]}
          onAnswer={(label) => onAnswer(question.no, label)}
          flagged={flagged.has(question.no)}
          onToggleFlag={() => onToggleFlag(question.no)}
        />
      ))}
    </div>
  )

  const media = (
    <>
      {group.partNo === 1 &&
        (group.imageUrl ? (
          <img
            src={group.imageUrl}
            alt={`Ảnh câu ${group.questions[0]?.no ?? ''}`}
            className="w-full rounded-xl border border-slate-200 bg-white object-contain dark:border-navy-800 dark:bg-navy-900"
          />
        ) : (
          <MissingContentNotice kind="image" />
        ))}

      {group.audioUrl && (
        <AudioPlayer
          src={group.audioUrl}
          allowReplay={allowReplay}
          alreadyPlayed={audioPlayed}
          onPlayed={() => onAudioPlayed(group.id)}
        />
      )}
    </>
  )

  if (twoColumn) {
    return (
      <section className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <div className="lg:sticky lg:top-24">
          {group.passage ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto dark:border-navy-800 dark:bg-navy-900">
              <p className="prose-toeic">{group.passage}</p>
            </div>
          ) : (
            <MissingContentNotice kind="passage" />
          )}
        </div>
        {questions}
      </section>
    )
  }

  return (
    <section className="grid gap-3">
      {media}
      {questions}
    </section>
  )
}
