import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function formatMatchCount(value) {
  const n = Number(value) || 0
  if (n === 1) return `${n} meč`
  if (n >= 2 && n <= 4) return `${n} meča`
  return `${n} mečeva`
}

function getMatchNoun(value) {
  const n = Number(value) || 0
  if (n === 1) return 'Meč'
  if (n >= 2 && n <= 4) return 'Meča'
  return 'Mečeva'
}

export default function Team() {
  const { id: teamId } = useParams()
  const [team, setTeam] = useState(null)
  const [players, setPlayers] = useState([])
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: t }, { data: p }, { data: m }] = await Promise.all([
        supabase.from('teams').select('id, name').eq('id', teamId).single(),
        supabase.from('players').select('id, name, team_id').eq('team_id', teamId).order('name'),
        supabase
          .from('matches')
          .select(`
            id, match_date, home_team_id, away_team_id,
            home_team:teams!matches_home_team_id_fkey(id, name),
            away_team:teams!matches_away_team_id_fkey(id, name),
            frames(id, frame_order, game_type, is_doubles, home_score, away_score, home_player1_id, home_player2_id, away_player1_id, away_player2_id)
          `)
          .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
          .order('match_date', { ascending: false }),
      ])

      setTeam(t || null)
      setPlayers(p || [])
      setMatches(m || [])
      setLoading(false)
    }

    load()
  }, [teamId])

  const playerMap = useMemo(() => {
    const map = {}
    players.forEach(player => {
      map[player.id] = {
        id: player.id,
        name: player.name,
        framesPlayed: 0,
        framesWon: 0,
        points: 0,
        matchIds: new Set(),
      }
    })
    return map
  }, [players])

  const { teamPoints, teamAgainst, topPlayers, recentMatches } = useMemo(() => {
    let points = 0
    let against = 0
    const matchRows = []

    matches.forEach(match => {
      const isHomeTeam = match.home_team_id === teamId
      const opponentName = isHomeTeam ? match.away_team?.name : match.home_team?.name
      let myMatchScore = 0
      let oppMatchScore = 0

      ;(match.frames || []).forEach(frame => {
        const myScore = isHomeTeam ? (frame.home_score || 0) : (frame.away_score || 0)
        const oppScore = isHomeTeam ? (frame.away_score || 0) : (frame.home_score || 0)

        points += myScore
        against += oppScore
        myMatchScore += myScore
        oppMatchScore += oppScore

        const participants = [
          { id: frame.home_player1_id, side: 'home' },
          { id: frame.home_player2_id, side: 'home' },
          { id: frame.away_player1_id, side: 'away' },
          { id: frame.away_player2_id, side: 'away' },
        ]

        const seen = new Set()
        participants.forEach(({ id, side }) => {
          if (!id || seen.has(id) || !playerMap[id]) return
          seen.add(id)

          const stats = playerMap[id]
          const playerPoints = side === 'home' ? (frame.home_score || 0) : (frame.away_score || 0)
          const playerWon = side === 'home'
            ? (frame.home_score || 0) > (frame.away_score || 0)
            : (frame.away_score || 0) > (frame.home_score || 0)

          stats.framesPlayed += 1
          stats.points += playerPoints
          stats.matchIds.add(match.id)
          if (playerWon) stats.framesWon += 1
        })
      })

      matchRows.push({
        id: match.id,
        matchDate: match.match_date,
        opponentName,
        myScore: myMatchScore,
        oppScore: oppMatchScore,
      })
    })

    const topPlayersList = Object.values(playerMap)
      .map(player => ({
        ...player,
        matchesPlayed: player.matchIds.size,
        winPct: player.framesPlayed ? Math.round((player.framesWon / player.framesPlayed) * 100) : 0,
      }))
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points
        if (b.framesWon !== a.framesWon) return b.framesWon - a.framesWon
        return a.name.localeCompare(b.name)
      })
      .slice(0, 5)

    const lastMatches = matchRows
      .sort((a, b) => new Date(b.matchDate) - new Date(a.matchDate))
      .slice(0, 12)

    return {
      teamPoints: points,
      teamAgainst: against,
      topPlayers: topPlayersList,
      recentMatches: lastMatches,
    }
  }, [matches, playerMap, teamId])

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <div className="flex items-center justify-center py-20 text-gray-400 dark:text-gray-600">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </div>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <p className="text-gray-500 dark:text-gray-400">Ekipa nije pronađena.</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-emerald-600 dark:text-emerald-500 text-xs font-semibold uppercase tracking-widest mb-2">Ekipa</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">{team.name}</h1>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/matches?team=${team.id}`}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-[#111] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-sm font-semibold"
          >
            Svi mečevi ekipe
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Igrača', value: players.length },
          { label: getMatchNoun(matches.length), value: matches.length },
          { label: 'Bodova', value: teamPoints },
          { label: 'Primljeno', value: teamAgainst },
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/8 rounded-xl px-4 py-3 text-center">
            <div className="text-2xl font-black tabular-nums text-gray-900 dark:text-white">{stat.value}</div>
            <div className="text-[11px] text-gray-400 dark:text-gray-600 uppercase tracking-widest mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-5 bg-white dark:bg-[#111] border border-gray-200 dark:border-white/8 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-white/8">
            <h2 className="font-bold text-gray-900 dark:text-white">Top 5 igrača</h2>
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Po osvojenim bodovima</p>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-white/4">
            {topPlayers.length === 0 ? (
              <div className="px-5 py-10 text-center text-gray-400 dark:text-gray-600 text-sm">Nema podataka o igračima.</div>
            ) : topPlayers.map((player, idx) => (
              <div key={player.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{idx + 1}. {player.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">
                    {formatMatchCount(player.matchesPlayed)} • {player.winPct}% učinak
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-bold tabular-nums text-gray-900 dark:text-white">{player.points}</div>
                  <div className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-600">bod</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="xl:col-span-7 bg-white dark:bg-[#111] border border-gray-200 dark:border-white/8 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-white/8 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white">Mečevi ekipe</h2>
              <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Zadnjih 12 mečeva</p>
            </div>
            <div className="text-sm font-semibold tabular-nums text-gray-700 dark:text-gray-200">
              {teamPoints}:{teamAgainst}
            </div>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-white/4">
            {recentMatches.length === 0 ? (
              <div className="px-5 py-10 text-center text-gray-400 dark:text-gray-600 text-sm">Još nema odigranih mečeva.</div>
            ) : recentMatches.map(match => (
              <Link
                key={match.id}
                to={`/matches/${match.id}`}
                className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-gray-50 dark:hover:bg-white/4 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">
                    Meč protiv {match.opponentName || 'nepoznate ekipe'}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5 truncate">
                    {new Date(match.matchDate).toLocaleDateString('hr-HR')}
                  </p>
                </div>
                <div className="text-right shrink-0 text-gray-900 dark:text-white font-bold tabular-nums">
                  {match.myScore}:{match.oppScore}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
