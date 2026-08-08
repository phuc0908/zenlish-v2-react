import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { ETS_2026 } from '../data/registry'

export default function Home() {
  const availableCount = ETS_2026.tests.filter((test) => test.available).length

  return (
    <Layout>
      <section className="text-center">
        <p className="text-sm font-semibold tracking-wide text-indigo-600 uppercase dark:text-indigo-300">
          Luyện thi TOEIC
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-navy-50">
          Thi thử TOEIC theo bộ đề ETS
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-[15px] leading-7 text-slate-600 dark:text-navy-300">
          Làm bài như trong phòng thi: có tính giờ, phiếu trả lời, chấm điểm quy đổi và xem lại
          transcript kèm giải thích tiếng Việt.
        </p>
      </section>

      <section className="mt-10">
        <Link
          to={`/${ETS_2026.id}`}
          className="group block overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-lg dark:border-navy-800 dark:bg-navy-900"
        >
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 px-8 py-10 text-white sm:px-12 sm:py-14">
            <p className="text-xs font-bold tracking-[0.2em] uppercase opacity-80">Bộ đề</p>
            <h2 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">
              {ETS_2026.label}
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-white/85">{ETS_2026.description}</p>
            <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-indigo-700 transition-transform group-hover:translate-x-1 dark:bg-navy-50 dark:text-indigo-800">
              Vào luyện đề
              <span aria-hidden>→</span>
            </span>
          </div>

          <div className="grid grid-cols-3 divide-x divide-slate-200 text-center dark:divide-navy-800">
            <div className="px-4 py-5">
              <div className="text-2xl font-extrabold text-slate-900 dark:text-navy-50">{availableCount}</div>
              <div className="mt-0.5 text-xs text-slate-500 dark:text-navy-400">đề có sẵn</div>
            </div>
            <div className="px-4 py-5">
              <div className="text-2xl font-extrabold text-slate-900 dark:text-navy-50">200</div>
              <div className="mt-0.5 text-xs text-slate-500 dark:text-navy-400">câu mỗi đề</div>
            </div>
            <div className="px-4 py-5">
              <div className="text-2xl font-extrabold text-slate-900 dark:text-navy-50">120</div>
              <div className="mt-0.5 text-xs text-slate-500 dark:text-navy-400">phút full test</div>
            </div>
          </div>
        </Link>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: '⏱',
            title: 'Đúng áp lực phòng thi',
            body: 'Đồng hồ đếm ngược chạy theo thời gian thật, tải lại trang không reset. Hết giờ tự nộp bài.',
          },
          {
            icon: '🎧',
            title: 'Audio phát một lần',
            body: 'Mỗi đoạn nghe phát đúng một lượt như đề thi thật. Muốn thoải mái hơn thì bật tuỳ chọn nghe lại.',
          },
          {
            icon: '📊',
            title: 'Chấm & giải thích',
            body: 'Quy đổi điểm Listening / Reading, thống kê từng part và xem lại từng câu kèm transcript.',
          },
        ].map((feature) => (
          <div key={feature.title} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-navy-800 dark:bg-navy-900">
            <span className="text-xl" aria-hidden>
              {feature.icon}
            </span>
            <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-navy-50">{feature.title}</h3>
            <p className="mt-1 text-[13px] leading-6 text-slate-600 dark:text-navy-300">{feature.body}</p>
          </div>
        ))}
      </section>
    </Layout>
  )
}
