import type { Group } from '../types/toeic'
import AudioPlayer from './AudioPlayer'
import GroupImages from './GroupImages'
import MissingContentNotice from './MissingContentNotice'
import QuestionCard from './QuestionCard'

/** "câu 7" for a single question, "câu 62–64" for a group. */
function questionLabel(group: Group): string {
  const first = group.questions[0]?.no
  const last = group.questions.at(-1)?.no
  if (first == null) return ''
  return last != null && last !== first ? `câu ${first}–${last}` : `câu ${first}`
}

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

/** Parts with a passage or image read better as media-left, questions-right on wide screens. */
const TWO_COLUMN_PARTS = new Set([1, 3, 4, 6, 7])

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
  const label = questionLabel(group)

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
      {/* Listening graphics: the Part 1 photo, or a Part 3/4 chart/map. */}
      {group.imageUrls.length > 0 ? (
        <GroupImages urls={group.imageUrls} label={label} />
      ) : (
        group.partNo === 1 && <MissingContentNotice kind="image" />
      )}

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
        <div className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto">
          {group.passage ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-navy-800 dark:bg-navy-900">
              <p className="prose-toeic">{group.passage}</p>
            </div>
          ) : group.imageUrls.length > 0 ? (
            <GroupImages urls={group.imageUrls} label={label} />
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
