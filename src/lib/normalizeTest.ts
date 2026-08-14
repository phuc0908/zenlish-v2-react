import type { Group, Part, Question, RawQuestion, RawTerm, Skill, Test } from '../types/toeic'

/** Leading question number: "7.", "32. Where do…", "131." */
const LEADING_NUMBER = /^\s*(\d+)\s*[.)]?\s*/

/** Part number inside term_name: "Part 3", "PART 7". */
const PART_NUMBER = /part\s*(\d+)/i

function textOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

/**
 * The source explanations join every line with a blank line in between
 * ("1.\n\n(A) …\n\n(B) …"), which `whitespace-pre-line` renders as big gaps.
 * Collapse runs of blank lines into a single newline and drop the padding
 * around each line so the transcript reads as a compact block.
 */
function compactLines(value: string): string {
  return value
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n')
}

function skillOf(termType: string, partNo: number): Skill {
  if (termType === 'listening' || termType === 'reading') return termType
  return partNo <= 4 ? 'listening' : 'reading'
}

/**
 * Media mirrored by `scripts/fetch-media.mjs` is stored under `public/` and
 * referenced as a path relative to it ("media/test3_ets2026/clip.mp3"), so it
 * needs the same BASE_URL prefix the test JSON itself gets. Absolute URLs —
 * anything still pointing at the original host — pass through untouched.
 */
function resolveMediaUrl(value: string | null): string | null {
  if (!value) return null
  if (/^(https?:)?\/\//i.test(value) || value.startsWith('data:') || value.startsWith('/')) {
    return value
  }
  return `${import.meta.env.BASE_URL}${value.replace(/^\.\//, '')}`
}

/**
 * Collect a group's pictures from either the array field (`image_urls`) or the
 * older single-value one (`image_url`), resolving each to a usable URL and
 * dropping blanks. Order is preserved so multi-document passages read top-down.
 */
function resolveImageUrls(raw: RawQuestion): string[] {
  const candidates = Array.isArray(raw.image_urls)
    ? raw.image_urls
    : raw.image_url != null
      ? [raw.image_url]
      : []
  return candidates
    .map((value) => resolveMediaUrl(textOrNull(value)))
    .filter((url): url is string => url !== null)
}

function normalizeQuestion(raw: RawQuestion, index: number, fallbackNo: number): Question | null {
  const source = raw.sub_questions?.[index]
  if (!source) return null

  const srcObj = source as any
  const rawText = srcObj.question ?? srcObj.title ?? ''
  const match = LEADING_NUMBER.exec(rawText)
  const no = match?.[1] ? Number.parseInt(match[1], 10) : fallbackNo
  const prompt = match ? rawText.slice(match[0].length).trim() : rawText.trim()

  const rawChoices = Array.isArray(srcObj.choices) ? srcObj.choices : Array.isArray(srcObj.answer) ? srcObj.answer : []
  const choices = rawChoices.map((choice: any) => ({
    label: (choice.choice ?? '').trim().toUpperCase(),
    text: (choice.answer ?? choice.choice_answer ?? '').trim(),
    correct: choice.correct === true || choice.choice_right_answer === true,
  }))

  // Prefer the explicit field; fall back to whichever choice is flagged correct.
  const correctAnswer =
    srcObj.correct_answer?.trim().toUpperCase() || (choices.find((c: { correct: boolean }) => c.correct)?.label ?? '')

  return {
    no,
    prompt,
    choices,
    correctAnswer,
    explanation: compactLines(srcObj.explanation_transcript ?? srcObj.explanation ?? ''),
  }
}

function cleanPassage(val: string | null): string | null {
  if (!val) return null
  const unescaped = val
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#039;', "'")
    .replaceAll('&amp;', '&')

  // Strip out HTML <img> tags
  const stripped = unescaped.replace(/<img[^>]*>/gi, '').trim()
  return stripped.length > 0 ? stripped : null
}

function normalizeGroup(raw: RawQuestion, partNo: number, nextNo: number): Group {
  const questions: Question[] = []
  let running = nextNo
  for (let i = 0; i < raw.sub_questions.length; i += 1) {
    const question = normalizeQuestion(raw, i, running)
    if (!question) continue
    questions.push(question)
    running = question.no + 1
  }

  return {
    id: raw.question_id,
    partNo,
    title: raw.title?.trim() ?? '',
    audioUrl: resolveMediaUrl(typeof raw.audio_url === 'string' ? textOrNull(raw.audio_url) : null),
    // `content` is the passage slot in the source export; `passage` is accepted
    // too so richer data can be dropped in later without touching this file.
    passage: cleanPassage(textOrNull(raw.passage) ?? textOrNull(raw.content)),
    imageUrls: resolveImageUrls(raw),
    questions,
  }
}

