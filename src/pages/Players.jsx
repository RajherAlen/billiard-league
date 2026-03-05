import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ArrowDown, ArrowUp, ArrowUpDown, RotateCcw, Search, X } from 'lucide-react'

const GAME_FRAMES = { '8ball': 5, '9ball': 6, '10ball': 5 }
const GAME_TABS = [
  { key: 'all', label: 'Sve' },
  { key: '8ball', label: '8-Ball' },
  { key: '9ball', label: '9-Ball' },
  { key: '10ball', label: '10-Ball' },
]

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  const possiblePoints = d.possiblePoints || 0
  return (
    <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs shadow-sm dark:shadow-none">
      <p className="text-gray-500 dark:text-gray-400 mb-1 font-medium">{label}</p>
      <p className="font-bold text-emerald-600 dark:text-emerald-400">{d.points} bodova</p>
      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{d.points} od {possiblePoints}</p>
    </div>
  )
}

function HeaderWithHint({ label, hint }) {
  return (
    <div className="inline-flex items-center justify-center gap-1">
      <span>{label}</span>
      <span
        className="inline-flex w-4 h-4 items-center justify-center rounded-full bg-gray-100 dark:bg-white/10 text-[10px] font-bold text-gray-500 dark:text-gray-400"
        title={hint}
        aria-label={hint}
      >?</span>
    </div>
  )
}

function SortHeader({ label, sortKey, sortBy, sortDir, onSort, align = 'center', hint }) {
  const isActive = sortBy === sortKey
  const justify = align === 'left' ? 'justify-start' : align === 'right' ? 'justify-end' : 'justify-center'
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={'w-full inline-flex items-center ' + justify + ' gap-1.5 hover:text-gray-600 dark:hover:text-gray-300 transition-colors'}
    >
      {hint ? <HeaderWithHint label={label} hint={hint} /> : <span>{label}</span>}
      {isActive ? (
        sortDir === 'asc'
          ? <ArrowUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
          : <ArrowDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
      ) : (
        <ArrowUpDown className="w-3.5 h-3.5 text-gray-300 dark:text-gray-700" strokeWidth={2.2} />
      )}
    </button>
  )
}

function getStatsForTab(player, tab) {
  if (tab === 'all') {
    return {
      framesPlayed: player.framesPlayed,
      framesWon: player.framesWon,
      points: player.points,
      totalPossiblePoints: player.totalPossiblePoints,
      frameWinPct: player.frameWinPct,
      pointsPct: player.pointsPct,
    }
  }
  const gt = player.byGameType?.[tab] || {}
  const framesPlayed = gt.framesPlayed || 0
  const framesWon = gt.framesWon || 0
  const points = gt.points || 0
  const totalPossiblePoints = gt.totalPossible || 0
  return {
    framesPlayed,
    framesWon,
    points,
    totalPossiblePoints,
    frameWinPct: framesPlayed ? Math.round((framesWon / framesPlayed) * 100) : 0,
    pointsPct: totalPossiblePoints ? Math.round((points / totalPossiblePoints) * 100) : 0,
  }
}

