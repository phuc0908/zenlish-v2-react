import { useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'ets:theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

function readStored(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    // Private mode / storage disabled — fall back to the OS preference.
    return null
  }
}

function systemTheme(): Theme {
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
}

/** Mirrors the inline boot script in index.html, which runs before React. */
function applyToDocument(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

let current: Theme = readStored() ?? systemTheme()
const listeners = new Set<() => void>()

function emit(): void {
  for (const listener of listeners) listener()
}

export function setTheme(theme: Theme): void {
  // Not a no-op when the value matches: picking the theme you are already on
  // still has to be recorded, so the OS listener below stops overriding it.
  const changed = theme !== current
  current = theme
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Preference just won't survive a reload; the UI still switches.
  }
  if (!changed) return
  applyToDocument(theme)
  emit()
}

export function toggleTheme(): void {
  setTheme(current === 'dark' ? 'light' : 'dark')
}

// Follow the OS only while the user has not picked a theme themselves.
window.matchMedia(DARK_QUERY).addEventListener('change', (event) => {
  if (readStored()) return
  current = event.matches ? 'dark' : 'light'
  applyToDocument(current)
  emit()
})

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot(): Theme {
  return current
}

/**
 * Shared across every mount point — the site header and the exam's own bare
 * header each render a toggle, and both must show the same state.
 */
export function useTheme(): { theme: Theme; setTheme: typeof setTheme; toggle: typeof toggleTheme } {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return { theme, setTheme, toggle: toggleTheme }
}
