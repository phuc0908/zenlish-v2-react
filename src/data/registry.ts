/** Collections and tests available on the site. */

export interface TestMeta {
  id: string
  label: string
  /** Path under `public/`. Empty when the test has no data yet. */
  file: string
  available: boolean
}

export interface Collection {
  id: string
  label: string
  description: string
  tests: TestMeta[]
}

export const ETS_2026: Collection = {
  id: 'ets-2026',
  label: 'ETS 2026',
  description: 'Bộ đề luyện thi TOEIC ETS 2026 — 7 part, 200 câu mỗi đề, có audio và giải thích.',
  tests: [
    { id: 'test-1', label: 'Test 1', file: '', available: false },
    { id: 'test-2', label: 'Test 2', file: '', available: false },
    { id: 'test-3', label: 'Test 3', file: 'data/test3_ets2026.json', available: true },
    { id: 'test-4', label: 'Test 4', file: '', available: false },
    { id: 'test-5', label: 'Test 5', file: '', available: false },
    { id: 'test-6', label: 'Test 6', file: '', available: false },
    { id: 'test-7', label: 'Test 7', file: '', available: false },
    { id: 'test-8', label: 'Test 8', file: '', available: false },
    { id: 'test-9', label: 'Test 9', file: '', available: false },
    { id: 'test-10', label: 'Test 10', file: '', available: false },
  ],
}

export const COLLECTIONS: Collection[] = [ETS_2026]

export function findTest(testId: string): TestMeta | undefined {
  return ETS_2026.tests.find((test) => test.id === testId)
}
