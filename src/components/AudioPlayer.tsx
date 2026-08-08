import { useEffect, useRef, useState } from 'react'

interface AudioPlayerProps {
  src: string
  /** Exam realism: when false the clip plays once and cannot be replayed. */
  allowReplay: boolean
  /** True when this clip has already been played in this session. */
  alreadyPlayed?: boolean
  onPlayed?: () => void
}

type Status = 'idle' | 'playing' | 'ended' | 'blocked'

export default function AudioPlayer({
  src,
  allowReplay,
  alreadyPlayed = false,
  onPlayed,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [status, setStatus] = useState<Status>(alreadyPlayed ? 'ended' : 'idle')
  const [progress, setProgress] = useState(0)
  const onPlayedRef = useRef(onPlayed)
  onPlayedRef.current = onPlayed

  // Frozen per clip on purpose. `alreadyPlayed` flips to true the instant we
  // report the play, so reading the live prop below would re-run the effect and
  // its cleanup would pause the clip we had only just started.
  const clip = useRef({ src, playedBefore: alreadyPlayed })
  if (clip.current.src !== src) clip.current = { src, playedBefore: alreadyPlayed }

  // Single-play mode: start automatically, the way a real test tape would.
  useEffect(() => {
    if (allowReplay || clip.current.playedBefore) return
    const audio = audioRef.current
    if (!audio) return

    let cancelled = false
    audio.play().then(
      () => {
        if (cancelled) return
        setStatus('playing')
        // Mark on start, not on end: leaving the screen mid-clip still counts
        // as the one allowed play.
        onPlayedRef.current?.()
      },
      () => {
        // Browsers block autoplay until the user interacts — offer a button.
        if (!cancelled) setStatus('blocked')
      },
    )

    return () => {
      cancelled = true
      audio.pause()
    }
  }, [src, allowReplay])

  if (allowReplay) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-navy-800 dark:bg-navy-900">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <audio ref={audioRef} src={src} controls preload="none" className="w-full" />
      </div>
    )
  }

  const startManually = () => {
    audioRef.current?.play().then(
      () => {
        setStatus('playing')
        onPlayedRef.current?.()
      },
      () => setStatus('blocked'),
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-navy-800 dark:bg-navy-900">
      <audio
        ref={audioRef}
        src={src}
        preload="auto"
        onTimeUpdate={(event) => {
          const el = event.currentTarget
          if (el.duration > 0) setProgress((el.currentTime / el.duration) * 100)
        }}
        onEnded={() => {
          setStatus('ended')
          setProgress(100)
        }}
      />

      <div className="flex items-center gap-3">
        <span
          className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
            status === 'playing'
              ? 'bg-indigo-600 text-white'
              : status === 'ended'
                ? 'bg-slate-200 text-slate-500 dark:bg-navy-800 dark:text-navy-300'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
          }`}
          aria-hidden
        >
          {status === 'ended' ? '✓' : '♪'}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-700 dark:text-navy-200">
            {status === 'playing' && 'Đang phát…'}
            {status === 'ended' && 'Đã phát xong — không nghe lại được'}
            {status === 'idle' && 'Chuẩn bị phát…'}
            {status === 'blocked' && 'Trình duyệt chặn tự động phát'}
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-navy-800">
            <div
              className="h-full rounded-full bg-indigo-500 transition-[width] duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {status === 'blocked' && (
          <button
            type="button"
            onClick={startManually}
            className="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Phát
          </button>
        )}
      </div>
    </div>
  )
}
