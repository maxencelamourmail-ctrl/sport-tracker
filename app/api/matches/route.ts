import { NextResponse } from 'next/server'

const FOOTBALL_API_KEY = process.env.FOOTBALL_API_KEY || ''
const FOOTBALL_BASE = 'https://api.football-data.org/v4'

const SPORT_META: Record<string, { color: string; id: string }> = {
  AFL:             { color: '#0057B8', id: 'AFL' },
  F1:              { color: '#e10600', id: 'F1' },
  'League Two':    { color: '#3b9e3f', id: 'L2' },
  'Premier League':{ color: '#6c2fa3', id: 'PL' },
}

async function fetchF1(): Promise<Match[]> {
  try {
    const res = await fetch('https://api.jolpi.ca/ergast/f1/2025/races.json', {
      next: { revalidate: 3600 }
    })
    const data = await res.json()
    const races = data?.MRData?.RaceTable?.Races ?? []
    const now = new Date()
    return races
      .filter((r: any) => new Date(r.date + 'T' + (r.time ?? '12:00:00Z')) >= now)
      .slice(0, 6)
      .map((r: any) => ({
        id: `f1-${r.round}`,
        sport: 'F1',
        sportId: 'F1',
        color: '#e10600',
        date: r.date,
        time: r.time ? r.time.replace('Z', '') : '00:00:00',
        home: `GP ${r.raceName.replace(' Grand Prix', '')}`,
        away: r.Circuit.circuitName,
        venue: `${r.Circuit.Location.locality}, ${r.Circuit.Location.country}`,
        channel: 'Canal+',
        watchLocation: null,
        notes: '',
        isF1: true,
      }))
  } catch {
    return []
  }
}

async function fetchFootball(competitionCode: string, sport: string): Promise<Match[]> {
  if (!FOOTBALL_API_KEY) return getMockFootball(sport)
  try {
    const now = new Date()
    const to = new Date(now)
    to.setDate(to.getDate() + 30)
    const fmt = (d: Date) => d.toISOString().split('T')[0]
    const res = await fetch(
      `${FOOTBALL_BASE}/competitions/${competitionCode}/matches?dateFrom=${fmt(now)}&dateTo=${fmt(to)}&status=SCHEDULED`,
      { headers: { 'X-Auth-Token': FOOTBALL_API_KEY }, next: { revalidate: 3600 } }
    )
    const data = await res.json()
    const matches = data?.matches ?? []
    return matches.slice(0, 8).map((m: any) => ({
      id: `${competitionCode}-${m.id}`,
      sport,
      sportId: SPORT_META[sport].id,
      color: SPORT_META[sport].color,
      date: m.utcDate.split('T')[0],
      time: m.utcDate.split('T')[1].replace('Z', ''),
      home: m.homeTeam.shortName ?? m.homeTeam.name,
      away: m.awayTeam.shortName ?? m.awayTeam.name,
      venue: m.venue ?? '',
      channel: competitionCode === 'PL' ? 'Canal+' : 'beIN Sports',
      watchLocation: null,
      notes: '',
      isF1: false,
    }))
  } catch {
    return getMockFootball(sport)
  }
}

async function fetchAFL(): Promise<Match[]> {
  try {
    const res = await fetch('https://aflapi.afl.com.au/afl/v2/matches?competitionId=1&compSeasonId=62&pageSize=10&roundNumber=current', {
      next: { revalidate: 3600 }
    })
    if (!res.ok) throw new Error()
    const data = await res.json()
    const matches = data?.matches ?? []
    return matches.slice(0, 6).map((m: any) => ({
      id: `afl-${m.id}`,
      sport: 'AFL',
      sportId: 'AFL',
      color: '#0057B8',
      date: m.utcStartTime?.split('T')[0] ?? '',
      time: m.utcStartTime?.split('T')[1]?.replace('Z','') ?? '',
      home: m.homeTeam?.name ?? '',
      away: m.awayTeam?.name ?? '',
      venue: m.venue?.name ?? '',
      channel: 'beIN Sports',
      watchLocation: null,
      notes: '',
      isF1: false,
    }))
  } catch {
    return getMockAFL()
  }
}

function getMockFootball(sport: string): Match[] {
  const isPL = sport === 'Premier League'
  return [
    {
      id: `${sport}-mock-1`, sport, sportId: SPORT_META[sport].id, color: SPORT_META[sport].color,
      date: '2025-06-14', time: '14:00:00',
      home: isPL ? 'Arsenal' : 'Exeter City', away: isPL ? 'Man City' : 'Bradford City',
      venue: isPL ? 'Emirates Stadium' : 'St James Park',
      channel: isPL ? 'Canal+' : 'beIN Sports', watchLocation: null, notes: '', isF1: false,
    },
    {
      id: `${sport}-mock-2`, sport, sportId: SPORT_META[sport].id, color: SPORT_META[sport].color,
      date: '2025-06-21', time: '16:30:00',
      home: isPL ? 'Liverpool' : 'Swindon Town', away: isPL ? 'Chelsea' : 'Grimsby Town',
      venue: isPL ? 'Anfield' : 'County Ground',
      channel: isPL ? 'Canal+' : 'beIN Sports', watchLocation: null, notes: '', isF1: false,
    },
  ]
}

function getMockAFL(): Match[] {
  return [
    {
      id: 'afl-mock-1', sport: 'AFL', sportId: 'AFL', color: '#0057B8',
      date: '2025-06-14', time: '09:20:00',
      home: 'Collingwood', away: 'Carlton',
      venue: 'MCG, Melbourne', channel: 'beIN Sports',
      watchLocation: null, notes: '', isF1: false,
    },
    {
      id: 'afl-mock-2', sport: 'AFL', sportId: 'AFL', color: '#0057B8',
      date: '2025-06-21', time: '11:35:00',
      home: 'Melbourne', away: 'Geelong',
      venue: 'MCG, Melbourne', channel: 'beIN Sports',
      watchLocation: null, notes: '', isF1: false,
    },
  ]
}

export interface Match {
  id: string; sport: string; sportId: string; color: string
  date: string; time: string; home: string; away: string
  venue: string; channel: string; watchLocation: string | null
  notes: string; isF1: boolean
}

export async function GET() {
  const [f1, pl, l2, afl] = await Promise.all([
    fetchF1(),
    fetchFootball('PL', 'Premier League'),
    fetchFootball('ELC', 'League Two'),
    fetchAFL(),
  ])
  const all = [...f1, ...pl, ...l2, ...afl].sort(
    (a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime()
  )
  return NextResponse.json(all)
}
