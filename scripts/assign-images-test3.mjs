// Assign the local Part 1/3/4 graphics and Part 6/7 passage scans to their
// question groups in test3_ets2026.json, keyed by question_id so it does not
// depend on array order. Idempotent: rerunning overwrites the same fields.
//
//   node scripts/assign-images-test3.mjs            # write
//   node scripts/assign-images-test3.mjs --dry-run  # just report
//
// Images live in public/data/image/test3/. The path written is relative to
// public/ ("data/image/test3/foo.jpg"); normalizeTest adds the BASE_URL prefix.

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, basename } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const TEST = resolve(root, 'public/data/test3_ets2026.json')
const IMAGE_DIR = resolve(root, 'public/data/image/test3')
const REMOTE_LIST = resolve(root, 'public/data/image/test3.json')
const IMG_PREFIX = 'data/image/test3'

const dryRun = process.argv.includes('--dry-run')

// question_id -> ordered list of image filenames for that group.
// Verified against the standard TOEIC layout: Part 1 one photo per question;
// Part 3/4 one chart per graphic set; Part 6 one scan per passage; Part 7 one
// scan per single passage, two for double passages, three for triple passages.
const MAP = {
  // Part 1 — photos, Q1..Q6
  86287: ['zenlish-1-1.jpg'],
  86385: ['zenlish-2-1.jpg'],
  86485: ['zenlish-3-2.jpg'],
  86451: ['zenlish-4-1.jpg'],
  86501: ['zenlish-5-2.jpg'],
  86516: ['zenlish-6-2.jpg'],
  // Part 3 — graphic questions
  87152: ['zenlish-62-64-3.jpg'], // 62-64
  87142: ['zenlish-65-67-4.jpg'], // 65-67
  87166: ['zenlish-68-70-3.jpg'], // 68-70
  // Part 4 — graphic questions
  87344: ['zenlish-95-97-4.jpg'], // 95-97
  87357: ['zenlish-test-3-p4-98-100.jpg'], // 98-100
  // Part 6 — passage scans
  88281: ['zenlish-screenshot-131.jpg'], // 131-134
  88285: ['zenlish-screenshot-135.jpg'], // 135-138
  88291: ['zenlish-screenshot-139.jpg'], // 139-142
  88304: ['zenlish-screenshot-2025-146.jpg'], // 143-146
  // Part 7 — single passages
  88323: ['zenlish-screenshot-147.jpg'], // 147-148
  88340: ['zenlish-screenshot-149.jpg'], // 149-150
  88349: ['zenlish-screenshot-151.jpg'], // 151-152
  88354: ['zenlish-screenshot153.jpg'], // 153-154
  88363: ['zenlish-screenshot-155.jpg'], // 155-157
  88367: ['zenlish-screenshot-158.jpg'], // 158-160
  88373: ['zenlish-screenshot-161.jpg'], // 161-163
  88382: ['zenlish-screenshot-164.jpg'], // 164-167
  88389: ['zenlish-screenshot-168.jpg'], // 168-171
  88399: ['zenlish-screenshot-175.jpg'], // 172-175
  // Part 7 — double passages (2 documents)
  88402: ['zenlish-screenshot-176-1.jpg', 'zenlish-screenshot-177-2.jpg'], // 176-180
  88413: ['zenlish-screenshot-181.jpg', 'zenlish-screensho185.jpg'], // 181-185
  // Part 7 — triple passages (3 documents)
  88425: ['zenlish-screenshot-186.jpg', 'zenlish-screenshot-187.jpg', 'zenlish-screenshot190.jpg'], // 186-190
  88439: ['zenlish-screenshot-191.jpg', 'zenlish-screenshot-192.jpg', 'zenlish-screenshot-193.jpg'], // 191-195
  88454: ['zenlish-screenshot-196.jpg', 'zenlish-screenshot-197.jpg', 'zenlish-screenshot-200.jpg'], // 196-200
}

// Original remote URLs, keyed by filename, so we can keep provenance.
const remoteByName = {}
if (existsSync(REMOTE_LIST)) {
  const { images = [] } = JSON.parse(readFileSync(REMOTE_LIST, 'utf8'))
  for (const url of images) remoteByName[basename(url)] = url
}

const terms = JSON.parse(readFileSync(TEST, 'utf8'))
const byId = new Map()
for (const term of terms) for (const q of term.questions ?? []) byId.set(q.question_id, q)

let groups = 0
let files = 0
const problems = []

for (const [qid, names] of Object.entries(MAP)) {
  const q = byId.get(Number(qid))
  if (!q) {
    problems.push(`qid ${qid} không có trong đề`)
    continue
  }
  for (const name of names) {
    if (!existsSync(resolve(IMAGE_DIR, name))) problems.push(`thiếu file ${name}`)
  }
  q.image_urls = names.map((name) => `${IMG_PREFIX}/${name}`)
  const sources = names.map((name) => remoteByName[name]).filter(Boolean)
  if (sources.length) q.image_urls_source = sources
  groups += 1
  files += names.length
}

// Report any image files on disk that no group claims.
const claimed = new Set(Object.values(MAP).flat())
const listed = Object.keys(remoteByName)
const orphans = listed.filter((name) => !claimed.has(name))

console.log(`Gán ${files} ảnh vào ${groups} nhóm câu.`)
if (orphans.length) console.log(`Ảnh chưa dùng (${orphans.length}): ${orphans.join(', ')}`)
if (problems.length) {
  console.error('CẢNH BÁO:\n- ' + problems.join('\n- '))
  process.exitCode = 1
}

if (dryRun) {
  console.log('(--dry-run: không ghi file)')
} else {
  const backup = `${TEST}.images.bak`
  if (!existsSync(backup)) writeFileSync(backup, readFileSync(TEST))
  writeFileSync(TEST, JSON.stringify(terms, null, 2) + '\n')
  console.log(`Đã ghi ${TEST}\nBackup: ${backup}`)
}
