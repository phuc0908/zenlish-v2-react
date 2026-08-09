import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import ReviewPager from '../components/ReviewPager'
import { ETS_2026 } from '../data/registry'
import { useTest } from '../hooks/useTest'
import { SECTION_LABEL, partsForSection } from '../lib/scoring'
import { loadResult } from '../lib/storage'

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes} phút ${String(seconds).padStart(2, '0')} giây`
}

export default function ResultPage() {
  const { resultId } = useParams<{ resultId: string }>()
  const result = useMemo(() => (resultId ? loadResult(resultId) : null), [resultId])
  const { test, loading } = useTest(result?.testId)

  if (!result) {
    return (
      <Layout>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-navy-800 dark:bg-navy-900">
          <p className="font-semibold text-slate-800 dark:text-navy-100">Không tìm thấy kết quả này.</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-navy-300">
            Kết quả được lưu trên trình duyệt nên có thể đã bị xoá.
          </p>
          <Link
            to={`/${ETS_2026.id}`}
            className="mt-4 inline-block rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
          >
            Về danh sách đề
          </Link>
        </div>
      </Layout>
    )
  }

  const { score } = result
  const isFull = result.section === 'full'
  const parts = test ? partsForSection(test, result.section) : []

  // Only show a skill's score when that skill was actually part of the exam.
  const listeningTotal = score.parts
    .filter((part) => part.skill === 'listening')
    .reduce((sum, part) => sum + part.total, 0)
  const readingTotal = score.parts
    .filter((part) => part.skill === 'reading')
    .reduce((sum, part) => sum + part.total, 0)

  return (
    <Layout wide>
      <nav className="text-sm text-slate-500 dark:text-navy-400">
        <Link to="/" className="hover:text-indigo-700 dark:hover:text-indigo-300">
          Trang chủ
        </Link>
        <span className="mx-1.5">/</span>
        <Link to={`/${ETS_2026.id}`} className="hover:text-indigo-700 dark:hover:text-indigo-300">
          {ETS_2026.label}
        </Link>
        <span className="mx-1.5">/</span>
        <span className="font-medium text-slate-800 dark:text-navy-100">Kết quả</span>
      </nav>

      <section className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-navy-800 dark:bg-navy-900">
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 px-6 py-8 text-white sm:px-10">
          <p className="text-xs font-bold tracking-[0.2em] uppercase opacity-80">
            {ETS_2026.label} — {result.testLabel}
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-x-8 gap-y-4">
            {isFull && (
              <div>
                <div className="text-5xl font-extrabold tabular-nums">{score.totalScaled}</div>
                <div className="mt-1 text-xs opacity-80">điểm tổng (ước tính)</div>
              </div>
            )}
            <div className="flex gap-8">
              {listeningTotal > 0 && (
                <div>
                  <div className="text-2xl font-bold tabular-nums">{score.listeningScaled}</div>
                  <div className="mt-0.5 text-xs opacity-80">
                    Listening · {score.listeningRaw}/{listeningTotal} câu
                  </div>
                </div>
              )}
              {readingTotal > 0 && (
                <div>
                  <div className="text-2xl font-bold tabular-nums">{score.readingScaled}</div>
                  <div className="mt-0.5 text-xs opacity-80">
                    Reading · {score.readingRaw}/{readingTotal} câu
                  </div>
                </div>
              )}
            </div>
          </div>
          <p className="mt-4 text-xs opacity-75">
            {SECTION_LABEL[result.section]} · làm trong {formatDuration(result.durationMs)}
            {!isFull && ' · chỉ thi một phần nên không tính điểm tổng'}
          </p>
        </div>

        <div className="grid grid-cols-3 divide-x divide-slate-200 text-center dark:divide-navy-800">
          <div className="px-4 py-5">
            <div className="text-2xl font-extrabold text-emerald-600 tabular-nums dark:text-emerald-400">
              {score.correct}
            </div>
            <div className="mt-0.5 text-xs text-slate-500 dark:text-navy-400">câu đúng</div>
          </div>
          <div className="px-4 py-5">
            <div className="text-2xl font-extrabold text-rose-600 tabular-nums dark:text-rose-400">{score.wrong}</div>
            <div className="mt-0.5 text-xs text-slate-500 dark:text-navy-400">câu sai</div>
          </div>
          <div className="px-4 py-5">
            <div className="text-2xl font-extrabold text-slate-400 tabular-nums dark:text-navy-400">{score.blank}</div>
            <div className="mt-0.5 text-xs text-slate-500 dark:text-navy-400">bỏ trống</div>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-navy-800 dark:bg-navy-900">
        <h2 className="text-sm font-bold text-slate-900 dark:text-navy-50">Kết quả theo part</h2>
        <div className="mt-4 grid gap-3">
          {score.parts.map((part) => {
            const ratio = part.total > 0 ? part.correct / part.total : 0
            return (
              <div key={part.partNo} className="flex items-center gap-3">
                <span className="w-14 shrink-0 text-xs font-bold text-slate-700 dark:text-navy-200">
                  Part {part.partNo}
                </span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-navy-800">
                  <div
                    className={`h-full rounded-full ${
                      ratio >= 0.8 ? 'bg-emerald-500' : ratio >= 0.5 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${ratio * 100}%` }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right text-xs font-semibold text-slate-600 tabular-nums dark:text-navy-300">
                  {part.correct}/{part.total}
                </span>
              </div>
            )
          })}
        </div>
        <p className="mt-4 border-t border-slate-100 pt-3 text-[11px] leading-5 text-slate-500 dark:border-navy-800 dark:text-navy-400">
          Điểm quy đổi dựa trên bảng tham chiếu của đề luyện, không phải bảng chính thức của ETS.
          Hãy xem đây là mức ước lượng.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-bold text-slate-900 dark:text-navy-50">Xem lại bài làm</h2>

        {loading && <p className="mt-6 text-sm text-slate-500 dark:text-navy-400">Đang tải đề để xem lại…</p>}

        {!loading && !test && (
          <p className="mt-6 text-sm text-slate-500 dark:text-navy-400">
            Không tải được đề nên chỉ hiển thị điểm, không xem lại được từng câu.
          </p>
        )}

        {test && <ReviewPager parts={parts} answers={result.answers} partBreakdown={score.parts} />}
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          to={`/${ETS_2026.id}/${result.testId}`}
          className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700"
        >
          Làm lại đề này
        </Link>
        <Link
          to={`/${ETS_2026.id}`}
          className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-100 dark:hover:bg-navy-700"
        >
          Chọn đề khác
        </Link>
      </div>
    </Layout>
  )
}
