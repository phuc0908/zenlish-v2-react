/** Normalised model used by every component. See `lib/normalizeTest.ts`. */

export type Skill = 'listening' | 'reading'

export interface Choice {
  /** "A" | "B" | "C" | "D" */
  label: string
  /** Empty for Part 1 and Part 2 — those choices only exist in the audio. */
  text: string
  correct: boolean
}

export interface Question {
  /** 1..200 */
  no: number
  /** Question text without the leading number. Empty for Part 1/2. */
  prompt: string
  choices: Choice[]
  correctAnswer: string
  /** Transcript (EN) + explanation/translation (VI). */
  explanation: string
}

export interface Group {
  id: number
  partNo: number
  title: string
  audioUrl: string | null
  /** Reading passage for Part 6/7. `null` when the source data has none yet. */
  passage: string | null
  /**
   * Pictures for the group: the Part 1 photo, a Part 3/4 chart or map, or the
   * scanned document(s) that make up a Part 6/7 passage (double/triple passages
   * carry more than one). Empty when the source data has none.
   */
  imageUrls: string[]
  questions: Question[]
}

export interface Part {
  no: number
  name: string
  skill: Skill
  directions: string
  groups: Group[]
}

export interface Test {
  id: string
  label: string
  parts: Part[]
}

/* ------------------------------------------------------------------ */
/* Raw shape of the source JSON (zenlish export).                      */
/* ------------------------------------------------------------------ */

export interface RawChoice {
  choice: string
  answer: string
  correct: boolean
}

export interface RawSubQuestion {
  question: string
  choices: RawChoice[]
  correct_answer: string
  explanation_transcript: string
}

export interface RawQuestion {
  question_id: number
  title: string
  content: string
  is_grouped: boolean
  /** `false` on reading questions, a URL on listening ones. */
  audio_url: string | false
  type: string
  sub_questions: RawSubQuestion[]
  /**
   * Group pictures. `image_urls` is the current field (one entry per Part 1/3/4
   * graphic, several for a Part 6/7 multi-document passage). `image_url` is the
   * older single-value form, still read as a fallback.
   */
  image_urls?: string[]
  image_url?: string
  passage?: string
}

export interface RawTerm {
  term_id: number
  term_name: string
  term_type: string
  term_quantity: number
  directions: string
  questions: RawQuestion[]
}
