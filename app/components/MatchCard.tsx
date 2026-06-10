'use client'

import { useState } from 'react'
import { WATCH_OPTIONS, WatchOption } from '../lib/useMatchPrefs'

interface Match {
  id: string
  sport: string
  color: string
  date: string
  time: string
  home: string
  away: string
  venue: string
  channel: string
  isF1: boolean
}

interface Props {
  match: Match
  watchLocation: WatchOption | null
  notes: string
  onUpdate: (id: string, update: { watchLocation?: WatchOption | null; notes?: string }) => void
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}

function formatTime(timeStr: string) {
  return timeStr.substring(0, 5)
}

const WATCH_COLORS: Record<string, string> = {
  '🏠 Chez moi':       'bg-blue-900/40 text-blue-300 border-blue-700',
  '🍺 Bar / Pub':      'bg-yellow-900/40 text-yellow-300 border-yellow-700',
  '👥 Chez un pote':   'bg-green-900/40 text-green-300 border-green-700',
  '📺 Streaming seul': 'bg-orange-900/40 text-orange-300 border-orange-700',
  '❓ À définir':      'bg-gray-800 text-gray-400 border-gray-600',
}

export default function MatchCard({ match, watchLocation, notes, onUpdate }: Props) {
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesVal, setNotesVal] = useState(notes)
  const [showWatchMenu, setShowWatchMenu] = useState(false)

  const watchStyle = watchLocation ? WATCH_COLORS[watchLocation] : 'bg-gray-800 text-gray-500 border-gray-700'

  const handleNotesBlur = () => {
    setEditingNotes(false)
    onUpdate(match.id, { notes: notesVal })
  }

  return (
    <div
      className="rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface)] hover:border-gray-500 transition-all duration-200"
      style={{ borderLeftWidth: '3px', borderLeftColor: match.color }}
    >
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <span
          className="display-font text-sm tracking-widest px-2 py-0.5 rounded"
          style={{ background: match.color + '22', color: match.color }}
        >
          {match.sport}
        </span>
        <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
          <span>{formatDate(match.date)}</span>
          <span className="font-semibold text-[var(--text)]">{formatTime(match.time)}</span>
        </div>
      </div>

      <div className="px-4 py-3">
        {match.isF1 ? (
          <div>
            <p className="text-lg font-bold text-[var(--text)] leading-tight">{match.home}</p>
            <p className="text-sm text-[var(--muted)] mt-0.5">{match.away}</p>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-[var(--text)] text-sm flex-1 text-right">{match.home}</span>
            <span className="text-[var(--muted)] text-xs font-bold px-2">VS</span>
            <span className="font-semibold text-[var(--text)] text-sm flex-1">{match.away}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 px-4 pb-3 text-xs text-[var(--muted)]">
        {match.venue && <span className="truncate">📍 {match.venue}</span>}
        <span className="ml-auto shrink-0 bg-[var(--surface2)] px-2 py-0.5 rounded text-[var(--muted)]">
          {match.channel}
        </span>
      </div>

      <div className="border-t border-[var(--border)]" />

      <div className="px-4 py-3 flex items-center gap-2 flex-wrap">
        <div className="relative">
          <button
            onClick={() => setShowWatchMenu(!showWatchMenu)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${watchStyle}`}
          >
            {watchLocation ?? '+ Où regarder ?'}
          </button>
          {showWatchMenu && (
            <div className="absolute bottom-full mb-2 left-0 z-10 bg-[var(--surface2)] border border-[var(--border)] rounded-xl shadow-xl p-1 min-w-48">
              {WATCH_OPTIONS.map(opt => (
                <button
                  key={opt}
                  onClick={() => { onUpdate(match.id, { watchLocation: opt }); setShowWatchMenu(false) }}
                  className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-[var(--border)] transition-colors text-[var(--text)]"
                >
                  {opt}
                </button>
              ))}
              {watchLocation && (
                <button
                  onClick={() => { onUpdate(match.id, { watchLocation: null }); setShowWatchMenu(false) }}
                  className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-red-900/30 text-red-400 transition-colors"
                >
                  ✕ Effacer
                </button>
              )}
            </div>
          )}
        </div>

        {editingNotes ? (
          <input
            autoFocus
            value={notesVal}
            onChange={e => setNotesVal(e.target.value)}
            onBlur={handleNotesBlur}
            onKeyDown={e => e.key === 'Enter' && handleNotesBlur()}
            placeholder="Note..."
            className="flex-1 text-xs bg-[var(--surface2)] border border-[var(--border)] rounded-full px-3 py-1.5 text-[var(--text)] outline-none focus:border-gray-500 min-w-0"
          />
        ) : (
          <button
            onClick={() => setEditingNotes(true)}
            className="text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors truncate max-w-[160px]"
          >
            {notes ? `📝 ${notes}` : '+ note'}
          </button>
        )}
      </div>
    </div>
  )
}
