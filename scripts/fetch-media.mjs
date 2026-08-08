/**
 * Mirror every remote media file referenced by a test JSON into `public/media/`
 * and repoint the JSON at the local copy, so the site keeps working if the
 * upstream host (zenlishtoeic.vn) ever disappears.
 *
 *   node scripts/fetch-media.mjs                  # every test in public/data
 *   node scripts/fetch-media.mjs public/data/test3_ets2026.json
 *   node scripts/fetch-media.mjs --dry-run        # list what would be fetched
 *   node scripts/fetch-media.mjs --force          # re-download even if present
 *   node scripts/fetch-media.mjs --verify         # re-hash local files only
 *
 * The original URL is kept alongside as `<key>_source`, so a rerun after the
 * upstream goes down still knows where each file came from.
 */

import { createHash } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DATA_DIR = join(ROOT, 'public', 'data')
const MEDIA_ROOT = join(ROOT, 'public', 'media')

/** Only these are mirrored; anything else stays a remote link. */
const MEDIA_EXTENSIONS = new Set([
  'mp3', 'm4a', 'wav', 'ogg', 'oga', 'opus', 'aac', 'flac',
  'mp4', 'webm', 'mov', 'm4v',
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg',
])

const CONCURRENCY = 6
const ATTEMPTS = 3
const USER_AGENT = 'ets-web media mirror (offline archive)'

const args = process.argv.slice(2)
const flags = new Set(args.filter((a) => a.startsWith('--')))
const targets = args.filter((a) => !a.startsWith('--'))
const DRY_RUN = flags.has('--dry-run')
const FORCE = flags.has('--force')
const VERIFY_ONLY = flags.has('--verify')

// ---------------------------------------------------------------- helpers

const bytes = (n) => `${(n / 1024 / 1024).toFixed(1)} MB`

function isRemote(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value)
}

function extensionOf(pathname) {
  const match = /\.([a-z0-9]+)$/i.exec(pathname)
  return match ? match[1].toLowerCase() : ''
}

/** A stable, filesystem-safe name for a URL — collisions get a hash prefix. */
function fileNameFor(url, taken) {
  const { pathname } = new URL(url)
  const raw = decodeURIComponent(pathname.split('/').pop() || 'file')
  let name = raw.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'file'

  const existing = taken.get(name)
  if (existing && existing !== url) {
    const hash = createHash('sha1').update(url).digest('hex').slice(0, 8)
    name = `${hash}-${name}`
  }
  taken.set(name, url)
  return name
}

/**
 * Walk any JSON shape and hand every `*_url` / `url` string holding a remote
 * media link to `visit`. Keeping it structural means new fields (`image_url`,
 * `video_url`, …) are picked up without touching this script.
 */
function collectMediaRefs(node, visit) {
  if (Array.isArray(node)) {
    for (const item of node) collectMediaRefs(item, visit)
    return
  }
  if (!node || typeof node !== 'object') return

  for (const [key, value] of Object.entries(node)) {
    const isUrlKey = key === 'url' || key.endsWith('_url')
    if (isUrlKey && isRemote(value)) {
      let pathname
      try {
        pathname = new URL(value).pathname
      } catch {
        continue
      }
      if (MEDIA_EXTENSIONS.has(extensionOf(pathname))) visit(node, key, value)
    } else {
      collectMediaRefs(value, visit)
    }
  }
}

async function hashFile(path) {
  const buffer = await readFile(path)
  return createHash('sha256').update(buffer).digest('hex')
}

async function sizeOf(path) {
  try {
    return (await stat(path)).size
  } catch {
    return null
  }
}

