import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const GAME_FRAMES = { '8ball': 5, '9ball': 6, '10ball': 5 }
const GAME_LABELS = { '8ball': '8-Ball', '9ball': '9-Ball', '10ball': '10-Ball' }
const GAME_COLORS = {
  '8ball': 'bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300',
  '9ball': 'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300',
  '10ball': 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300',
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/8 rounded-2xl px-4 py-4 text-center">
      <div className={`text-2xl font-black tabular-nums ${accent ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>{value}</div>
      {sub && <div className="text-xs text-gray-400 dark:text-gray-600 tabular-nums mt-0.5">{sub}</div>}
      <div className="text-[10px] text-gray-400 dark:text-gray-600 uppercase tracking-widest mt-1">{label}</div>
    </div>
  )
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs shadow-sm">
      <p className="text-gray-500 dark:text-gray-400 mb-1 font-medium">{label}</p>
      <p className="font-bold text-emerald-600 dark:text-emerald-400">{d.points} bodova</p>
      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{d.points} od {d.possiblePoints}</p>
    </div>
  )
}

export default function PlayerProfile() {
  const { id } = useParams()
  const [player, setPlayer] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: p } = await supabase
        .from('players')
        .select('id, name, team_id, teams(name)')
        .eq('id', id)
        .single()

      if (!p) { setLoading(false); return }
      setPlayer(p)

      const { data: frames } = await supabase
        .from('frames')
        .select(`
          id, match_id, game_type, is_doubles, home_score, away_score,
          home_player1_id, home_player2_id, away_player1_id, away_player2_id,
          matches(id, match_date, home_team_id, away_team_id,
            home_team:teams!matches_home_team_id_fkey(name),
            away_team:teams!matches_away_team_id_fkey(name))
        `)
        .or(`home_player1_id.eq.${id},home_player2_id.eq.${id},away_player1_id.eq.${id},away_player2_id.eq.${id}`)

      if (!frames || frames.length === 0) {
        setStats({ overall: emptyStats(), byGameType: {}, trendData: [], recentFrames: [] })
        setLoading(false)
        return
      }

      const overall = emptyStats()
      const byGameType = { '8ball': emptyStats(), '9ball': emptyStats(), '10ball': emptyStats() }
      const matchMap = {}

      frames.forEach(frame => {
        const m = frame.matches
        if (!m) return

        const isHome = [frame.home_player1_id, frame.home_player2_id].includes(id)
        const side = isHome ? 'home' : 'away'
        const myPoints = side === 'home' ? (frame.home_score || 0) : (frame.away_score || 0)
        const oppPoints = side === 'home' ? (frame.away_score || 0) : (frame.home_score || 0)
        const possible = GAME_FRAMES[frame.game_type] || Math.max(myPoints, oppPoints)
        const won = myPoints > oppPoints

        // Overall
        overall.framesPlayed++
        overall.points += myPoints
        overall.pointsAgainst += oppPoints
        overall.totalPossible += possible
        if (won) overall.framesWon++

        // Per game type
        if (byGameType[frame.game_type]) {
          const gt = byGameType[frame.game_type]
          gt.framesPlayed++
          gt.points += myPoints
          gt.pointsAgainst += oppPoints
          gt.totalPossible += possible
          if (won) gt.framesWon++
        }

        // Match trend
        const matchId = frame.match_id
        if (!matchMap[matchId]) {
          const opponentTeam = isHome ? m.away_team?.name : m.home_team?.name
          matchMap[matchId] = {
            matchId,
            date: m.match_date,
            points: 0,
            possiblePoints: 0,
            opponent: opponentTeam || '—',
          }
        }
        matchMap[matchId].points += myPoints
        matchMap[matchId].possiblePoints += possible
      })

      const trendData = Object.values(matchMap)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map(m => ({
          ...m,
          dateLabel: new Date(m.date).toLocaleDateString('hr-HR', { day: 'numeric', month: 'short' }),
        }))

      const recentFrames = frames
        .filter(f => f.matches)
        .sort((a, b) => new Date(b.matches.match_date) - new Date(a.matches.match_date))
        .slice(0, 10)
        .map(f => {
          const isHome = [f.home_player1_id, f.home_player2_id].includes(id)
          const side = isHome ? 'home' : 'away'
          const myPts = side === 'home' ? (f.home_score || 0) : (f.away_score || 0)
          const oppPts = side === 'home' ? (f.away_score || 0) : (f.home_score || 0)
          const opponent = isHome ? f.matches.away_team?.name : f.matches.home_team?.name
          return {
            id: f.id,
            matchId: f.match_id,
            date: f.matches.match_date,
            gameType: f.game_type,
            isDoubles: f.is_doubles,
            myPts,
            oppPts,
            opponent,
            won: myPts > oppPts,
          }
        })

      overall.matchesPlayed = Object.keys(matchMap).length
      setStats({ overall, byGameType, trendData, recentFrames })
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-gray-400 dark:text-gray-600">
      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
      </svg>
    </div>
  )

  if (!player) return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-center">
      <div className="text-5xl mb-4">👤</div>
      <p className="text-gray-500 dark:text-gray-400 font-medium">Igrač nije pronađen.</p>
      <Link to="/players" className="mt-4 inline-block text-sm text-emerald-600 dark:text-emerald-400 hover:underline">
        ← Natrag na igrače
      </Link>
    </div>
  )

  const overall = stats?.overall || emptyStats()
  const overallWinPct = overall.framesPlayed ? Math.round((overall.framesWon / overall.framesPlayed) * 100) : 0
  const overallPtsPct = overall.totalPossible ? Math.round((overall.points / overall.totalPossible) * 100) : 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      <Link
        to="/players"
        className="inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Natrag na igrače
      </Link>

      {/* Header */}
      <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/8 rounded-2xl p-6 mb-5 shadow-sm dark:shadow-none">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-emerald-600 dark:text-emerald-500 text-xs font-semibold uppercase tracking-widest mb-1">Profil igrača</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{player.name}</h1>
            <Link
              to={`/teams/${player.team_id}`}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 mt-1 inline-block transition-colors"
            >
              {player.teams?.name}
            </Link>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-1">Ukupni učinak</div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{overallWinPct}%</div>
            <div className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-600">pobj. mečeva</div>
          </div>
        </div>
      </div>

      {/* Overall stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <StatCard label="Utakmice" value={overall.matchesPlayed} />
        <StatCard label="Mečevi" value={`${overall.framesWon}/${overall.framesPlayed}`} />
        <StatCard label="Bodovi" value={overall.points} sub={`od ${overall.totalPossible}`} />
        <StatCard label="Bodovni učinak" value={`${overallPtsPct}%`} accent />
      </div>

      {/* Game-type breakdown */}
      <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/8 rounded-2xl p-5 mb-5 shadow-sm dark:shadow-none">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-4">Po vrsti igre</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Object.entries(stats?.byGameType || {}).map(([type, gt]) => {
            const winPct = gt.framesPlayed ? Math.round((gt.framesWon / gt.framesPlayed) * 100) : 0
            const ptsPct = gt.totalPossible ? Math.round((gt.points / gt.totalPossible) * 100) : 0
            return (
              <div key={type} className="bg-gray-50 dark:bg-white/4 rounded-xl px-4 py-3.5">
                <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-3 ${GAME_COLORS[type]}`}>
                  {GAME_LABELS[type]}
                </span>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Mečevi</span>
                    <span className="font-semibold text-gray-900 dark:text-white tabular-nums">{gt.framesWon}/{gt.framesPlayed}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Bodovi</span>
                    <span className="font-semibold text-gray-900 dark:text-white tabular-nums">{gt.points}/{gt.totalPossible}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Učinak</span>
                    <span className={`font-bold tabular-nums ${winPct >= 60 ? 'text-emerald-600 dark:text-emerald-400' : winPct >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500 dark:text-red-400'}`}>
                      {winPct}%
                    </span>
                  </div>
                </div>
                {gt.framesPlayed > 0 && (
                  <div className="mt-2.5 h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${ptsPct}%` }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Trend chart */}
      {stats?.trendData?.length > 0 && (
        <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/8 rounded-2xl p-5 mb-5 shadow-sm dark:shadow-none">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-4">Trend bodova po utakmici</h2>
          <div className="h-52 text-emerald-500 dark:text-emerald-400">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.trendData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" vertical={false} />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} dy={4} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={28} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(16,185,129,0.2)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area
                  type="monotone"
                  dataKey="points"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill={`url(#grad-${id})`}
                  dot={{ fill: '#10b981', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent frames */}
      {stats?.recentFrames?.length > 0 && (
        <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/8 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-white/8">
            <h2 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-widest">Zadnji mečevi</h2>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-white/4">
            {stats.recentFrames.map(f => (
              <Link
                key={f.id}
                to={`/matches/${f.matchId}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-white/4 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${f.won ? 'bg-emerald-500' : 'bg-red-400'}`} />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">vs {f.opponent}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${GAME_COLORS[f.gameType]}`}>
                        {GAME_LABELS[f.gameType]}
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-600">
                        {f.isDoubles ? 'Dubl' : 'Singl'}
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-600">
                        {new Date(f.date).toLocaleDateString('hr-HR', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <span className={`text-base font-bold tabular-nums ${f.won ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                    {f.myPts}
                  </span>
                  <span className="text-gray-300 dark:text-gray-700 mx-0.5">:</span>
                  <span className="text-base font-bold tabular-nums text-gray-400 dark:text-gray-600">{f.oppPts}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {stats?.overall?.framesPlayed === 0 && (
        <div className="text-center py-16 bg-white dark:bg-[#111] border border-gray-200 dark:border-white/8 rounded-2xl mt-5">
          <div className="text-4xl mb-3">📊</div>
          <p className="font-medium text-gray-500 dark:text-gray-400">Igrač još nije odigrao nijedan meč</p>
          <p className="text-sm text-gray-400 dark:text-gray-600 mt-1">Statistike će se pojaviti ovdje nakon odigranih utakmica</p>
        </div>
      )}
    </div>
  )
}

function emptyStats() {
  return { matchesPlayed: 0, framesPlayed: 0, framesWon: 0, points: 0, pointsAgainst: 0, totalPossible: 0 }
}
