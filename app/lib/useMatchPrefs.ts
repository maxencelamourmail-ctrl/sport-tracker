import { useState, useEffect } from 'react'

export type WatchOption = '🏠 Chez moi' | '🍺 Bar / Pub' | '👥 Chez un pote' | '📺 Streaming seul' | '❓ À définir'

export const WATCH_OPTIONS: WatchOption[] = [
  '🏠 Chez moi',
  '🍺 Bar / Pub',
  '👥 Chez un pote',
  '📺 Streaming seul',
  '❓ À définir',
]

interface MatchPrefs {
  watchLocation: WatchOption | null
  notes: string
}

type PrefsStore = Record<string, MatchPrefs>

export function useMatchPrefs() {
  const [prefs, setPrefs] = useState<PrefsStore>({})

  useEffect(() => {
    try {
      const stored = localStorage.getItem('sport-tracker-prefs')
      if (stored) setPrefs(JSON.parse(stored))
    } catch {}
  }, [])

  const setMatchPref = (id: string, update: Partial<MatchPrefs>) => {
    setPrefs(prev => {
      const next = {
        ...prev,
        [id]: { watchLocation: null, notes: '', ...prev[id], ...update }
      }
      localStorage.setItem('sport-tracker-prefs', JSON.stringify(next))
      return next
    })
  }

  return { prefs, setMatchPref }
}
