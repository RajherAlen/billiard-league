import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import StandingsTable from '../components/StandingsTable'

export default function Home() {
  const [standings, setStandings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: teams }, { data: matches }] = await Promise.all([
        supabase.from('teams').select('id, name'),
        supabase.from('matches').select('id, match_date, home_team_id, away_team_id, frames(home_score, away_score)'),
      ])

      if (!teams) return setLoading(false)

      // Initialize per-team accumulators
      const teamMap = {}
      teams.forEach(t => {
        teamMap[t.id] = {
          team_id: t.id,
          team_name: t.name,
          played: 0,
          wins: 0,
          losses: 0,
          framePoints: 0,
          frameAgainst: 0,
          matchResults: [], // {date, result: 'W'|'L'}
        }
      })

      // Process only matches that have frames (played matches)
      ;(matches || []).forEach(m => {
        if (!m.frames || m.frames.length === 0) return // skip unplayed fixtures

        const homePts = m.frames.reduce((s, f) => s + (f.home_score || 0), 0)
        const awayPts = m.frames.reduce((s, f) => s + (f.away_score || 0), 0)

        const homeResult = homePts > awayPts ? 'W' : homePts < awayPts ? 'L' : 'D'
        const awayResult = homePts < awayPts ? 'W' : homePts > awayPts ? 'L' : 'D'

        if (teamMap[m.home_team_id]) {
          const t = teamMap[m.home_team_id]
          t.played++
          t.framePoints += homePts
          t.frameAgainst += awayPts
          if (homeResult === 'W') t.wins++
          else t.losses++
          t.matchResults.push({ date: m.match_date, result: homeResult })
        }

        if (teamMap[m.away_team_id]) {
          const t = teamMap[m.away_team_id]
          t.played++
          t.framePoints += awayPts
          t.frameAgainst += homePts
          if (awayResult === 'W') t.wins++
          else t.losses++
          t.matchResults.push({ date: m.match_date, result: awayResult })
        }
      })

      const computed = Object.values(teamMap)
        .map(t => ({
          ...t,
          matchPoints: t.wins * 3,
          frameDiff: t.framePoints - t.frameAgainst,
          form: t.matchResults
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5)
            .map(r => r.result),
        }))
        .sort((a, b) => {
          if (b.framePoints !== a.framePoints) return b.framePoints - a.framePoints
          if (b.frameDiff !== a.frameDiff) return b.frameDiff - a.frameDiff
          if (b.matchPoints !== a.matchPoints) return b.matchPoints - a.matchPoints
          return a.team_name.localeCompare(b.team_name)
        })

      setStandings(computed)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <div className="mb-8 sm:mb-10">
        <p className="text-emerald-600 dark:text-emerald-500 text-xs font-semibold uppercase tracking-widest mb-2">Trenutna sezona</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-1">Ljestvica lige</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Poredano po ukupnim bodovima mečeva</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400 dark:text-gray-600">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </div>
      ) : (
        <StandingsTable standings={standings} />
      )}
    </div>
  )
}
