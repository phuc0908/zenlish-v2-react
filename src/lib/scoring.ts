import type { Part, Skill, Test } from '../types/toeic'
import { allQuestions } from './normalizeTest'

/** questionNo -> chosen choice label ("A".."D"). */
export type AnswerMap = Record<number, string>

export interface PartBreakdown {
  partNo: number
  name: string
  skill: Skill
  correct: number
  total: number
}

export interface ScoreResult {
  listeningRaw: number
  readingRaw: number
  listeningScaled: number
  readingScaled: number
  totalScaled: number
  correct: number
  wrong: number
  blank: number
  total: number
  parts: PartBreakdown[]
}

/**
 * Reference raw -> scaled conversion, index = number of correct answers (0..100).
 * This is a commonly used practice-test table, NOT an official ETS table — the UI
 * labels the result as an estimate. Edit these arrays to use a different table.
 * Laid out 10 per row (row N = raw scores N0..N9) so the length stays verifiable.
 */
const LISTENING_SCALE: readonly number[] = [
  /*   0 */ 5, 5, 5, 5, 5, 5, 5, 10, 15, 20,
  /*  10 */ 25, 30, 35, 40, 45, 50, 55, 60, 65, 70,
  /*  20 */ 75, 80, 85, 90, 95, 100, 105, 110, 115, 120,
  /*  30 */ 125, 130, 135, 140, 145, 150, 160, 165, 170, 175,
  /*  40 */ 180, 185, 190, 195, 200, 205, 210, 215, 220, 225,
  /*  50 */ 230, 235, 240, 245, 250, 255, 260, 265, 270, 275,
  /*  60 */ 280, 285, 290, 295, 300, 305, 310, 320, 325, 330,
  /*  70 */ 335, 340, 345, 350, 355, 360, 370, 375, 380, 385,
  /*  80 */ 390, 395, 400, 405, 415, 420, 425, 430, 435, 445,
  /*  90 */ 450, 455, 465, 470, 480, 485, 490, 495, 495, 495,
  /* 100 */ 495,
]

const READING_SCALE: readonly number[] = [
  /*   0 */ 5, 5, 5, 5, 5, 5, 5, 5, 10, 15,
  /*  10 */ 20, 25, 30, 35, 40, 45, 50, 55, 60, 65,
  /*  20 */ 70, 75, 80, 85, 90, 95, 100, 105, 110, 115,
  /*  30 */ 120, 125, 130, 135, 140, 145, 150, 155, 160, 165,
  /*  40 */ 170, 175, 180, 185, 190, 195, 200, 205, 210, 215,
  /*  50 */ 220, 225, 230, 235, 240, 245, 250, 255, 260, 265,
  /*  60 */ 270, 275, 280, 285, 290, 295, 300, 305, 310, 315,
  /*  70 */ 320, 325, 330, 335, 340, 345, 350, 355, 360, 365,
  /*  80 */ 370, 375, 385, 395, 400, 405, 410, 415, 420, 425,
  /*  90 */ 430, 435, 440, 445, 450, 455, 465, 470, 480, 485,
  /* 100 */ 495,
]

if (import.meta.env.DEV) {
  for (const [name, table] of [
    ['LISTENING_SCALE', LISTENING_SCALE],
    ['READING_SCALE', READING_SCALE],
  ] as const) {
    if (table.length !== 101) {
      console.error(`[scoring] ${name} phải có 101 phần tử (raw 0..100), đang có ${table.length}.`)
    }
  }
}

function scaleOf(table: readonly number[], raw: number): number {
  const clamped = Math.max(0, Math.min(table.length - 1, raw))
  return table[clamped] ?? 5
}

/** A blank answer counts as wrong; TOEIC has no penalty for guessing. */
export function isCorrect(answer: string | undefined, correctAnswer: string): boolean {
  return answer !== undefined && answer !== '' && answer === correctAnswer
}

export function scoreTest(parts: Part[], answers: AnswerMap): ScoreResult {
  const breakdown: PartBreakdown[] = parts.map((part) => {
    const questions = allQuestions([part])
    const correct = questions.filter((q) => isCorrect(answers[q.no], q.correctAnswer)).length
    return {
      partNo: part.no,
      name: part.name,
      skill: part.skill,
      correct,
      total: questions.length,
    }
  })

  const sumBy = (skill: Skill, key: 'correct' | 'total') =>
    breakdown.filter((p) => p.skill === skill).reduce((sum, p) => sum + p[key], 0)

  const listeningRaw = sumBy('listening', 'correct')
  const readingRaw = sumBy('reading', 'correct')
  const total = breakdown.reduce((sum, p) => sum + p.total, 0)
  const correct = listeningRaw + readingRaw

  const questions = allQuestions(parts)
  const blank = questions.filter((q) => {
    const answer = answers[q.no]
    return answer === undefined || answer === ''
  }).length

  const listeningScaled = scaleOf(LISTENING_SCALE, listeningRaw)
  const readingScaled = scaleOf(READING_SCALE, readingRaw)

  return {
    listeningRaw,
    readingRaw,
    listeningScaled,
    readingScaled,
    totalScaled: listeningScaled + readingScaled,
    correct,
    wrong: total - correct - blank,
    blank,
    total,
    parts: breakdown,
  }
}

/** Parts included by the selected exam section. */
export type Section = 'full' | 'listening' | 'reading'

export function partsForSection(test: Test, section: Section): Part[] {
  if (section === 'full') return test.parts
  return test.parts.filter((part) => part.skill === section)
}

export const SECTION_MINUTES: Record<Section, number> = {
  full: 120,
  listening: 45,
  reading: 75,
}

export const SECTION_LABEL: Record<Section, string> = {
  full: 'Full test (Part 1-7)',
  listening: 'Listening (Part 1-4)',
  reading: 'Reading (Part 5-7)',
}
