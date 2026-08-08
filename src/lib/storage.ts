import type { AnswerMap, ScoreResult, Section } from './scoring'

const SESSION_KEY = 'ets-web:session:v1'
const HISTORY_KEY = 'ets-web:history:v1'
const HISTORY_LIMIT = 20

/** An exam in progress. One at a time — starting a new exam replaces it. */
export interface ExamSession {
  sessionId: string
  testId: string
  testLabel: string
  section: Section
  startedAt: number
  /** Absolute timestamp, so a page reload cannot reset the clock. */
  endsAt: number
  answers: AnswerMap
  flagged: number[]
  /** Group ids whose audio already played (blocks replay when not allowed). */
  playedAudio: number[]
  allowReplay: boolean
  screenIndex: number
}

export interface StoredResult {
  id: string
  testId: string
  testLabel: string
  section: Section
  finishedAt: number
  durationMs: number
  answers: AnswerMap
  score: ScoreResult
}

export function newId(): string {
  const uuid = globalThis.crypto?.randomUUID?.()
  if (uuid) return uuid
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    // Private mode, quota, or corrupted JSON — behave like "nothing stored".
    return null
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore: losing autosave is better than breaking the exam.
  }
}

export function loadSession(): ExamSession | null {
  const session = read<ExamSession>(SESSION_KEY)
  if (!session || typeof session.sessionId !== 'string' || typeof session.endsAt !== 'number') {
    return null
  }
  return session
}

export function saveSession(session: ExamSession): void {
  write(SESSION_KEY, session)
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    /* ignore */
  }
}

export function loadHistory(): StoredResult[] {
  const history = read<StoredResult[]>(HISTORY_KEY)
  return Array.isArray(history) ? history : []
}

export function saveResult(result: StoredResult): void {
  const history = [result, ...loadHistory().filter((item) => item.id !== result.id)]
  write(HISTORY_KEY, history.slice(0, HISTORY_LIMIT))
}

export function loadResult(id: string): StoredResult | null {
  return loadHistory().find((item) => item.id === id) ?? null
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY)
  } catch {
    /* ignore */
  }
}
