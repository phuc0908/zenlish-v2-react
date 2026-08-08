import { useEffect, useState } from 'react'
import type { RawTerm, Test } from '../types/toeic'
import { normalizeTest, validateTest } from '../lib/normalizeTest'
import { findTest } from '../data/registry'

interface TestState {
  test: Test | null
  loading: boolean
  error: string | null
}

const cache = new Map<string, Test>()

/** Fetch a test JSON from `public/`, normalise it, and cache it per session. */
export function useTest(testId: string | undefined): TestState {
  const [state, setState] = useState<TestState>(() => {
    const cached = testId ? cache.get(testId) : undefined
    return cached
      ? { test: cached, loading: false, error: null }
      : { test: null, loading: true, error: null }
  })

  useEffect(() => {
    if (!testId) {
      setState({ test: null, loading: false, error: 'Thiếu mã đề.' })
      return
    }

    const cached = cache.get(testId)
    if (cached) {
      setState({ test: cached, loading: false, error: null })
      return
    }

    const meta = findTest(testId)
    if (!meta || !meta.available || !meta.file) {
      setState({ test: null, loading: false, error: 'Đề này chưa có dữ liệu.' })
      return
    }

    let cancelled = false
    setState({ test: null, loading: true, error: null })

    fetch(`${import.meta.env.BASE_URL}${meta.file}`)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json() as Promise<RawTerm[]>
      })
      .then((raw) => {
        if (cancelled) return
        const test = normalizeTest(raw, { id: meta.id, label: meta.label })
        cache.set(testId, test)

        if (import.meta.env.DEV) {
          const warnings = validateTest(test)
          if (warnings.length > 0) {
            console.warn(`[${meta.label}] Cảnh báo dữ liệu:\n- ${warnings.join('\n- ')}`)
          } else {
            console.info(`[${meta.label}] Dữ liệu hợp lệ: ${test.parts.length} part, 200 câu.`)
          }
        }

        setState({ test, loading: false, error: null })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const message = error instanceof Error ? error.message : String(error)
        setState({ test: null, loading: false, error: `Không tải được đề: ${message}` })
      })

    return () => {
      cancelled = true
    }
  }, [testId])

  return state
}
