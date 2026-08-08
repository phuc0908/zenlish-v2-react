import type { Group, Part, Skill } from '../types/toeic'

/**
 * One screen of the exam. Most parts show a single group (one audio clip or one
 * passage with its questions); Part 5 is single-sentence questions, so several
 * are batched onto one screen to avoid 30 pages of clicking.
 */
export interface Screen {
  index: number
  partNo: number
  partName: string
  skill: Skill
  directions: string
  /** First screen of its part — the place to show the part directions. */
  isPartStart: boolean
  groups: Group[]
  firstQuestionNo: number
  lastQuestionNo: number
}

const PART5_PER_SCREEN = 5

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size))
  }
  return out
}

export function buildScreens(parts: Part[]): Screen[] {
  const screens: Screen[] = []

  for (const part of parts) {
    const batches = part.no === 5 ? chunk(part.groups, PART5_PER_SCREEN) : part.groups.map((g) => [g])

    batches.forEach((groups, batchIndex) => {
      const numbers = groups.flatMap((group) => group.questions.map((q) => q.no))
      screens.push({
        index: screens.length,
        partNo: part.no,
        partName: part.name,
        skill: part.skill,
        directions: part.directions,
        isPartStart: batchIndex === 0,
        groups,
        firstQuestionNo: numbers.length > 0 ? Math.min(...numbers) : 0,
        lastQuestionNo: numbers.length > 0 ? Math.max(...numbers) : 0,
      })
    })
  }

  return screens
}

/** Index of the screen containing a question number, or -1. */
export function screenIndexOfQuestion(screens: Screen[], questionNo: number): number {
  return screens.findIndex((screen) =>
    screen.groups.some((group) => group.questions.some((q) => q.no === questionNo)),
  )
}
