import { useEffect, useMemo, useRef, useState } from 'react'
import type { Part, Question } from '../types/toeic'
import type { AnswerMap, PartBreakdown } from '../lib/scoring'
import { buildScreens, screenIndexOfQuestion } from '../lib/screens'
import ReviewGroupView from './ReviewGroupView'
import ReviewNavigator from './ReviewNavigator'

type Filter = 'all' | 'wrong' | 'blank'

const FILTER_LABEL: Record<Filter, string> = {
  all: 'Tất cả',
  wrong: 'Câu sai',
  blank: 'Bỏ trống',
}

interface ReviewPagerProps {
  parts: Part[]
  answers: AnswerMap
  partBreakdown: PartBreakdown[]
}

/** What to scroll to once the new screen has mounted. */
type PendingScroll = { type: 'top' } | { type: 'question'; no: number }

/**
 * Results-page reviewer that mirrors the exam: pick a part with the tabs, then
 * step group-by-group with Trước/Tiếp. The active filter (all / wrong / blank)
 * decides which screens the pager walks through.
 */
export default function ReviewPager({ parts, answers, partBreakdown }: ReviewPagerProps) {
  const [filter, setFilter] = useState<Filter>('all')
  const [screenIndex, setScreenIndex] = useState(0)
  const [navOpen, setNavOpen] = useState(false)
  const pendingRef = useRef<PendingScroll | null>(null)
  const topRef = useRef<HTMLDivElement>(null)

  const allScreens = useMemo(() => buildScreens(parts), [parts])

  const questionByNo = useMemo(() => {
    const map = new Map<number, string>()
    for (const part of parts)
      for (const group of part.groups)
        for (const question of group.questions) map.set(question.no, question.correctAnswer)
    return map
  }, [parts])

  const keepQ = (question: Question): boolean => {
    const answer = answers[question.no]
    const blank = answer === undefined || answer === ''
    if (filter === 'blank') return blank
    if (filter === 'wrong') return !blank && answer !== question.correctAnswer
    return true
  }

  const visibleIndices = useMemo(
    () =>
      allScreens
        .filter((screen) => screen.groups.some((group) => group.questions.some(keepQ)))
        .map((screen) => screen.index),
    [allScreens, filter, answers],
  )

  const safeIndex = Math.min(Math.max(0, screenIndex), Math.max(0, allScreens.length - 1))

  const isVisibleAt = (index: number): boolean => {
    const screen = allScreens[index]
    return screen ? screen.groups.some((group) => group.questions.some(keepQ)) : false
  }

  const findNearest = (from: number): number => {
    let best = visibleIndices[0]
    if (best === undefined) return from
    for (const index of visibleIndices)
      if (Math.abs(index - from) < Math.abs(best - from)) best = index
    return best
  }

  // While a filter hides the anchored screen, fall back to the nearest visible
  // one so the page never goes blank — every action navigates from what shows.
  const shownIndex = isVisibleAt(safeIndex) ? safeIndex : findNearest(safeIndex)
  const screen = allScreens[shownIndex]

  const currentNos = useMemo(() => {
    const current = allScreens[shownIndex]
    return new Set(current ? current.groups.flatMap((g) => g.questions.map((q) => q.no)) : [])
  }, [allScreens, shownIndex])

  // A filter can hide the anchored screen; keep state on the screen actually
  // shown so toggling the filter back doesn't snap to a stale index.
  useEffect(() => {
    if (shownIndex !== screenIndex) setScreenIndex(shownIndex)
  }, [shownIndex, screenIndex])

  useEffect(() => {
    const pending = pendingRef.current
    if (!pending) return
    pendingRef.current = null
    if (pending.type === 'question') {
      document.getElementById(`review-q-${pending.no}`)?.scrollIntoView({ block: 'center' })
    } else {
      topRef.current?.scrollIntoView({ block: 'start' })
    }
  }, [shownIndex, filter])

  const activePartNo = screen?.partNo
  const inPart = visibleIndices.filter((i) => allScreens[i]?.partNo === activePartNo)
  const pos = visibleIndices.indexOf(shownIndex)
  const kInPart = inPart.indexOf(shownIndex) + 1
  const nInPart = inPart.length

  const visiblePartNos = new Set<number>()
  for (const i of visibleIndices) {
    const s = allScreens[i]
    if (s) visiblePartNos.add(s.partNo)
  }

  const goTo = (index: number) => {
    if (index === shownIndex) {
      topRef.current?.scrollIntoView({ block: 'start' })
      return
    }
    pendingRef.current = { type: 'top' }
    setScreenIndex(index)
  }

  const goPrev = () => {
    if (pos > 0) goTo(visibleIndices[pos - 1]!)
  }
  const goNext = () => {
    if (pos >= 0 && pos < visibleIndices.length - 1) goTo(visibleIndices[pos + 1]!)
  }
  const goToPart = (partNo: number) => {
    const target = visibleIndices.find((i) => allScreens[i]?.partNo === partNo)
    if (target !== undefined) goTo(target)
  }

  const jumpToQuestion = (no: number) => {
    setNavOpen(false)
    const idx = screenIndexOfQuestion(allScreens, no)
    if (idx === -1) return
    const correctAnswer = questionByNo.get(no)
    const answer = answers[no]
    const blank = answer === undefined || answer === ''
    const hidden =
      correctAnswer !== undefined &&
      ((filter === 'blank' && !blank) || (filter === 'wrong' && (blank || answer === correctAnswer)))

    pendingRef.current = { type: 'question', no }
    if (hidden) setFilter('all')
    if (idx !== shownIndex) {
      setScreenIndex(idx)
    } else if (!hidden) {
      pendingRef.current = null
      document.getElementById(`review-q-${no}`)?.scrollIntoView({ block: 'center' })
    }
  }

  const groupsToShow = screen
    ? screen.groups
        .map((group) => ({ group, questions: group.questions.filter(keepQ) }))
        .filter((entry) => entry.questions.length > 0)
    : []

  const partTabs = partBreakdown.map((part) => ({
    no: part.partNo,
    correct: part.correct,
    total: part.total,
  }))

  return (
    <div className="mt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-6">
      <div className="min-w-0">
        <div ref={topRef} className="scroll-mt-24" />

        <div className="flex gap-2 overflow-x-auto pb-1">
          {partTabs.map((tab) => {
            const active = tab.no === activePartNo
            const enabled = visiblePartNos.has(tab.no)
            return (
              <button
                key={tab.no}
                type="button"
                disabled={!enabled}
                onClick={() => goToPart(tab.no)}
                aria-current={active ? 'page' : undefined}
                className={`shrink-0 rounded-xl border px-3.5 py-2 text-left transition-colors ${
                  active
                    ? 'border-indigo-500 bg-indigo-600 text-white shadow-sm'
                    : enabled
                      ? 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-100 dark:hover:border-indigo-400/60'
                      : 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300 dark:border-navy-800 dark:bg-navy-900 dark:text-navy-600'
                }`}
              >
                <span className="block text-sm font-bold">Part {tab.no}</span>
                <span
                  className={`block text-[11px] font-semibold tabular-nums ${active ? 'text-indigo-100' : 'text-slate-400 dark:text-navy-400'}`}
                >
                  {tab.correct}/{tab.total}
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold text-slate-500 dark:text-navy-400">
            {screen && `${screen.partName} · câu ${screen.firstQuestionNo}–${screen.lastQuestionNo}`}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 lg:hidden dark:border-navy-700 dark:text-navy-200"
            >
              Tìm câu
            </button>
            <div className="flex gap-1.5 rounded-xl bg-slate-100 p-1 dark:bg-navy-800">
              {(Object.keys(FILTER_LABEL) as Filter[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  aria-pressed={filter === value}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    filter === value
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-navy-600 dark:text-navy-50'
                      : 'text-slate-600 hover:text-slate-900 dark:text-navy-300 dark:hover:text-navy-50'
                  }`}
                >
                  {FILTER_LABEL[value]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {groupsToShow.length > 0 ? (
          <div className="mt-4 grid gap-5">
            {groupsToShow.map(({ group, questions }) => (
              <ReviewGroupView key={group.id} group={group} questions={questions} answers={answers} />
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-400">
            Không có câu nào ở mục "{FILTER_LABEL[filter]}".
          </p>
        )}

        <nav className="sticky bottom-4 z-20 mt-5 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur dark:border-navy-700 dark:bg-navy-900/95">
          <button
            type="button"
            onClick={goPrev}
            disabled={pos <= 0}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-100"
          >
            ← Trước
          </button>
          <div className="text-center leading-tight">
            <div className="text-xs font-semibold text-slate-600 tabular-nums dark:text-navy-300">
              {nInPart > 0 ? `${kInPart} / ${nInPart}` : '—'}
            </div>
            {activePartNo !== undefined && (
              <div className="text-[11px] text-slate-400 dark:text-navy-400">Part {activePartNo}</div>
            )}
          </div>
          <button
            type="button"
            onClick={goNext}
            disabled={pos < 0 || pos >= visibleIndices.length - 1}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Tiếp →
          </button>
        </nav>
      </div>

      <aside className="mt-6 hidden lg:mt-0 lg:block">
        <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
          <ReviewNavigator parts={parts} answers={answers} onJump={jumpToQuestion} currentNos={currentNos} />
        </div>
      </aside>

      {navOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Đóng bảng tìm câu"
            onClick={() => setNavOpen(false)}
            className="absolute inset-0 bg-slate-900/40 dark:bg-navy-950/70"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-3xl bg-slate-50 p-4 dark:bg-navy-950">
            <ReviewNavigator parts={parts} answers={answers} onJump={jumpToQuestion} currentNos={currentNos} />
            <button
              type="button"
              onClick={() => setNavOpen(false)}
              className="mt-3 w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-100"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


