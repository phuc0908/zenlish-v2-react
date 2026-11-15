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
const hostedDataUrl = import.meta.env.VITE_ZENLISH_DATA_URL?.trim()

async function fetchTestJson(url: string | URL, signal: AbortSignal): Promise<RawTerm[]> {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const data: unknown = await response.json()
  if (!Array.isArray(data)) throw new Error('Dữ liệu đề không hợp lệ.')
  return data
}

async function loadTestJson(file: string, signal: AbortSignal): Promise<RawTerm[]> {
  if (hostedDataUrl) {
    const hostedRequest = new AbortController()
    const cancelHostedRequest = () => hostedRequest.abort()
    const timeout = window.setTimeout(cancelHostedRequest, 6000)
    signal.addEventListener('abort', cancelHostedRequest, { once: true })

    try {
      const base = hostedDataUrl.replace(/\/+$/, '') + '/'
      return await fetchTestJson(new URL(file, base), hostedRequest.signal)
    } catch (error) {
      if (signal.aborted) throw error
    } finally {
      window.clearTimeout(timeout)
      signal.removeEventListener('abort', cancelHostedRequest)
    }
  }
  return fetchTestJson(`${import.meta.env.BASE_URL}${file}`, signal)
}

/** Load hosted test data when configured, with packaged JSON as a fallback. */
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

    const controller = new AbortController()
    setState({ test: null, loading: true, error: null })

    loadTestJson(meta.file, controller.signal)
      .then((raw) => {
        if (controller.signal.aborted) return
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
        if (controller.signal.aborted) return
        const message = error instanceof Error ? error.message : String(error)
        setState({ test: null, loading: false, error: `Không tải được đề: ${message}` })
      })

    return () => controller.abort()
  }, [testId])

  return state
}
