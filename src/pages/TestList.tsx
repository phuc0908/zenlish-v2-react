import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { ETS_2026 } from '../data/registry'

export default function TestList() {
  return (
    <Layout>
      <nav className="text-sm text-slate-500 dark:text-navy-400">
        <Link to="/" className="hover:text-indigo-700 dark:hover:text-indigo-300">
          Trang chủ
        </Link>
        <span className="mx-1.5">/</span>
        <span className="font-medium text-slate-800 dark:text-navy-100">{ETS_2026.label}</span>
      </nav>

      <header className="mt-3">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-navy-50">{ETS_2026.label}</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-600 dark:text-navy-300">{ETS_2026.description}</p>
      </header>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ETS_2026.tests.map((test) => {
          if (!test.available) {
            return (
              <li
                key={test.id}
                className="rounded-2xl border border-dashed border-slate-300 bg-slate-100/60 p-5 dark:border-navy-700 dark:bg-navy-900/60"
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-slate-400 dark:text-navy-400">{test.label}</span>
                  <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-500 dark:bg-navy-800 dark:text-navy-300">
                    Chưa có dữ liệu
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-400 dark:text-navy-400">
                  Thêm file JSON vào <code className="font-mono">public/data/</code> để mở đề này.
                </p>
              </li>
            )
          }

          return (
            <li key={test.id}>
              <Link
                to={`/${ETS_2026.id}/${test.id}`}
                className="group block h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:border-navy-800 dark:bg-navy-900 dark:hover:border-indigo-400/60"
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-slate-900 dark:text-navy-50">{test.label}</span>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                    Sẵn sàng
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-navy-400">
                  7 part · 200 câu · có audio và giải thích
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                  Bắt đầu
                  <span className="transition-transform group-hover:translate-x-0.5" aria-hidden>
                    →
                  </span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </Layout>
  )
}
