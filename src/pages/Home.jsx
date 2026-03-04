import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import StandingsTable from '../components/StandingsTable'

export default function Home() {
  const [standings, setStandings] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ teams: 0, matches: 0, points: 0 })

  useEffect(() => {
    async function load() {
      const { data: teams } = await supabase.from('teams').select('id, name')
      const { data: matches } = await supabase
        .from('matches')
        .select('id, home_team_id, away_team_id, frames(home_score, away_score)')

      if (!teams) return setLoading(false)

      const pointsMap = {}
      teams.forEach(t => { pointsMap[t.id] = 0 })

      const matchCount = {}
      let totalPoints = 0

      matches?.forEach(m => {
        matchCount[m.home_team_id] = (matchCount[m.home_team_id] || 0) + 1
        matchCount[m.away_team_id] = (matchCount[m.away_team_id] || 0) + 1
        m.frames?.forEach(f => {
          pointsMap[m.home_team_id] = (pointsMap[m.home_team_id] || 0) + (f.home_score || 0)
          pointsMap[m.away_team_id] = (pointsMap[m.away_team_id] || 0) + (f.away_score || 0)
          totalPoints += (f.home_score || 0) + (f.away_score || 0)
        })
      })

      setStandings(
        teams.map(t => ({
          team_id: t.id,
          team_name: t.name,
          points: pointsMap[t.id] || 0,
          matches: matchCount[t.id] || 0,
        })).sort((a, b) => b.points - a.points)
      )
      setStats({ teams: teams.length, matches: matches?.length || 0, points: totalPoints })
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <div className="mb-8 sm:mb-10">
        <p className="text-emerald-600 dark:text-emerald-500 text-xs font-semibold uppercase tracking-widest mb-2">Trenutna sezona</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-1">Ljestvica lige</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Poredano po ukupno osvojenim bodovima</p>
      </div>

      {!loading && stats.teams > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Ekipe', value: stats.teams },
            { label: 'Utakmice', value: stats.matches },
            { label: 'Bodovi', value: stats.points },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/8 rounded-xl px-4 py-3 text-center">
              <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tabular-nums">{s.value}</div>
              <div className="text-gray-400 dark:text-gray-500 text-xs font-medium mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400 dark:text-gray-600">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
        </div>
      ) : (
        <StandingsTable standings={standings} />
      )}
    </div>
  )
}
