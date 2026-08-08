import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { ETS_2026, findTest } from '../data/registry'
import { useTest } from '../hooks/useTest'
import { isContentMissing, questionCount } from '../lib/normalizeTest'
import { SECTION_LABEL, SECTION_MINUTES, partsForSection, type Section } from '../lib/scoring'
import { loadSession, newId, saveSession, type ExamSession } from '../lib/storage'

const SECTIONS: Section[] = ['full', 'listening', 'reading']

export default function ExamSetup() {
  const { testId } = useParams<{ testId: string }>()
  const navigate = useNavigate()
  const { test, loading, error } = useTest(testId)
  const meta = testId ? findTest(testId) : undefined

  const [section, setSection] = useState<Section>('full')
  const [allowReplay, setAllowReplay] = useState(false)

  const existing = useMemo(() => {
    const session = loadSession()
    return session && session.testId === testId ? session : null
  }, [testId])

  /** Parts whose source data is missing pictures or passages. */
  const incompleteParts = useMemo(() => {
    if (!test) return []
    return test.parts
      .filter((part) => part.groups.some(isContentMissing))
      .map((part) => `Part ${part.no}`)
  }, [test])

  const selectedParts = test ? partsForSection(test, section) : []
  const selectedCount = questionCount(selectedParts)

  const start = () => {
    if (!test || !meta) return
    const now = Date.now()
    const session: ExamSession = {
      sessionId: newId(),
      testId: meta.id,
      testLabel: meta.label,
      section,
      startedAt: now,
      endsAt: now + SECTION_MINUTES[section] * 60_000,
      answers: {},
      flagged: [],
      playedAudio: [],
      allowReplay,
      screenIndex: 0,
    }
    saveSession(session)
    navigate(`/${ETS_2026.id}/${meta.id}/exam`)
  }

  if (loading) {
    return (
      <Layout>
        <p className="py-20 text-center text-sm text-slate-500 dark:text-navy-400">Đang tải đề…</p>
      </Layout>
    )
  }

  if (error || !test || !meta) {
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

  return (
    <Layout>
      <nav className="text-sm text-slate-500 dark:text-navy-400">
        <Link to="/" className="hover:text-indigo-700 dark:hover:text-indigo-300">
          Trang chủ
        </Link>
        <span className="mx-1.5">/</span>
        <Link to={`/${ETS_2026.id}`} className="hover:text-indigo-700 dark:hover:text-indigo-300">
          {ETS_2026.label}
        </Link>
        <span className="mx-1.5">/</span>
        <span className="font-medium text-slate-800 dark:text-navy-100">{meta.label}</span>
      </nav>

      <header className="mt-3">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-navy-50">
          {ETS_2026.label} — {meta.label}
        </h1>
        <p className="mt-1.5 text-sm text-slate-600 dark:text-navy-300">
          {test.parts.length} part · {questionCount(test.parts)} câu
        </p>
      </header>

      {existing && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/40 dark:bg-amber-500/10">
          <div>
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Bạn có một bài đang làm dở</p>
            <p className="mt-0.5 text-xs text-amber-800 dark:text-amber-300">
              {SECTION_LABEL[existing.section]} · {Object.keys(existing.answers).length} câu đã trả
              lời
            </p>
          </div>
          <Link
            to={`/${ETS_2026.id}/${meta.id}/exam`}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white hover:bg-amber-700"
          >
            Tiếp tục làm
          </Link>
        </div>
      )}

      {incompleteParts.length > 0 && (
        <div className="mt-5 rounded-2xl border border-slate-300 bg-white p-4 dark:border-navy-700 dark:bg-navy-900">
          <p className="text-sm font-semibold text-slate-800 dark:text-navy-100">
            ⚠️ {incompleteParts.join(', ')} chưa có ảnh/đoạn văn trong dữ liệu
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-navy-300">
            Bạn vẫn làm và vẫn được chấm những phần này, nhưng vì không thấy đề gốc nên điểm ở các
            part đó chỉ mang tính tham khảo. Khi bổ sung dữ liệu vào file JSON, nội dung sẽ tự hiện.
          </p>
        </div>
      )}

      <section className="mt-6">
        <h2 className="text-sm font-bold text-slate-900 dark:text-navy-50">Chọn phần thi</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {SECTIONS.map((value) => {
            const parts = partsForSection(test, value)
            const active = section === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => setSection(value)}
                aria-pressed={active}
                className={`rounded-2xl border p-5 text-left transition-colors ${
                  active
                    ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500 dark:border-indigo-400 dark:bg-indigo-500/15 dark:ring-indigo-400'
                    : 'border-slate-200 bg-white hover:border-indigo-300 dark:border-navy-800 dark:bg-navy-900 dark:hover:border-indigo-400/60'
                }`}
              >
                <div className="text-sm font-bold text-slate-900 dark:text-navy-50">{SECTION_LABEL[value]}</div>
                <div className="mt-1.5 text-xs text-slate-600 dark:text-navy-300">
                  {questionCount(parts)} câu · {SECTION_MINUTES[value]} phút
                </div>
              </button>
            )
          })}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-navy-800 dark:bg-navy-900">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={allowReplay}
            onChange={(event) => setAllowReplay(event.target.checked)}
            className="mt-0.5 size-4 accent-indigo-600"
          />
          <span>
            <span className="text-sm font-semibold text-slate-900 dark:text-navy-50">Cho phép nghe lại audio</span>
            <span className="mt-0.5 block text-xs leading-5 text-slate-600 dark:text-navy-300">
              Mặc định tắt để giống phòng thi thật: mỗi đoạn nghe chỉ phát một lần và không tua lại
              được. Bật lên nếu bạn muốn luyện thoải mái hơn.
            </span>
          </span>
        </label>
      </section>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={start}
          className="rounded-xl bg-indigo-600 px-7 py-3 text-sm font-bold text-white shadow-sm hover:bg-indigo-700"
        >
          {existing ? 'Bắt đầu bài mới' : 'Bắt đầu làm bài'}
        </button>
        <p className="text-xs text-slate-500 dark:text-navy-400">
          {selectedCount} câu · {SECTION_MINUTES[section]} phút
          {existing && ' · bài đang làm dở sẽ bị thay thế'}
        </p>
      </div>
    </Layout>
  )
}
