import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import CustomSelect from '../../components/CustomSelect'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const GAME_FRAMES = { '8ball': 5, '9ball': 6, '10ball': 5 }

function StatsTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs shadow-xl">
      <p className="text-gray-500 dark:text-gray-400 mb-1 font-medium">{label}</p>
      <p className="font-bold text-emerald-600 dark:text-emerald-400">{d.points} bodova</p>
      <p className="text-gray-400 dark:text-gray-500 mt-0.5">od {d.maxPoints} mogućih</p>
    </div>
  )
}

function PlayerStatsModal({ player, teams, onClose }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const team = teams.find(t => t.id === player.team_id)

  useEffect(() => {
    async function loadStats() {
      const { data } = await supabase
        .from('frames')
        .select('id, home_score, away_score, game_type, is_doubles, match_id, matches(id, match_date, home_team_id, away_team_id)')
        .or(`home_player1_id.eq.${player.id},home_player2_id.eq.${player.id},away_player1_id.eq.${player.id},away_player2_id.eq.${player.id}`)

      if (!data || data.length === 0) {
        setStats({ matchData: [], totalPoints: 0, totalMaxPoints: 0, matchesPlayed: 0 })
        setLoading(false)
        return
      }

      const matchMap = {}
      data.forEach(frame => {
        const m = frame.matches
        if (!m) return
        const isHome = m.home_team_id === player.team_id
        const myPoints = isHome ? (frame.home_score || 0) : (frame.away_score || 0)
        const maxPoints = GAME_FRAMES[frame.game_type] || 0

        if (!matchMap[frame.match_id]) {
          matchMap[frame.match_id] = { matchId: frame.match_id, matchDate: m.match_date, points: 0, maxPoints: 0 }
        }
        matchMap[frame.match_id].points += myPoints
        matchMap[frame.match_id].maxPoints += maxPoints
      })

      const matchData = Object.values(matchMap)
        .sort((a, b) => new Date(a.matchDate) - new Date(b.matchDate))
        .map(m => ({
          ...m,
          dateLabel: new Date(m.matchDate).toLocaleDateString('hr-HR', { day: 'numeric', month: 'short' }),
          pct: Math.round((m.points / Math.max(m.maxPoints, 1)) * 100),
        }))

      const totalPoints = matchData.reduce((s, m) => s + m.points, 0)
      const totalMaxPoints = matchData.reduce((s, m) => s + m.maxPoints, 0)

      setStats({ matchData, totalPoints, totalMaxPoints, matchesPlayed: matchData.length })
      setLoading(false)
    }
    loadStats()
  }, [player.id])

  const winPct = stats ? Math.round((stats.totalPoints / Math.max(stats.totalMaxPoints, 1)) * 100) : 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full sm:max-w-lg bg-white dark:bg-[#111] rounded-t-3xl sm:rounded-2xl border border-gray-200 dark:border-white/8 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/6">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">{player.name}</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{team?.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/8 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-400 dark:text-gray-600">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { value: stats.matchesPlayed, label: 'Utakmica', color: 'text-gray-900 dark:text-white' },
                  { value: stats.totalPoints, label: 'Bodova', color: 'text-gray-900 dark:text-white' },
                  { value: `${winPct}%`, label: 'Učinkovitost', color: 'text-emerald-600 dark:text-emerald-400' },
                ].map(({ value, label, color }) => (
                  <div key={label} className="text-center bg-gray-50 dark:bg-white/4 rounded-xl p-3.5">
                    <div className={`text-2xl font-black ${color}`}>{value}</div>
                    <div className="text-[10px] text-gray-400 dark:text-gray-600 uppercase tracking-widest mt-0.5">{label}</div>
                  </div>
                ))}
              </div>

              {stats.totalPoints > 0 && (
                <div className="text-center mb-5">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{stats.totalPoints}</span>
                    {' '}bodova od{' '}
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{stats.totalMaxPoints}</span>
                    {' '}mogućih
                  </span>
                </div>
              )}

              {stats.matchData.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 dark:bg-white/3 rounded-xl">
                  <div className="text-3xl mb-2">📊</div>
                  <p className="text-gray-400 dark:text-gray-600 text-sm">Nema podataka za prikaz</p>
                  <p className="text-gray-300 dark:text-gray-700 text-xs mt-1">Igrač još nije sudjelovao u utakmicama</p>
                </div>
              ) : (
                <>
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">Bodovi po utakmici</h4>
                  <div className="h-52 -mx-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.matchData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                        <defs>
                          <linearGradient id={`grad-${player.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" vertical={false} />
                        <XAxis
                          dataKey="dateLabel"
                          tick={{ fontSize: 10, fill: '#9ca3af' }}
                          axisLine={false}
                          tickLine={false}
                          dy={4}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: '#9ca3af' }}
                          axisLine={false}
                          tickLine={false}
                          width={28}
                        />
                        <Tooltip
                          content={<StatsTooltip />}
                          cursor={{ stroke: 'rgba(16,185,129,0.2)', strokeWidth: 1, strokeDasharray: '4 4' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="points"
                          stroke="#10b981"
                          strokeWidth={2.5}
                          fill={`url(#grad-${player.id})`}
                          dot={{ fill: '#10b981', strokeWidth: 0, r: 4 }}
                          activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ManageTeams() {
  const [teams, setTeams] = useState([])
  const [players, setPlayers] = useState([])
  const [newTeam, setNewTeam] = useState('')
  const [newPlayer, setNewPlayer] = useState('')
  const [selectedTeam, setSelectedTeam] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [expandedTeams, setExpandedTeams] = useState(new Set())
  const [editingPlayer, setEditingPlayer] = useState(null)
  const [editName, setEditName] = useState('')
  const [viewingPlayer, setViewingPlayer] = useState(null)

  const fetchData = async () => {
    const { data: t } = await supabase.from('teams').select('*').order('name')
    const { data: p } = await supabase.from('players').select('*').order('name')
    return { teamsData: t || [], playersData: p || [] }
  }

  const loadData = async () => {
    const { teamsData, playersData } = await fetchData()
    setTeams(teamsData)
    setPlayers(playersData)
    setExpandedTeams(prev => {
      const validTeamIds = new Set(teamsData.map(team => team.id))
      return new Set([...prev].filter(id => validTeamIds.has(id)))
    })
    setLoading(false)
  }

  useEffect(() => {
    let cancelled = false

    fetchData().then(({ teamsData, playersData }) => {
      if (cancelled) return
      setTeams(teamsData)
      setPlayers(playersData)
      setExpandedTeams(prev => {
        const validTeamIds = new Set(teamsData.map(team => team.id))
        return new Set([...prev].filter(id => validTeamIds.has(id)))
      })
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  const toggleTeam = (id) => {
    setExpandedTeams(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const addTeam = async (e) => {
    e.preventDefault()
    if (!newTeam.trim()) return
    setSaving(true); setError('')
    const { error } = await supabase.from('teams').insert({ name: newTeam.trim() })
    if (error) setError(error.message)
    else { setNewTeam(''); await loadData() }
    setSaving(false)
  }

  const addPlayer = async (e) => {
    e.preventDefault()
    if (!newPlayer.trim() || !selectedTeam) return
    setSaving(true); setError('')
    const { error } = await supabase.from('players').insert({ name: newPlayer.trim(), team_id: selectedTeam })
    if (error) setError(error.message)
    else { setNewPlayer(''); await loadData() }
    setSaving(false)
  }

  const saveEditPlayer = async (id) => {
    if (!editName.trim()) return
    setSaving(true); setError('')
    const { error } = await supabase.from('players').update({ name: editName.trim() }).eq('id', id)
    if (error) setError(error.message)
    else { setEditingPlayer(null); await loadData() }
    setSaving(false)
  }

  const deletePlayer = async (id) => {
    await supabase.from('players').delete().eq('id', id)
    await loadData()
  }

  const deleteTeam = async (id) => {
    if (!confirm('Izbrisati ovu ekipu i sve njene igrače?')) return
    await supabase.from('teams').delete().eq('id', id)
    await loadData()
  }

  const teamOptions = teams.map(t => ({ value: t.id, label: t.name }))

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-gray-400 dark:text-gray-600">
      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
      </svg>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <div className="mb-8">
        <p className="text-emerald-600 dark:text-emerald-500 text-xs font-semibold uppercase tracking-widest mb-2">Admin</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Ekipe i igrači</h1>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-xl mb-5">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Dodaj ekipu */}
      <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/8 rounded-2xl p-5 mb-4 shadow-sm dark:shadow-none">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-4">Dodaj ekipu</h2>
        <form onSubmit={addTeam} className="flex gap-2">
          <input
            value={newTeam}
            onChange={e => setNewTeam(e.target.value)}
            placeholder="npr. The Breakers"
            className="flex-1 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 border border-gray-300 dark:border-white/10 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
          <button
            type="submit"
            disabled={saving || !newTeam.trim()}
            className="shrink-0 px-5 py-2.5 rounded-xl bg-gray-900 dark:bg-white hover:bg-gray-700 dark:hover:bg-gray-100 disabled:opacity-40 text-white dark:text-gray-900 font-semibold text-sm transition-all"
          >
            Dodaj
          </button>
        </form>
      </div>

      {/* Dodaj igrača */}
      <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/8 rounded-2xl p-5 mb-8 shadow-sm dark:shadow-none">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-4">Dodaj igrača</h2>
        <form onSubmit={addPlayer} className="flex flex-col sm:flex-row gap-3">
          <div className="sm:w-52 shrink-0">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Ekipa</label>
            <CustomSelect value={selectedTeam} onChange={setSelectedTeam} options={teamOptions} placeholder="Odaberi ekipu" />
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Ime igrača</label>
            <input
              value={newPlayer}
              onChange={e => setNewPlayer(e.target.value)}
              placeholder="Puno ime"
              className="w-full rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 border border-gray-300 dark:border-white/10 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>
          <div className="sm:self-end">
            <button
              type="submit"
              disabled={saving || !newPlayer.trim() || !selectedTeam}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gray-900 dark:bg-white hover:bg-gray-700 dark:hover:bg-gray-100 disabled:opacity-40 text-white dark:text-gray-900 font-semibold text-sm transition-all"
            >
              Dodaj
            </button>
          </div>
        </form>
      </div>

      {/* Popis ekipa */}
      {teams.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">👥</div>
          <p className="font-medium text-gray-500 dark:text-gray-400">Još nema ekipa</p>
          <p className="text-sm text-gray-400 dark:text-gray-600 mt-1">Dodaj prvu ekipu gore</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {teams.map(team => {
            const teamPlayers = players.filter(p => p.team_id === team.id)
            const isExpanded = expandedTeams.has(team.id)
            return (
              <div key={team.id} className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/8 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
                <div className="flex items-center justify-between px-4 py-3.5">
                  <button
                    className="flex items-center gap-2.5 flex-1 text-left min-w-0"
                    onClick={() => toggleTeam(team.id)}
                  >
                    <svg
                      className={`w-4 h-4 text-gray-400 dark:text-gray-600 transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
                      fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="font-bold text-gray-900 dark:text-white truncate">{team.name}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full shrink-0">
                      {teamPlayers.length} {teamPlayers.length === 1 ? 'igrač' : 'igrača'}
                    </span>
                  </button>
                  <button
                    onClick={() => deleteTeam(team.id)}
                    className="text-xs text-red-500 dark:text-red-500/70 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded-lg transition-colors ml-2 shrink-0"
                  >
                    Izbriši
                  </button>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-white/6">
                    {teamPlayers.length === 0 ? (
                      <div className="px-5 py-4 text-sm text-gray-400 dark:text-gray-600 italic">Još nema igrača</div>
                    ) : (
                      <ul className="divide-y divide-gray-50 dark:divide-white/4">
                        {teamPlayers.map(p => (
                          <li key={p.id} className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/2 transition-colors">
                            {editingPlayer === p.id ? (
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <input
                                  value={editName}
                                  onChange={e => setEditName(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') saveEditPlayer(p.id)
                                    if (e.key === 'Escape') setEditingPlayer(null)
                                  }}
                                  autoFocus
                                  className="flex-1 min-w-0 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white border border-gray-300 dark:border-white/10 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                />
                                <button
                                  onClick={() => saveEditPlayer(p.id)}
                                  disabled={saving}
                                  className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold disabled:opacity-50"
                                >
                                  Spremi
                                </button>
                                <button
                                  onClick={() => setEditingPlayer(null)}
                                  className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/8 transition-colors"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 min-w-0 truncate">{p.name}</span>
                                <div className="flex items-center gap-0.5 shrink-0">
                                  {/* Uredi */}
                                  <button
                                    onClick={() => { setEditingPlayer(p.id); setEditName(p.name) }}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/8 transition-colors"
                                    title="Uredi ime"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  {/* Statistike */}
                                  <button
                                    onClick={() => setViewingPlayer(p)}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                    title="Statistike"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                  </button>
                                  {/* Izbriši */}
                                  <button
                                    onClick={() => deletePlayer(p.id)}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    title="Izbriši igrača"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {viewingPlayer && (
        <PlayerStatsModal
          player={viewingPlayer}
          teams={teams}
          onClose={() => setViewingPlayer(null)}
        />
      )}
    </div>
  )
}
