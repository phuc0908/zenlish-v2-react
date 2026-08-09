import type { Group, Question } from '../types/toeic'
import type { AnswerMap } from '../lib/scoring'
import AudioPlayer from './AudioPlayer'
import MissingContentNotice from './MissingContentNotice'
import ReviewQuestion from './ReviewQuestion'

interface ReviewGroupViewProps {
  group: Group
  /** Already filtered by the parent; media always shows even when empty. */
  questions: Question[]
  answers: AnswerMap
}

/** Part 6/7 read better as passage-left, questions-right on a wide screen. */
const TWO_COLUMN_PARTS = new Set([6, 7])

/**
 * Review-mode twin of QuestionGroupView: same media layout (Part 1 image,
 * Part 6/7 two-column passage, audio), but each question is a ReviewQuestion
 * showing the correct/chosen answers and explanation instead of an input.
 */
export default function ReviewGroupView({ group, questions, answers }: ReviewGroupViewProps) {
  const twoColumn = TWO_COLUMN_PARTS.has(group.partNo)

  const questionList = (
    <div className="grid gap-3">
      {questions.map((question) => (
        <ReviewQuestion key={question.no} question={question} answer={answers[question.no]} />
      ))}
    </div>
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
        {questionList}
      </section>
    )
  }

  return (
    <section className="grid gap-3">
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

      {group.audioUrl && <AudioPlayer src={group.audioUrl} allowReplay />}

      {questionList}
    </section>
  )
}
