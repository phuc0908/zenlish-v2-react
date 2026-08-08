import { useState } from 'react'
import type { Question } from '../types/toeic'
import ChoiceButton from './ChoiceButton'

interface ReviewQuestionProps {
  question: Question
  answer: string | undefined
}

export default function ReviewQuestion({ question, answer }: ReviewQuestionProps) {
  const [showExplanation, setShowExplanation] = useState(false)
  const blank = answer === undefined || answer === ''
  const correct = !blank && answer === question.correctAnswer

  const status = blank
    ? { label: 'Bỏ trống', className: 'bg-slate-100 text-slate-600 dark:bg-navy-800 dark:text-navy-200' }
    : correct
      ? { label: 'Đúng', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' }
      : { label: 'Sai', className: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300' }

  return (
    <article
      id={`review-q-${question.no}`}
      className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-navy-800 dark:bg-navy-900"
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white dark:bg-navy-700 dark:text-navy-50">
            {question.no}
          </span>
          {question.prompt ? (
            <p className="pt-1 text-[15px] leading-6 font-medium text-slate-900 dark:text-navy-50">
              {question.prompt}
            </p>
          ) : (
            <p className="pt-1.5 text-sm text-slate-500 italic dark:text-navy-400">Câu hỏi chỉ có trong audio</p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${status.className}`}
        >
          {status.label}
        </span>
      </header>

      <div className="mt-3 grid gap-2">
        {question.choices.map((choice) => {
          const isCorrectChoice = choice.label === question.correctAnswer
          const isUserChoice = choice.label === answer
          return (
            <ChoiceButton
              key={choice.label}
              label={choice.label}
              text={choice.text}
              selected={isUserChoice}
              onSelect={() => undefined}
              disabled
              state={isCorrectChoice ? 'correct' : isUserChoice ? 'wrong' : undefined}
            />
          )
        })}
      </div>

      <p className="mt-2.5 text-xs text-slate-500 dark:text-navy-400">
        Đáp án đúng: <strong className="text-emerald-700 dark:text-emerald-300">{question.correctAnswer}</strong>
        {!blank && !correct && (
          <>
            {' · '}Bạn chọn: <strong className="text-rose-700 dark:text-rose-300">{answer}</strong>
          </>
        )}
      </p>

      {question.explanation && (
        <div className="mt-3 border-t border-slate-100 pt-3 dark:border-navy-800">
          <button
            type="button"
            onClick={() => setShowExplanation((value) => !value)}
            className="text-xs font-semibold text-indigo-700 hover:underline dark:text-indigo-300"
          >
            {showExplanation ? 'Ẩn transcript & giải thích' : 'Xem transcript & giải thích'}
          </button>
          {showExplanation && <p className="prose-toeic mt-2">{question.explanation}</p>}
        </div>
      )}
    </article>
  )
}
