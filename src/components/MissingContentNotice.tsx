interface MissingContentNoticeProps {
  kind: 'image' | 'passage'
}

const COPY = {
  image: {
    title: 'Chưa có ảnh cho câu này',
    body: 'Dữ liệu nguồn hiện không kèm ảnh của Part 1. Bạn vẫn chọn được đáp án và câu này vẫn được chấm.',
  },
  passage: {
    title: 'Chưa có đoạn văn cho câu này',
    body: 'Dữ liệu nguồn hiện không kèm đoạn văn của Part 6/7. Bạn vẫn chọn được đáp án và câu này vẫn được chấm.',
  },
} as const

export default function MissingContentNotice({ kind }: MissingContentNoticeProps) {
  const copy = COPY[kind]
  return (
    <div className="flex h-full min-h-40 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-100/70 p-6 text-center dark:border-navy-700 dark:bg-navy-900/60">
      <span className="text-2xl" aria-hidden>
        {kind === 'image' ? '🖼️' : '📄'}
      </span>
      <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-navy-200">{copy.title}</p>
      <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-navy-400">{copy.body}</p>
    </div>
  )
}