export default function Players() {
  const [rows, setRows] = useState([])
  const [selectedPlayerId, setSelectedPlayerId] = useState('')
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false)
  const [sortBy, setSortBy] = useState('points')
  const [sortDir, setSortDir] = useState('desc')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [gameTab, setGameTab] = useState('all')

  useEffect(() => {
    async function load() {
      const [{ data: players }, { data: frames }] = await Promise.all([
        supabase.from('players').select('id, name, team_id, teams(name)').order('name'),
        supabase.from('frames').select('id, match_id, game_type, is_doubles, home_score, away_score, winning_team_id, home_player1_id, home_player2_id, away_player1_id, away_player2_id, matches(home_team_id, away_team_id, match_date)'),
      ])

      const playerMap = {}
      ;(players || []).forEach(p => {
        playerMap[p.id] = {
          id: p.id,
          name: p.name,
          teamName: p.teams?.name || '-',
          teamId: p.team_id,
          matchesPlayed: 0,
          framesPlayed: 0,
          framesWon: 0,
          points: 0,
          pointsAgainst: 0,
          totalPossiblePoints: 0,
          matchIds: new Set(),
          matchMap: {},
          byGameType: {
            '8ball': { framesPlayed: 0, framesWon: 0, points: 0, pointsAgainst: 0, totalPossible: 0 },
            '9ball': { framesPlayed: 0, framesWon: 0, points: 0, pointsAgainst: 0, totalPossible: 0 },
            '10ball': { framesPlayed: 0, framesWon: 0, points: 0, pointsAgainst: 0, totalPossible: 0 },
          },
        }
      })

      ;(frames || []).forEach(frame => {
        const match = frame.matches
        if (!match) return
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
          const myPoints = side === 'home' ? (frame.home_score || 0) : (frame.away_score || 0)
          const oppPoints = side === 'home' ? (frame.away_score || 0) : (frame.home_score || 0)
          const myTeamId = side === 'home' ? match.home_team_id : match.away_team_id
          const fallbackPossible = Math.max(myPoints, oppPoints)
          const framePossible = GAME_FRAMES[frame.game_type] || fallbackPossible

          stats.framesPlayed += 1
          stats.points += myPoints
          stats.pointsAgainst += oppPoints
          stats.totalPossiblePoints += framePossible
          stats.matchIds.add(frame.match_id)

          // Per game type
          if (stats.byGameType[frame.game_type]) {
            const gt = stats.byGameType[frame.game_type]
            gt.framesPlayed++
            gt.points += myPoints
            gt.pointsAgainst += oppPoints
            gt.totalPossible += framePossible
            if (frame.winning_team_id && frame.winning_team_id === myTeamId) gt.framesWon++
          }

          const dateKey = String(match.match_date || '').slice(0, 10)
          if (!stats.matchMap[dateKey]) {
            stats.matchMap[dateKey] = { date: match.match_date, points: 0, against: 0, possiblePoints: 0 }
          }
          stats.matchMap[dateKey].points += myPoints
          stats.matchMap[dateKey].against += oppPoints
          stats.matchMap[dateKey].possiblePoints += framePossible
          if (frame.winning_team_id && frame.winning_team_id === myTeamId) stats.framesWon += 1
        })
      })

      const computedRows = Object.values(playerMap).map(p => {
        const matchesPlayed = p.matchIds.size
        const frameWinPct = p.framesPlayed ? Math.round((p.framesWon / p.framesPlayed) * 100) : 0
        const pointsPct = p.totalPossiblePoints ? Math.round((p.points / p.totalPossiblePoints) * 100) : 0
        const trendData = Object.values(p.matchMap)
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .map(m => ({
            ...m,
            dateLabel: new Date(m.date).toLocaleDateString('hr-HR', { day: 'numeric', month: 'short' }),
          }))
        return { ...p, matchesPlayed, frameWinPct, pointsPct, diff: p.points - p.pointsAgainst, trendData }
      }).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points
        if (b.framesWon !== a.framesWon) return b.framesWon - a.framesWon
        return a.name.localeCompare(b.name)
      })

      setRows(computedRows)
      setSelectedPlayerId(computedRows[0]?.id || '')
      setLoading(false)
    }
    load()
  }, [])

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? rows.filter(r => r.name.toLowerCase().includes(q) || r.teamName.toLowerCase().includes(q)) : rows
  }, [rows, search])

  const sortedRows = useMemo(() => {
    const sorted = [...filteredRows]
    sorted.sort((a, b) => {
      const aStats = getStatsForTab(a, gameTab)
      const bStats = getStatsForTab(b, gameTab)

      let aVal, bVal
      if (sortBy === 'name' || sortBy === 'teamName') {
        const val = (a[sortBy] || '').localeCompare(b[sortBy] || '')
        return sortDir === 'asc' ? val : -val
      }

      // Map sort keys to tab-aware values
      const keyMap = {
        points: 'points',
        framesWon: 'framesWon',
        framesPlayed: 'framesPlayed',
        frameWinPct: 'frameWinPct',
        matchesPlayed: null, // not game-type specific
      }

      if (keyMap[sortBy] === null) {
        aVal = a[sortBy] || 0; bVal = b[sortBy] || 0
      } else if (keyMap[sortBy] && gameTab !== 'all') {
        aVal = aStats[keyMap[sortBy]] || 0; bVal = bStats[keyMap[sortBy]] || 0
      } else {
        aVal = a[sortBy] || 0; bVal = b[sortBy] || 0
      }

      const val = aVal - bVal
      if (val !== 0) return sortDir === 'asc' ? val : -val
      return a.name.localeCompare(b.name)
    })
    return sorted
  }, [filteredRows, sortBy, sortDir, gameTab])

  const selectedPlayer = rows.find(r => r.id === selectedPlayerId) || null
  const selStats = selectedPlayer ? getStatsForTab(selectedPlayer, gameTab) : null
  const efficiency = selStats?.framesPlayed ? Math.round((selStats.framesWon / selStats.framesPlayed) * 100) : 0
  const pointsEfficiency = selStats?.totalPossiblePoints ? Math.round((selStats.points / selStats.totalPossiblePoints) * 100) : 0

  const handleSort = (nextSortBy) => {
    if (sortBy === nextSortBy) { setSortDir(prev => prev === 'asc' ? 'desc' : 'asc'); return }
    setSortBy(nextSortBy)
    setSortDir(nextSortBy === 'name' || nextSortBy === 'teamName' ? 'asc' : 'desc')
  }

  const resetSort = () => { setSortBy('points'); setSortDir('desc') }

  const selectPlayer = (id) => { setSelectedPlayerId(id); setMobilePreviewOpen(true) }

  const PlayerSidePanel = ({ player }) => {
    if (!player) return null
    const ps = getStatsForTab(player, gameTab)
    const eff = ps.framesPlayed ? Math.round((ps.framesWon / ps.framesPlayed) * 100) : 0
    const ptsEff = ps.totalPossiblePoints ? Math.round((ps.points / ps.totalPossiblePoints) * 100) : 0
    return (
      <>
        <div className="grid grid-cols-2 items-start justify-between gap-4 mb-5 flex-wrap">
          <div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-widest mb-1">Pregled igrača</p>
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight overflow-hidden [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] wrap-break-word">{player.name}</h2>
            <Link to={'/teams/' + player.teamId} className="text-sm text-gray-500 dark:text-gray-400 mt-1 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors block">{player.teamName}</Link>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-widest text-gray-400 dark:text-gray-600">Učinak</div>
            <div className="flex items-baseline justify-end gap-2 mt-0.5">
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{eff}%</span>
              <span className="text-gray-300 dark:text-gray-700 text-sm">•</span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{ptsEff}%</span>
            </div>
            <div className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-600 mt-0.5">Mečevi • Bodovi</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { label: 'Utakmice', value: player.matchesPlayed },
            { label: 'Pobjede (mečevi)', value: <><span>{ps.framesWon}</span><span className="text-sm text-gray-500 dark:text-gray-400">/{ps.framesPlayed}</span></> },
            { label: 'Bodovi', fullWidth: true, value: <><span>{ps.points}</span><span className="text-sm text-gray-500 dark:text-gray-400">/{ps.totalPossiblePoints}</span></> },
          ].map(kpi => (
            <div key={kpi.label} className={'bg-gray-50 dark:bg-white/4 rounded-xl px-3.5 py-3 text-center ' + (kpi.fullWidth ? 'col-span-2' : '')}>
              <div className="text-xl font-black text-gray-900 dark:text-white tabular-nums">{kpi.value}</div>
              <div className="text-[10px] text-gray-400 dark:text-gray-600 uppercase tracking-widest mt-0.5">{kpi.label}</div>
            </div>
          ))}
        </div>
        <Link
          to={'/players/' + player.id}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors mb-4"
        >
          Puni profil igrača
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        {player.trendData.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 dark:bg-white/3 rounded-xl">
            <div className="text-3xl mb-2">📈</div>
            <p className="text-gray-400 dark:text-gray-600 text-sm">Nema dovoljno podataka za graf</p>
          </div>
        ) : (
          <>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Trend bodova</h3>
            <div className="h-48 text-emerald-500 dark:text-emerald-400">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={player.trendData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.12} vertical={false} />
                  <XAxis dataKey="dateLabel" tick={{ fontSize: 10, fill: 'currentColor' }} axisLine={false} tickLine={false} dy={4} />
                  <YAxis tick={{ fontSize: 10, fill: 'currentColor' }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'currentColor', strokeDasharray: '4 4', opacity: 0.25 }} />
                  <Area type="monotone" dataKey="points" stroke="currentColor" strokeWidth={2.5} fill="currentColor" fillOpacity={0.16} dot={{ fill: 'currentColor', strokeWidth: 0, r: 3.5 }} activeDot={{ r: 5, fill: 'currentColor' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-emerald-600 dark:text-emerald-500 text-xs font-semibold uppercase tracking-widest mb-2">Igrači</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Lista igrača i statistika</h1>
        </div>
        <button
          type="button"
          onClick={resetSort}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" strokeWidth={2.3} />
          Reset
        </button>
      </div>

      {/* Search + Game-type tabs */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-600" strokeWidth={2} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Pretraži igrača ili ekipu..."
            className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
              <X className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
          )}
        </div>

        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-xl self-start sm:self-auto">
          {GAME_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setGameTab(tab.key)}
              className={'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ' + (
                gameTab === tab.key
                  ? 'bg-white dark:bg-[#222] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400 dark:text-gray-600">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
            {/* Table */}
            <div className="xl:col-span-8 overflow-x-auto rounded-2xl border border-gray-200 dark:border-white/8 shadow-sm dark:shadow-none bg-white dark:bg-[#111]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-white/8">
                    <th className="px-5 py-3.5 text-left text-gray-400 dark:text-gray-500 text-xs font-semibold uppercase tracking-widest">
                      <SortHeader label="Igrač" sortKey="name" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} align="left" />
                    </th>
                    <th className="px-4 py-3.5 text-left text-gray-400 dark:text-gray-500 text-xs font-semibold uppercase tracking-widest hidden md:table-cell">
                      <SortHeader label="Ekipa" sortKey="teamName" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} align="left" />
                    </th>
                    <th className="px-4 py-3.5 text-center text-gray-400 dark:text-gray-500 text-xs font-semibold uppercase tracking-widest">
                      <SortHeader label="Utk" hint="Odigrane utakmice" sortKey="matchesPlayed" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                    </th>
                    <th className="px-4 py-3.5 text-center text-gray-400 dark:text-gray-500 text-xs font-semibold uppercase tracking-widest">
                      <SortHeader label="Meč" hint="Odigrani mečevi" sortKey="framesPlayed" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                    </th>
                    <th className="px-4 py-3.5 text-center text-gray-400 dark:text-gray-500 text-xs font-semibold uppercase tracking-widest">
                      <SortHeader label="Pob" hint="Pobjede u mečevima" sortKey="framesWon" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                    </th>
                    <th className="px-4 py-3.5 text-center text-gray-400 dark:text-gray-500 text-xs font-semibold uppercase tracking-widest hidden sm:table-cell">
                      <SortHeader label="Učinak" hint="% pobjeđenih mečeva / % bodova od mogućih" sortKey="frameWinPct" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                    </th>
                    <th className="px-5 py-3.5 text-center text-gray-400 dark:text-gray-500 text-xs font-semibold uppercase tracking-widest">
                      <SortHeader label="Bodovi" sortKey="points" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-white/4">
                  {sortedRows.map(r => {
                    const ts = getStatsForTab(r, gameTab)
                    return (
                      <tr
                        key={r.id}
                        onClick={() => selectPlayer(r.id)}
                        className={'transition-colors cursor-pointer ' + (selectedPlayerId === r.id ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'hover:bg-gray-50 dark:hover:bg-white/3')}
                      >
                        <td className="px-5 py-4">
                          <Link
                            to={'/players/' + r.id}
                            onClick={e => e.stopPropagation()}
                            className="font-semibold text-gray-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline underline-offset-2 transition-colors"
                          >
                            {r.name}
                          </Link>
                        </td>
                        <td className="px-4 py-4 text-gray-500 dark:text-gray-400 hidden md:table-cell">{r.teamName}</td>
                        <td className="px-4 py-4 text-center text-gray-600 dark:text-gray-300 tabular-nums">{r.matchesPlayed}</td>
                        <td className="px-4 py-4 text-center text-gray-600 dark:text-gray-300 tabular-nums">{ts.framesPlayed}</td>
                        <td className="px-4 py-4 text-center text-gray-600 dark:text-gray-300 tabular-nums">{ts.framesWon}</td>
                        <td className="px-4 py-4 text-center tabular-nums hidden sm:table-cell">
                          <div className="text-gray-900 dark:text-white font-semibold">{ts.frameWinPct}%</div>
                          <div className="text-[11px] text-gray-400 dark:text-gray-600">{ts.pointsPct}%</div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="text-lg font-bold tabular-nums text-gray-900 dark:text-white">{ts.points}</span>
                          <span className="text-sm tabular-nums text-gray-500 dark:text-gray-400">/{ts.totalPossiblePoints}</span>
                        </td>
                      </tr>
                    )
                  })}
                  {sortedRows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-16 text-center">
                        <div className="text-4xl mb-3">👤</div>
                        <div className="text-base font-medium text-gray-500 dark:text-gray-400">
                          {search ? 'Nema rezultata za "' + search + '"' : 'Nema igrača'}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {sortedRows.length > 0 && filteredRows.length !== rows.length && (
                <div className="px-5 py-3 border-t border-gray-100 dark:border-white/5 text-xs text-gray-400 dark:text-gray-600">
                  Prikazano {sortedRows.length} od {rows.length} igrača
                </div>
              )}
            </div>

            {/* Desktop sidebar */}
            {selectedPlayer && (
              <div className="hidden xl:block xl:col-span-4 xl:sticky xl:top-20 bg-white dark:bg-[#111] border border-gray-200 dark:border-white/8 rounded-2xl p-5 sm:p-6 shadow-sm dark:shadow-none overflow-y-auto max-h-[85vh]">
                <PlayerSidePanel player={selectedPlayer} />
              </div>
            )}
          </div>

          {/* Mobile bottom sheet */}
          {selectedPlayer && mobilePreviewOpen && (
            <div
              className="xl:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end"
              onClick={e => e.target === e.currentTarget && setMobilePreviewOpen(false)}
            >
              <div className="w-full max-h-[85vh] overflow-y-auto bg-white dark:bg-[#111] rounded-t-3xl border-t border-gray-200 dark:border-white/10 px-5 pt-4 pb-8">
                <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-700 mx-auto mb-4" />
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-gray-400 dark:text-gray-600 uppercase tracking-widest">Pregled igrača</span>
                  <button
                    onClick={() => setMobilePreviewOpen(false)}
                    className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/8 transition-colors"
                  >
                    <X className="w-5 h-5" strokeWidth={2} />
                  </button>
                </div>
                <PlayerSidePanel player={selectedPlayer} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