/**
 * Turn the raw zenlish export into the normalised `Test` model:
 * parses question numbers, sorts parts and groups, and drops any repeated
 * question blocks (the export has shipped fully duplicated before).
 */
export function normalizeTest(raw: RawTerm[], meta: { id: string; label: string }): Test {
  const byPart = new Map<number, { name: string; skill: Skill; directions: string; raws: RawQuestion[] }>()
  const seenQuestionIds = new Set<number>()

  for (const term of raw) {
    const partMatch = PART_NUMBER.exec(term.term_name ?? '')
    if (!partMatch?.[1]) continue
    const partNo = Number.parseInt(partMatch[1], 10)

    let bucket = byPart.get(partNo)
    if (!bucket) {
      bucket = {
        name: term.term_name.trim(),
        skill: skillOf(term.term_type, partNo),
        directions: term.directions?.trim() ?? '',
        raws: [],
      }
      byPart.set(partNo, bucket)
    }

    for (const question of term.questions ?? []) {
      if (seenQuestionIds.has(question.question_id)) continue
      seenQuestionIds.add(question.question_id)
      bucket.raws.push(question)
    }
  }

  const parts: Part[] = [...byPart.entries()]
    .sort(([a], [b]) => a - b)
    .map(([partNo, bucket]) => {
      let nextNo = 1
      const groups = bucket.raws.map((rawQuestion) => {
        const group = normalizeGroup(rawQuestion, partNo, nextNo)
        const last = group.questions.at(-1)
        if (last) nextNo = last.no + 1
        return group
      })

      groups.sort((a, b) => (a.questions[0]?.no ?? 0) - (b.questions[0]?.no ?? 0))

      return {
        no: partNo,
        name: bucket.name,
        skill: bucket.skill,
        directions: bucket.directions,
        groups,
      }
    })

  return { id: meta.id, label: meta.label, parts }
}

/* ------------------------------------------------------------------ */
/* Helpers used across the app                                         */
/* ------------------------------------------------------------------ */

export function allQuestions(parts: Part[]): Question[] {
  return parts.flatMap((part) => part.groups.flatMap((group) => group.questions))
}

export function questionCount(parts: Part[]): number {
  return parts.reduce(
    (total, part) => total + part.groups.reduce((sum, group) => sum + group.questions.length, 0),
    0,
  )
}

/** Missing picture (Part 1) or passage (Part 6/7) in the source data. */
export function isContentMissing(group: Group): boolean {
  if (group.partNo === 1) return group.imageUrls.length === 0
  // Part 6/7 passages ship either as text or as scanned images — either counts.
  if (group.partNo === 6 || group.partNo === 7) {
    return group.passage === null && group.imageUrls.length === 0
  }
  return false
}

/**
 * Sanity check the normalised test. Returns human-readable warnings so the app
 * can surface data problems instead of silently mis-scoring.
 */
export function validateTest(test: Test, expectedTotal = 200): string[] {
  const warnings: string[] = []
  const questions = allQuestions(test.parts)

  if (questions.length !== expectedTotal) {
    warnings.push(`Tổng số câu là ${questions.length}, kỳ vọng ${expectedTotal}.`)
  }

  const seen = new Set<number>()
  const duplicates = new Set<number>()
  for (const question of questions) {
    if (seen.has(question.no)) duplicates.add(question.no)
    seen.add(question.no)
  }
  if (duplicates.size > 0) {
    warnings.push(`Số câu bị trùng: ${[...duplicates].sort((a, b) => a - b).join(', ')}.`)
  }

  const missing: number[] = []
  for (let no = 1; no <= expectedTotal; no += 1) {
    if (!seen.has(no)) missing.push(no)
  }
  if (missing.length > 0) {
    warnings.push(`Thiếu câu: ${missing.join(', ')}.`)
  }

  const noAnswer = questions.filter((q) => q.correctAnswer === '').map((q) => q.no)
  if (noAnswer.length > 0) {
    warnings.push(`Câu không có đáp án đúng: ${noAnswer.join(', ')}.`)
  }

  return warnings
}
