import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AnswerSheet from '../components/AnswerSheet'
import Layout from '../components/Layout'
import PartDirections from '../components/PartDirections'
import QuestionGroupView from '../components/QuestionGroupView'
import ThemeToggle from '../components/ThemeToggle'
import Timer from '../components/Timer'
import { ETS_2026 } from '../data/registry'
import { useCountdown } from '../hooks/useCountdown'
import { useTest } from '../hooks/useTest'
import { buildScreens } from '../lib/screens'
import {
  SECTION_LABEL,
  SECTION_MINUTES,
  partsForSection,
  scoreTest,
  type AnswerMap,
} from '../lib/scoring'
import {
  clearSession,
  loadSession,
  newId,
  saveResult,
  saveSession,
  type ExamSession,
  type StoredResult,
} from '../lib/storage'

/** Never fires — placeholder deadline while the session is still loading. */
const NO_DEADLINE = Number.POSITIVE_INFINITY

export default function ExamRunner() {
  const { testId } = useParams<{ testId: string }>()
  const navigate = useNavigate()
  const { test, loading, error } = useTest(testId)

  const [session, setSession] = useState<ExamSession | null>(() => {
    const stored = loadSession()
    return stored && stored.testId === testId ? stored : null
  })
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const submittedRef = useRef(false)
  const pendingScrollRef = useRef<number | null>(null)

  const section = session?.section ?? null
  const parts = useMemo(() => (test && section ? partsForSection(test, section) : []), [test, section])
  const screens = useMemo(() => buildScreens(parts), [parts])

  const screenIndex = Math.min(session?.screenIndex ?? 0, Math.max(0, screens.length - 1))
  const screen = screens[screenIndex]

  const flaggedSet = useMemo(() => new Set(session?.flagged ?? []), [session?.flagged])
  const playedSet = useMemo(() => new Set(session?.playedAudio ?? []), [session?.playedAudio])

  /** Question numbers on the current screen, in reading order. */
  const screenQuestionNos = useMemo(
    () => (screen ? screen.groups.flatMap((group) => group.questions.map((q) => q.no)) : []),
    [screen],
  )

  const patch = useCallback(
    (changes: Partial<ExamSession> | ((prev: ExamSession) => Partial<ExamSession>)) => {
      setSession((previous) => {
        if (!previous) return previous
        const delta = typeof changes === 'function' ? changes(previous) : changes
        const next = { ...previous, ...delta }
        saveSession(next)
        return next
      })
    },
    [],
  )

  const submit = useCallback(() => {
    if (!test || !session || submittedRef.current) return
    submittedRef.current = true

    const examParts = partsForSection(test, session.section)
    const result: StoredResult = {
      id: newId(),
      testId: session.testId,
      testLabel: session.testLabel,
      section: session.section,
      finishedAt: Date.now(),
      durationMs: Date.now() - session.startedAt,
      answers: session.answers,
      score: scoreTest(examParts, session.answers),
    }

    saveResult(result)
    clearSession()
    navigate(`/result/${result.id}`, { replace: true })
  }, [test, session, navigate])

  const { remainingMs } = useCountdown(session?.endsAt ?? NO_DEADLINE, submit)

  // Jump-to-question: switch screen first, scroll once the question is mounted.
  useEffect(() => {
    const target = pendingScrollRef.current
    if (target === null) return
    pendingScrollRef.current = null
    document.getElementById(`q-${target}`)?.scrollIntoView({ block: 'center' })
  }, [screenIndex])

  const goToScreen = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(screens.length - 1, index))
      patch({ screenIndex: clamped })
      window.scrollTo({ top: 0 })
    },
    [patch, screens.length],
  )

  /**
   * Answering pulls the next unanswered question of the same screen into view,
   * so a long screen (Part 5, Part 7) never has to be scrolled by hand.
   */
  const focusNextUnanswered = useCallback(
    (fromNo: number, answers: AnswerMap) => {
      const from = screenQuestionNos.indexOf(fromNo)
      if (from === -1) return
      const next = screenQuestionNos.slice(from + 1).find((no) => answers[no] === undefined)
      if (next === undefined) return
      document.getElementById(`q-${next}`)?.scrollIntoView({ block: 'center' })
    },
    [screenQuestionNos],
  )

  // ← / → change screen, so a whole part can be done without touching the mouse.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return
      if (confirmOpen || sheetOpen) return
      const target = event.target
      if (target instanceof Element && target.closest('input, textarea, select, [contenteditable]'))
        return

      if (event.key === 'ArrowRight') {
        event.preventDefault()
        goToScreen(screenIndex + 1)
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        goToScreen(screenIndex - 1)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [confirmOpen, goToScreen, screenIndex, sheetOpen])

  if (loading) {
    return (
      <Layout>
        <p className="py-20 text-center text-sm text-slate-500 dark:text-navy-400">Đang tải đề…</p>
      </Layout>
    )
  }

  if (error || !test) {
    return (
      <Layout>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-500/40 dark:bg-rose-500/10">
          <p className="font-semibold text-rose-800 dark:text-rose-200">{error ?? 'Không tìm thấy đề.'}</p>
          <Link
            to={`/${ETS_2026.id}`}
            className="mt-3 inline-block text-sm font-semibold text-rose-700 hover:underline dark:text-rose-300"
          >
            ← Quay lại danh sách đề
          </Link>
        </div>
      </Layout>
    )
  }

  if (!session || !screen) {
    return (
      <Layout>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-navy-800 dark:bg-navy-900">
          <p className="font-semibold text-slate-800 dark:text-navy-100">Chưa có bài thi nào đang mở.</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-navy-300">Chọn phần thi rồi bắt đầu lại nhé.</p>
          <Link
            to={`/${ETS_2026.id}/${testId ?? ''}`}
            className="mt-4 inline-block rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
          >
            Về trang chuẩn bị
          </Link>
        </div>
      </Layout>
    )
  }

  const answeredCount = Object.keys(session.answers).length
  const totalQuestions = screens.reduce(
    (count, item) => count + item.groups.reduce((sum, group) => sum + group.questions.length, 0),
    0,
  )
  const unanswered = totalQuestions - answeredCount

  const answerSheet = (
    <AnswerSheet
      screens={screens}
      answers={session.answers}
      flagged={flaggedSet}
      currentScreen={screenIndex}
      onJump={(targetScreen, questionNo) => {
        pendingScrollRef.current = questionNo
        setSheetOpen(false)
        if (targetScreen === screenIndex) {
          document.getElementById(`q-${questionNo}`)?.scrollIntoView({ block: 'center' })
          pendingScrollRef.current = null
        } else {
          patch({ screenIndex: targetScreen })
        }
      }}
    />
  )

  return (
    <Layout bare>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-navy-800 dark:bg-navy-900/95">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900 dark:text-navy-50">
              {ETS_2026.label} — {session.testLabel}
            </p>
            <p className="truncate text-xs text-slate-500 dark:text-navy-400">
              {SECTION_LABEL[session.section]} · {screen.partName} · câu {screen.firstQuestionNo}–
              {screen.lastQuestionNo}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Timer remainingMs={remainingMs} totalMs={SECTION_MINUTES[session.section] * 60_000} />
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 lg:hidden dark:border-navy-700 dark:text-navy-200"
            >
              Phiếu {answeredCount}/{totalQuestions}
            </button>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-navy-100 dark:text-navy-950 dark:hover:bg-white"
            >
              Nộp bài
            </button>
          </div>
        </div>

        <div className="h-1 bg-slate-100 dark:bg-navy-800">
          <div
            className="h-full bg-indigo-500 transition-[width] duration-300"
            style={{ width: `${((screenIndex + 1) / screens.length) * 100}%` }}
          />
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* content-start: without it the grid stretches short screens' cards to
            match the answer sheet's height. */}
        <div className="grid content-start gap-4">
          {screen.isPartStart && (
            <PartDirections partName={screen.partName} directions={screen.directions} />
          )}

          {screen.groups.map((group) => (
            <QuestionGroupView
              key={group.id}
              group={group}
              answers={session.answers}
              flagged={flaggedSet}
              onAnswer={(questionNo, label) => {
                patch((prev) => ({ answers: { ...prev.answers, [questionNo]: label } }))
                focusNextUnanswered(questionNo, { ...session.answers, [questionNo]: label })
              }}
              onToggleFlag={(questionNo) =>
                patch((prev) => ({
                  flagged: prev.flagged.includes(questionNo)
                    ? prev.flagged.filter((no) => no !== questionNo)
                    : [...prev.flagged, questionNo],
                }))
              }
              allowReplay={session.allowReplay}
              audioPlayed={playedSet.has(group.id)}
              onAudioPlayed={(groupId) => {
                patch((prev) =>
                  prev.playedAudio.includes(groupId)
                    ? {}
                    : { playedAudio: [...prev.playedAudio, groupId] },
                )
              }}
            />
          ))}

          {/* Sticky: the way forward stays on screen instead of living at the
              bottom of a long Part 5 / Part 7 page. */}
          <nav className="sticky bottom-4 z-20 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur dark:border-navy-700 dark:bg-navy-900/95">
            <button
              type="button"
              onClick={() => goToScreen(screenIndex - 1)}
              disabled={screenIndex === 0}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-100"
            >
              ← Trước
            </button>
            <div className="text-center leading-tight">
              <div className="text-xs font-semibold text-slate-600 tabular-nums dark:text-navy-300">
                {screenIndex + 1} / {screens.length}
              </div>
              <div className="hidden text-[11px] text-slate-400 sm:block dark:text-navy-400">phím ← →</div>
            </div>
            {screenIndex === screens.length - 1 ? (
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800 dark:bg-navy-100 dark:text-navy-950 dark:hover:bg-white"
              >
                Nộp bài
              </button>
            ) : (
              <button
                type="button"
                onClick={() => goToScreen(screenIndex + 1)}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
              >
                Tiếp →
              </button>
            )}
          </nav>
        </div>

        <aside className="hidden lg:block">
          {/* Scrolls inside itself: a 200-question sheet is taller than the viewport. */}
          <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">{answerSheet}</div>
        </aside>
      </div>

      {sheetOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Đóng phiếu trả lời"
            onClick={() => setSheetOpen(false)}
            className="absolute inset-0 bg-slate-900/40 dark:bg-navy-950/70"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-3xl bg-slate-50 p-4 dark:bg-navy-950">
            {answerSheet}
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              className="mt-3 w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-100"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {confirmOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <button
            type="button"
            aria-label="Đóng"
            onClick={() => setConfirmOpen(false)}
            className="absolute inset-0 bg-slate-900/50 dark:bg-navy-950/75"
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-navy-900 dark:ring-1 dark:ring-navy-700">
            <h2 className="text-lg font-bold text-slate-900 dark:text-navy-50">Nộp bài?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-navy-300">
              {unanswered > 0 ? (
                <>
                  Bạn còn <strong className="text-rose-600 dark:text-rose-300">{unanswered} câu</strong> chưa trả lời.
                  Câu bỏ trống được tính là sai.
                </>
              ) : (
                'Bạn đã trả lời hết tất cả các câu.'
              )}
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-navy-700 dark:text-navy-100 dark:hover:bg-navy-800"
              >
                Làm tiếp
              </button>
              <button
                type="button"
                onClick={submit}
                className="flex-1 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 dark:bg-navy-100 dark:text-navy-950 dark:hover:bg-white"
              >
                Nộp bài
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
