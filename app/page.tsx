'use client'

import { useEffect, useState } from 'react'
import MatchCard from './components/MatchCard'
import { useMatchPrefs, WatchOption } from './lib/useMatchPrefs'

interface Match {
  id: string
  sport: string
  sportId: string
  color: string
  date: string
  time: string
  home: string
  away: string
  venue: string
  channel: string
  isF1: boolean
}

const SPORTS = ['Tous', 'AFL', 'F1', 'League Two', 'Premier League']

const SPORT_ICONS: Record<string, string> = {
  'Tous': '🏆',
  'AFL': '🏉',
  'F1': '🏎️',
  'League Two': '⚽',
  'Premier League': '👑',
}

const SPORT_COLORS: Record<string, string> = {
  'AFL': '#0057B8',
  'F1': '#e10600',
  'League Two': '#3b9e3f',
  'Premier League': '#6c2fa3',
}

export default function Home() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [activeSport, setActiveSport] = useState('Tous')
  const { prefs, setMatchPref } = useMatchPrefs()

  useEffect(() => {
    fetch('/api/matches')
      .then(r => r.json())
      .then(data => { setMatches(data); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  const filtered = activeSport === 'Tous'
    ? matches
    : matches.filter(m => m.sport === activeSport)

  const grouped = filtered.reduce<Record<string, Match[]>>((acc, m) => {
    const key = m.date
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {})

  const sortedDates = Object.keys(grouped).sort()

  function formatDayHeader(dateStr: string) {
    const d = new Date(dateStr + 'T12:00:00')
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    if (d.toDateString() === today.toDateString()) return "Aujourd'hui"
    if (d.toDateString() === tomorrow.toDateString()) return 'Demain'
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  const totalWithPlan = matches.filter(m => prefs[m.id]?.watchLocation).length

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <header className="sticky top-0 z-20 border-b border-[var(--border)]" style={{ background: 'var(--bg)' }}>
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="display-font text-3xl text-white tracking-wider">SPORT TRACKER</h1>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              {loading ? 'Chargement...' : `${matches.length} matchs · ${totalWithPlan} planifiés`}
            </p>
          </div>
          <div className="text-2xl">📡</div>
        </div>
        <div className="max-w-2xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto">
          {SPORTS.map(sport => {
            const active = activeSport === sport
            const color = SPORT_COLORS[sport]
            return (
              <button
                key={sport}
                onClick={() => setActiveSport(sport)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border"
                style={active ? {
                  background: color ? color + '22' : '#ffffff22',
                  color: color ?? '#fff',
                  borderColor: color ?? '#fff',
                } : {
                  background: 'transparent',
                  color: 'var(--muted)',
                  borderColor: 'var(--border)',
                }}
              >
                <span>{SPORT_ICONS[sport]}</span>
                <span>{sport}</span>
              </button>
            )
          })}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-2 border-[var(--border)] border-t-white rounded-full animate-spin" />
            <p className="text-[var(--muted)] text-sm">Récupération des matchs...</p>
          </div>
        )}
        {error && (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">📡</p>
            <p className="text-[var(--text)] font-semibold">Impossible de charger les matchs</p>
            <p className="text-[var(--muted)] text-sm mt-1">Vérifie ta connexion et relance la page</p>
          </div>
        )}
        {!loading && !error && sortedDates.length === 0 && (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-[var(--muted)]">Aucun match à venir pour ce sport</p>
          </div>
        )}
        {!loading && !error && sortedDates.map(date => (
          <div key={date} className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-sm font-semibold text-[var(--text)] capitalize">
                {formatDayHeader(date)}
              </h2>
              <div className="flex-1 h-px bg-[var(--border)]" />
              <span className="text-xs text-[var(--muted)]">
                {grouped[date].length} match{grouped[date].length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {grouped[date].map(match => (
                <MatchCard
                  key={match.id}
                  match={match}
                  watchLocation={prefs[match.id]?.watchLocation ?? null}
                  notes={prefs[match.id]?.notes ?? ''}
                  onUpdate={(id, update) => setMatchPref(id, update as any)}
                />
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}
