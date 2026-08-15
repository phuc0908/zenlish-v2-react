import type { Group, Question } from '../types/toeic'
import type { AnswerMap } from '../lib/scoring'
import AudioPlayer from './AudioPlayer'
import GroupImages from './GroupImages'
import MissingContentNotice from './MissingContentNotice'
import ReviewQuestion from './ReviewQuestion'

/** "câu 7" for a single question, "câu 62–64" for a group. */
function questionLabel(group: Group): string {
  const first = group.questions[0]?.no
  const last = group.questions.at(-1)?.no
  if (first == null) return ''
  return last != null && last !== first ? `câu ${first}–${last}` : `câu ${first}`
}

interface ReviewGroupViewProps {
  group: Group
  /** Already filtered by the parent; media always shows even when empty. */
  questions: Question[]
  answers: AnswerMap
  expandAll?: boolean | undefined
}

/** Parts with a passage or image read better as media-left, questions-right on wide screens. */
const TWO_COLUMN_PARTS = new Set([1, 3, 4, 6, 7])

/**
 * Review-mode twin of QuestionGroupView: same media layout (Part 1 image,
 * Part 6/7 two-column passage, audio), but each question is a ReviewQuestion
 * showing the correct/chosen answers and explanation instead of an input.
 */
export default function ReviewGroupView({ group, questions, answers, expandAll }: ReviewGroupViewProps) {
  const twoColumn = TWO_COLUMN_PARTS.has(group.partNo)
  const label = questionLabel(group)

  const questionList = (
    <div className="grid gap-3">
      {questions.map((question) => (
        <ReviewQuestion
          key={question.no}
          question={question}
          answer={answers[question.no]}
          expandAll={expandAll}
        />
      ))}
    </div>
  )

  if (twoColumn) {
    return (
      <section className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <div className="grid gap-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto">
          {group.audioUrl && <AudioPlayer src={group.audioUrl} allowReplay />}

          {group.passage ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-navy-800 dark:bg-navy-900">
              <div className="prose-toeic" dangerouslySetInnerHTML={{ __html: group.passage }} />
            </div>
          ) : group.imageUrls.length > 0 ? (
            <GroupImages urls={group.imageUrls} label={label} />
          ) : (
            group.partNo === 1 ? (
              <MissingContentNotice kind="image" />
            ) : (
              (group.partNo === 6 || group.partNo === 7) && <MissingContentNotice kind="passage" />
            )
          )}
        </div>
        {questionList}
      </section>
    )
  }

  return (
    <section className="grid gap-3">
      {group.imageUrls.length > 0 ? (
        <GroupImages urls={group.imageUrls} label={label} />
      ) : (
        group.partNo === 1 && <MissingContentNotice kind="image" />
      )}

      {group.audioUrl && <AudioPlayer src={group.audioUrl} allowReplay />}

      {questionList}
    </section>
  )
}