/** Stream a URL to disk via a `.part` file, so an interrupted run never leaves a truncated mp3. */
async function download(url, destination) {
  const temporary = `${destination}.part`
  let lastError

  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { 'user-agent': USER_AGENT }, redirect: 'follow' })
      if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`)
      if (!response.body) throw new Error('empty response body')

      const declared = Number(response.headers.get('content-length')) || null

      await pipeline(Readable.fromWeb(response.body), createWriteStream(temporary))

      const received = await sizeOf(temporary)
      if (received === null) throw new Error('file không được ghi ra đĩa')
      if (declared !== null && received !== declared) {
        throw new Error(`tải thiếu: ${received}/${declared} byte`)
      }

      const sha256 = await hashFile(temporary)
      await rename(temporary, destination)
      return { size: received, sha256 }
    } catch (error) {
      lastError = error
      await rm(temporary, { force: true })
      if (attempt < ATTEMPTS) {
        await new Promise((r) => setTimeout(r, 500 * attempt))
      }
    }
  }

  throw new Error(`${url}: ${lastError instanceof Error ? lastError.message : String(lastError)}`)
}

/** Run `worker` over `items`, at most CONCURRENCY at a time. */
async function mapLimit(items, worker) {
  const queue = [...items.entries()]
  const results = new Array(items.length)
  const runners = Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
    for (;;) {
      const next = queue.shift()
      if (!next) return
      const [index, item] = next
      results[index] = await worker(item, index)
    }
  })
  await Promise.all(runners)
  return results
}

// ---------------------------------------------------------------- per-test

async function processTest(jsonPath) {
  const label = jsonPath.replace(`${ROOT}\\`, '').replace(`${ROOT}/`, '')
  const source = await readFile(jsonPath, 'utf8')

  if (source.trim().length === 0) {
    console.log(`· ${label} — file rỗng, bỏ qua`)
    return { downloaded: 0, skipped: 0, failed: 0, totalBytes: 0 }
  }

  let data
  try {
    data = JSON.parse(source)
  } catch (error) {
    console.error(`✗ ${label} — JSON không hợp lệ: ${error.message}`)
    return { downloaded: 0, skipped: 0, failed: 1, totalBytes: 0 }
  }

  const slug = label.split(/[\\/]/).pop().replace(/\.json$/i, '')
  const mediaDir = join(MEDIA_ROOT, slug)
  const publicPrefix = `media/${slug}`

  // Group refs by URL: the same clip is referenced once per question group.
  const taken = new Map()
  const byUrl = new Map()
  collectMediaRefs(data, (holder, key, url) => {
    let entry = byUrl.get(url)
    if (!entry) {
      entry = { url, fileName: fileNameFor(url, taken), refs: [] }
      byUrl.set(url, entry)
    }
    entry.refs.push({ holder, key })
  })

  if (byUrl.size === 0) {
    console.log(`· ${label} — không còn media từ xa (đã mirror trước đó?)`)
    return { downloaded: 0, skipped: 0, failed: 0, totalBytes: 0 }
  }

  const entries = [...byUrl.values()]
  console.log(`\n▸ ${label} — ${entries.length} file media → public/${publicPrefix}/`)

  if (DRY_RUN) {
    for (const entry of entries) console.log(`  sẽ tải: ${entry.fileName}  ←  ${entry.url}`)
    return { downloaded: 0, skipped: entries.length, failed: 0, totalBytes: 0 }
  }

  await mkdir(mediaDir, { recursive: true })

  let downloaded = 0
  let skipped = 0
  const failures = []

  const records = await mapLimit(entries, async (entry, index) => {
    const destination = join(mediaDir, entry.fileName)
    const position = `[${String(index + 1).padStart(2, '0')}/${entries.length}]`
    const existingSize = await sizeOf(destination)

    if (existingSize !== null && existingSize > 0 && !FORCE) {
      skipped += 1
      console.log(`  ${position} ✓ có sẵn  ${entry.fileName} (${bytes(existingSize)})`)
      return { ...entry, size: existingSize, sha256: await hashFile(destination) }
    }

    try {
      const result = await download(entry.url, destination)
      downloaded += 1
      console.log(`  ${position} ↓ tải về  ${entry.fileName} (${bytes(result.size)})`)
      return { ...entry, ...result }
    } catch (error) {
      failures.push(entry.url)
      console.error(`  ${position} ✗ lỗi     ${entry.fileName}: ${error.message}`)
      return null
    }
  })

  // Only repoint refs whose file actually landed on disk — a failed download
  // must keep its remote URL rather than become a broken local path.
  const ok = records.filter(Boolean)
  for (const record of ok) {
    for (const { holder, key } of record.refs) {
      if (holder[`${key}_source`] === undefined) holder[`${key}_source`] = record.url
      holder[key] = `${publicPrefix}/${record.fileName}`
    }
  }

  if (ok.length > 0) {
    const backup = `${jsonPath}.remote.bak`
    if ((await sizeOf(backup)) === null) await writeFile(backup, source, 'utf8')

    await writeFile(jsonPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')

    const manifest = {
      test: slug,
      files: ok.length,
      totalBytes: ok.reduce((sum, r) => sum + r.size, 0),
      items: ok
        .map((r) => ({ file: r.fileName, source: r.url, bytes: r.size, sha256: r.sha256 }))
        .sort((a, b) => a.file.localeCompare(b.file)),
    }
    await writeFile(join(mediaDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  }

  return {
    downloaded,
    skipped,
    failed: failures.length,
    totalBytes: ok.reduce((sum, r) => sum + r.size, 0),
  }
}

// ---------------------------------------------------------------- verify

async function verify() {
  let checked = 0
  let bad = 0
  let dirs = []
  try {
    dirs = await readdir(MEDIA_ROOT, { withFileTypes: true })
  } catch {
    console.error(`Chưa có thư mục ${MEDIA_ROOT} — chạy script không kèm --verify trước.`)
    process.exitCode = 1
    return
  }

  for (const dir of dirs.filter((d) => d.isDirectory())) {
    const manifestPath = join(MEDIA_ROOT, dir.name, 'manifest.json')
    let manifest
    try {
      manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
    } catch {
      console.log(`· ${dir.name} — không có manifest.json, bỏ qua`)
      continue
    }

    console.log(`\n▸ ${dir.name} — kiểm tra ${manifest.items.length} file`)
    for (const item of manifest.items) {
      const path = join(MEDIA_ROOT, dir.name, item.file)
      checked += 1
      const size = await sizeOf(path)
      if (size === null) {
        bad += 1
        console.error(`  ✗ thiếu file  ${item.file}`)
        continue
      }
      const digest = await hashFile(path)
      if (digest !== item.sha256) {
        bad += 1
        console.error(`  ✗ sai sha256  ${item.file}`)
      }
    }
  }

  console.log(`\n${bad === 0 ? '✓' : '✗'} Đã kiểm tra ${checked} file, ${bad} file lỗi.`)
  if (bad > 0) process.exitCode = 1
}

// ---------------------------------------------------------------- main

async function main() {
  if (VERIFY_ONLY) return verify()

  let files
  if (targets.length > 0) {
    files = targets.map((t) => resolve(process.cwd(), t))
  } else {
    const entries = await readdir(DATA_DIR)
    files = entries.filter((name) => name.endsWith('.json')).map((name) => join(DATA_DIR, name)).sort()
  }

  if (files.length === 0) {
    console.error(`Không tìm thấy file JSON nào trong ${DATA_DIR}`)
    process.exitCode = 1
    return
  }

  const totals = { downloaded: 0, skipped: 0, failed: 0, totalBytes: 0 }
  for (const file of files) {
    const result = await processTest(file)
    for (const key of Object.keys(totals)) totals[key] += result[key]
  }

  console.log(
    `\n${totals.failed === 0 ? '✓' : '✗'} Xong: ${totals.downloaded} tải mới, ` +
      `${totals.skipped} có sẵn, ${totals.failed} lỗi — ${bytes(totals.totalBytes)} trong public/media/`,
  )
  if (totals.failed > 0) process.exitCode = 1
}

await main()
