import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'

interface LayoutProps {
  children: ReactNode
  /** Exam screens supply their own header, so the site chrome is hidden. */
  bare?: boolean
}

export default function Layout({ children, bare = false }: LayoutProps) {
  if (bare) return <div className="min-h-dvh">{children}</div>

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur dark:border-navy-800 dark:bg-navy-900/85">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              ET
            </span>
            <span className="text-base font-bold text-slate-900 dark:text-navy-50">TOEIC ETS</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium text-slate-600 dark:text-navy-300">
            <Link to="/ets-2026" className="hover:text-indigo-700 dark:hover:text-indigo-300">
              ETS 2026
            </Link>
            <Link to="/history" className="hover:text-indigo-700 dark:hover:text-indigo-300">
              Lịch sử
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>

      <footer className="border-t border-slate-200 bg-white dark:border-navy-800 dark:bg-navy-900">
        <div className="mx-auto max-w-6xl px-4 py-5 text-xs text-slate-500 dark:text-navy-400">
          Trang luyện đề TOEIC — điểm quy đổi chỉ mang tính tham khảo, không phải điểm chính thức của
          ETS.
        </div>
      </footer>
    </div>
  )
}
