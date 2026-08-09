interface GroupImagesProps {
  urls: string[]
  /** Used for the alt text, e.g. "câu 62–64". */
  label: string
}

/**
 * The pictures attached to a group: a single Part 1 photo, a Part 3/4 chart,
 * or the one-to-three scanned documents of a Part 6/7 passage. Each image links
 * to its full-size source in a new tab so the small print in reading scans stays
 * legible.
 */
export default function GroupImages({ urls, label }: GroupImagesProps) {
  if (urls.length === 0) return null

  return (
    <div className="grid gap-3">
      {urls.map((url, index) => (
        <a
          key={url}
          href={url}
          target="_blank"
          rel="noreferrer"
          title="Mở ảnh gốc trong tab mới"
          className="block"
        >
          <img
            src={url}
            alt={
              urls.length > 1
                ? `Ảnh ${index + 1}/${urls.length} — ${label}`
                : `Ảnh ${label}`
            }
            loading="lazy"
            className="w-full rounded-xl border border-slate-200 bg-white object-contain dark:border-navy-800 dark:bg-navy-900"
          />
        </a>
      ))}
    </div>
  )
}
