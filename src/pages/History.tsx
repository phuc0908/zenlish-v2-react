import { useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { ETS_2026 } from '../data/registry'
import { SECTION_LABEL } from '../lib/scoring'
import { clearHistory, loadHistory } from '../lib/storage'

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function History() {
  const [history, setHistory] = useState(() => loadHistory())

  return (
    <Layout>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-navy-50">Lịch sử làm bài</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-navy-300">
            Lưu trên trình duyệt này, giữ lại 20 lần gần nhất.
          </p>
        </div>
        {history.length > 0 && (
          <button
            type="button"
            onClick={() => {
              clearHistory()
              setHistory([])
            }}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:border-rose-300 hover:text-rose-700 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-200 dark:hover:border-rose-500/60 dark:hover:text-rose-300"
          >
            Xoá lịch sử
          </button>
        )}
      </header>

      {history.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-navy-700 dark:bg-navy-900">
          <p className="text-sm font-semibold text-slate-700 dark:text-navy-200">Chưa có bài nào.</p>
          <Link
            to={`/${ETS_2026.id}`}
            className="mt-4 inline-block rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
          >
            Bắt đầu luyện đề
          </Link>
        </div>
      ) : (
        <ul className="mt-6 grid gap-3">
          {history.map((item) => (
            <li key={item.id}>
              <Link
                to={`/result/${item.id}`}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-indigo-300 dark:border-navy-800 dark:bg-navy-900 dark:hover:border-indigo-400/60"
              >
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-navy-50">
                    {ETS_2026.label} — {item.testLabel}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-navy-400">
                    {SECTION_LABEL[item.section]} · {formatDate(item.finishedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-6 text-right">
                  <div>
                    <div className="text-xs text-slate-500 dark:text-navy-400">Đúng</div>
                    <div className="text-sm font-bold text-slate-900 tabular-nums dark:text-navy-50">
                      {item.score.correct}/{item.score.total}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 dark:text-navy-400">
                      {item.section === 'full' ? 'Tổng' : 'Điểm'}
                    </div>
                    <div className="text-xl font-extrabold text-indigo-700 tabular-nums dark:text-indigo-300">
                      {item.section === 'full'
                        ? item.score.totalScaled
                        : item.section === 'listening'
                          ? item.score.listeningScaled
                          : item.score.readingScaled}
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Layout>
  )
}
