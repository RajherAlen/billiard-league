import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import MatchCard from '../components/MatchCard'

export default function Matches() {
  const [matches, setMatches] = useState([])
  const [teamName, setTeamName] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchParams] = useSearchParams()
  const teamId = searchParams.get('team')

  useEffect(() => {
    async function load() {
      let query = supabase
        .from('matches')
        .select(`
          id, match_date, notes, home_team_id, away_team_id,
          home_team:teams!matches_home_team_id_fkey(id, name),
          away_team:teams!matches_away_team_id_fkey(id, name),
          frames(home_score, away_score)
        `)
        .order('match_date', { ascending: false })

      if (teamId) query = query.or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)

      const { data } = await query

      if (teamId) {
        const { data: team } = await supabase.from('teams').select('name').eq('id', teamId).single()
        setTeamName(team?.name || '')
      } else {
        setTeamName('')
      }

      setMatches(data || [])
      setLoading(false)
    }
    load()
  }, [teamId])

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <div className="mb-8">
        <p className="text-emerald-600 dark:text-emerald-500 text-xs font-semibold uppercase tracking-widest mb-2">{teamId ? 'Ekipa' : 'Svi rezultati'}</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          {teamId ? `Mečevi ekipe${teamName ? ` — ${teamName}` : ''}` : 'Rezultati utakmica'}
        </h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400 dark:text-gray-600">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🎱</div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Još nema odigranih utakmica</p>
          <p className="text-gray-400 dark:text-gray-600 text-sm mt-1">Provjerite kada sezona počne</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {matches.map(m => <MatchCard key={m.id} match={m} />)}
        </div>
      )}
    </div>
  )
}
