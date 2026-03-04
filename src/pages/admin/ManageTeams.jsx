import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import CustomSelect from '../../components/CustomSelect'

export default function ManageTeams() {
  const [teams, setTeams] = useState([])
  const [players, setPlayers] = useState([])
  const [newTeam, setNewTeam] = useState('')
  const [newPlayer, setNewPlayer] = useState('')
  const [selectedTeam, setSelectedTeam] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadData = async () => {
    const { data: t } = await supabase.from('teams').select('*').order('name')
    const { data: p } = await supabase.from('players').select('*').order('name')
    setTeams(t || [])
    setPlayers(p || [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

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

  const deletePlayer = async (id) => {
    await supabase.from('players').delete().eq('id', id)
    await loadData()
  }

  const deleteTeam = async (id) => {
    if (!confirm('Delete this team and all their players?')) return
    await supabase.from('teams').delete().eq('id', id)
    await loadData()
  }

  const teamOptions = teams.map(t => ({ value: t.id, label: t.name }))

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-gray-400 dark:text-gray-600">
      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <div className="mb-8">
        <p className="text-emerald-600 dark:text-emerald-500 text-xs font-semibold uppercase tracking-widest mb-2">Admin</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Teams & Players</h1>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-xl mb-5">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Add Team */}
      <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/8 rounded-2xl p-5 mb-4 shadow-sm dark:shadow-none">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-4">Add Team</h2>
        <form onSubmit={addTeam} className="flex gap-2">
          <input
            value={newTeam}
            onChange={e => setNewTeam(e.target.value)}
            placeholder="e.g. The Breakers"
            className="flex-1 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 border border-gray-300 dark:border-white/10 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
          <button
            type="submit"
            disabled={saving || !newTeam.trim()}
            className="shrink-0 px-5 py-2.5 rounded-xl bg-gray-900 dark:bg-white hover:bg-gray-700 dark:hover:bg-gray-100 disabled:opacity-40 text-white dark:text-gray-900 font-semibold text-sm transition-all"
          >
            Add
          </button>
        </form>
      </div>

      {/* Add Player */}
      <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/8 rounded-2xl p-5 mb-8 shadow-sm dark:shadow-none">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-4">Add Player</h2>
        <form onSubmit={addPlayer} className="flex flex-col sm:flex-row gap-3">
          <div className="sm:w-52 shrink-0">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Team</label>
            <CustomSelect
              value={selectedTeam}
              onChange={setSelectedTeam}
              options={teamOptions}
              placeholder="Select a team"
            />
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Player Name</label>
            <input
              value={newPlayer}
              onChange={e => setNewPlayer(e.target.value)}
              placeholder="Full name"
              className="w-full rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 border border-gray-300 dark:border-white/10 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>
          <div className="sm:self-end">
            <button
              type="submit"
              disabled={saving || !newPlayer.trim() || !selectedTeam}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gray-900 dark:bg-white hover:bg-gray-700 dark:hover:bg-gray-100 disabled:opacity-40 text-white dark:text-gray-900 font-semibold text-sm transition-all"
            >
              Add
            </button>
          </div>
        </form>
      </div>

      {/* Teams list */}
      {teams.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">👥</div>
          <p className="font-medium text-gray-500 dark:text-gray-400">No teams yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-600 mt-1">Add your first team above</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {teams.map(team => {
            const teamPlayers = players.filter(p => p.team_id === team.id)
            return (
              <div key={team.id} className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/8 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-white/6">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-gray-900 dark:text-white">{team.name}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                      {teamPlayers.length} player{teamPlayers.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteTeam(team.id)}
                    className="text-xs text-red-500 dark:text-red-500/70 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
                {teamPlayers.length === 0 ? (
                  <div className="px-5 py-4 text-sm text-gray-400 dark:text-gray-600 italic">No players added yet</div>
                ) : (
                  <ul className="divide-y divide-gray-50 dark:divide-white/4">
                    {teamPlayers.map(p => (
                      <li key={p.id} className="flex items-center justify-between px-5 py-3 group hover:bg-gray-50 dark:hover:bg-white/2 transition-colors">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{p.name}</span>
                        <button
                          onClick={() => deletePlayer(p.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-all p-1 rounded-lg"
                          title="Remove player"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
