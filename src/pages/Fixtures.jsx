import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import CustomSelect from '../components/CustomSelect'

const FRAME_TEMPLATE = [
  { frame_order: 1, game_type: '8ball',  is_doubles: false },
  { frame_order: 2, game_type: '9ball',  is_doubles: false },
  { frame_order: 3, game_type: '9ball',  is_doubles: true  },
  { frame_order: 4, game_type: '10ball', is_doubles: true  },
  { frame_order: 5, game_type: '9ball',  is_doubles: false },
  { frame_order: 6, game_type: '10ball', is_doubles: false },
]

const GAME_LABEL = { '8ball': '8-Ball', '9ball': '9-Ball', '10ball': '10-Ball' }
const GAME_COLOR = {
  '8ball':  'bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300',
  '9ball':  'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300',
  '10ball': 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300',
}


function FrameLineupSection({ match, players, session }) {
  const [frameLineups, setFrameLineups] = useState(null) // null = loading
  const [localFrames, setLocalFrames] = useState([])
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const homePlayers = players.filter(p => p.team_id === match.home_team?.id)
  const awayPlayers = players.filter(p => p.team_id === match.away_team?.id)

  useEffect(() => {
    supabase
      .from('match_frame_lineups')
      .select('*')
      .eq('match_id', match.id)
      .order('frame_order')
      .then(({ data }) => {
        const rows = data || []
        const merged = FRAME_TEMPLATE.map(t => {
          const row = rows.find(r => r.frame_order === t.frame_order)
          return {
            ...t,
            home_player1_id: row?.home_player1_id || null,
            home_player2_id: row?.home_player2_id || null,
            away_player1_id: row?.away_player1_id || null,
            away_player2_id: row?.away_player2_id || null,
          }
        })
        setFrameLineups(merged)
        setLocalFrames(merged)
      })
  }, [match.id])

  const save = async () => {
    setSaving(true)
    const rows = localFrames.map(f => ({
      match_id: match.id,
      frame_order: f.frame_order,
      game_type: f.game_type,
      is_doubles: f.is_doubles,
      home_player1_id: f.home_player1_id || null,
      home_player2_id: f.is_doubles ? (f.home_player2_id || null) : null,
      away_player1_id: f.away_player1_id || null,
      away_player2_id: f.is_doubles ? (f.away_player2_id || null) : null,
    }))
    await supabase.from('match_frame_lineups').upsert(rows, { onConflict: 'match_id,frame_order' })
    setFrameLineups(localFrames)
    setEditing(false)
    setSaving(false)
  }

  const cancel = () => {
    setLocalFrames(frameLineups)
    setEditing(false)
  }

  const updateFrame = (frameOrder, field, value) => {
    setLocalFrames(prev => prev.map(f => f.frame_order === frameOrder ? { ...f, [field]: value } : f))
  }

  const getPlayerName = (id, list) => list.find(p => p.id === id)?.name || null

  if (frameLineups === null) return null

  const assignedCount = frameLineups.filter(f =>
    f.home_player1_id || f.away_player1_id
  ).length

  // Hide entirely when no lineup set and user not logged in
  if (assignedCount === 0 && !session) return null

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
      {/* Header toggle */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between text-left group"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
            Raspored mečeva
          </span>
          {assignedCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
              {assignedCount}/6
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 dark:text-gray-600 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-3 flex flex-col gap-2">
          {(editing ? localFrames : frameLineups).map(f => {
            const homeOpts = homePlayers.map(p => ({ value: p.id, label: p.name }))
            const awayOpts = awayPlayers.map(p => ({ value: p.id, label: p.name }))

            if (editing) {
              return (
                <div key={f.frame_order} className="bg-gray-50 dark:bg-white/3 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-gray-400 dark:text-gray-600 text-xs font-mono font-bold">#{f.frame_order}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${GAME_COLOR[f.game_type]}`}>
                      {GAME_LABEL[f.game_type]}
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-white/5 px-1.5 py-0.5 rounded-full">
                      {f.is_doubles ? 'Dubl' : 'Singl'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[10px] text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-1">
                        {match.home_team?.name} I1
                      </div>
                      <CustomSelect
                        value={f.home_player1_id || ''}
                        onChange={v => updateFrame(f.frame_order, 'home_player1_id', v || null)}
                        options={homeOpts}
                        placeholder="— bez —"
                      />
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-1">
                        {match.away_team?.name} I1
                      </div>
                      <CustomSelect
                        value={f.away_player1_id || ''}
                        onChange={v => updateFrame(f.frame_order, 'away_player1_id', v || null)}
                        options={awayOpts}
                        placeholder="— bez —"
                      />
                    </div>
                    {f.is_doubles && (
                      <>
                        <div>
                          <div className="text-[10px] text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-1">
                            {match.home_team?.name} I2
                          </div>
                          <CustomSelect
                            value={f.home_player2_id || ''}
                            onChange={v => updateFrame(f.frame_order, 'home_player2_id', v || null)}
                            options={homeOpts}
                            placeholder="— bez —"
                          />
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-1">
                            {match.away_team?.name} I2
                          </div>
                          <CustomSelect
                            value={f.away_player2_id || ''}
                            onChange={v => updateFrame(f.frame_order, 'away_player2_id', v || null)}
                            options={awayOpts}
                            placeholder="— bez —"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )
            }

            // Read-only row
            const hp1 = getPlayerName(f.home_player1_id, homePlayers)
            const hp2 = getPlayerName(f.home_player2_id, homePlayers)
            const ap1 = getPlayerName(f.away_player1_id, awayPlayers)
            const ap2 = getPlayerName(f.away_player2_id, awayPlayers)
            const homeNames = f.is_doubles
              ? [hp1, hp2].filter(Boolean).join(' & ') || '—'
              : (hp1 || '—')
            const awayNames = f.is_doubles
              ? [ap1, ap2].filter(Boolean).join(' & ') || '—'
              : (ap1 || '—')

            return (
              <div key={f.frame_order} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-white/3 transition-colors">
                <span className="text-gray-400 dark:text-gray-600 text-xs font-mono font-bold w-5 shrink-0">#{f.frame_order}</span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${GAME_COLOR[f.game_type]}`}>
                  {GAME_LABEL[f.game_type]}
                </span>
                <span className="text-[10px] text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-white/5 px-1.5 py-0.5 rounded-full shrink-0">
                  {f.is_doubles ? 'Dubl' : 'Singl'}
                </span>
                <span className="flex-1 min-w-0 text-xs text-gray-700 dark:text-gray-300 truncate">{homeNames}</span>
                <span className="text-[10px] text-gray-400 dark:text-gray-600 shrink-0">vs</span>
                <span className="flex-1 min-w-0 text-xs text-gray-700 dark:text-gray-300 truncate text-right">{awayNames}</span>
              </div>
            )
          })}

          {/* Edit controls */}
          {session && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="mt-1 self-start text-[10px] font-semibold text-gray-400 dark:text-gray-600 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              {assignedCount > 0 ? 'Uredi raspored' : 'Dodaj raspored'}
            </button>
          )}
          {editing && (
            <div className="flex gap-1.5 mt-1">
              <button
                onClick={save}
                disabled={saving}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50"
              >
                {saving ? '...' : 'Spremi'}
              </button>
              <button
                onClick={cancel}
                className="text-[11px] px-2 py-1 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/8 transition-colors"
              >
                Odustani
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function UpcomingCard({ match, players, session }) {
  const dateObj = new Date(match.match_date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const matchDay = new Date(dateObj)
  matchDay.setHours(0, 0, 0, 0)
  const isToday = matchDay.getTime() === today.getTime()
  const isTomorrow = matchDay.getTime() === today.getTime() + 86400000

  const dayLabel = isToday
    ? 'Danas'
    : isTomorrow
    ? 'Sutra'
    : dateObj.toLocaleDateString('hr-HR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className={`bg-white dark:bg-[#111] rounded-2xl p-4 sm:p-5 border-2 border-dashed transition-all ${
      isToday
        ? 'border-emerald-400 dark:border-emerald-500/60 bg-emerald-50/30 dark:bg-emerald-500/5'
        : 'border-gray-200 dark:border-white/10'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 dark:text-gray-500 text-xs flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {dayLabel}
          </span>
          {isToday && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/15 px-2 py-0.5 rounded-full uppercase tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Danas
            </span>
          )}
        </div>
        {match.notes && (
          <span className="text-gray-400 dark:text-gray-500 text-xs truncate max-w-28 sm:max-w-48">{match.notes}</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-gray-400 dark:text-gray-600 font-semibold uppercase tracking-widest mb-0.5">Domaćin</div>
          <div className="font-bold text-base sm:text-lg truncate text-gray-900 dark:text-white">
            {match.home_team?.name ?? 'Domaćin'}
          </div>
        </div>

        <div className="flex items-center shrink-0 px-4 py-2 rounded-xl bg-gray-50 dark:bg-white/5">
          <span className="text-xl sm:text-2xl font-black text-gray-300 dark:text-gray-700">vs</span>
        </div>

        <div className="flex-1 min-w-0 text-right">
          <div className="text-[10px] text-gray-400 dark:text-gray-600 font-semibold uppercase tracking-widest mb-0.5">Gost</div>
          <div className="font-bold text-base sm:text-lg truncate text-gray-900 dark:text-white">
            {match.away_team?.name ?? 'Gost'}
          </div>
        </div>
      </div>

      <FrameLineupSection match={match} players={players} session={session} />
    </div>
  )
}

function CompletedCard({ match }) {
  const homePoints = match.frames?.reduce((s, f) => s + (f.home_score || 0), 0) ?? 0
  const awayPoints = match.frames?.reduce((s, f) => s + (f.away_score || 0), 0) ?? 0
  const homeWins = homePoints > awayPoints
  const awayWins = awayPoints > homePoints

  return (
    <Link to={`/matches/${match.id}`} className="block group">
      <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/8 rounded-2xl p-4 sm:p-5 transition-all hover:border-gray-300 dark:hover:border-white/15 hover:shadow-md dark:hover:shadow-none">
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-400 dark:text-gray-500 text-xs flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {new Date(match.match_date).toLocaleDateString('hr-HR', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          <div className="flex items-center gap-2">
            {match.notes && (
              <span className="text-gray-400 dark:text-gray-500 text-xs truncate max-w-28 sm:max-w-48">{match.notes}</span>
            )}
            <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-gray-400 dark:text-gray-600 font-semibold uppercase tracking-widest mb-0.5">Domaćin</div>
            <div className={`font-bold text-base sm:text-lg truncate ${homeWins ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
              {match.home_team?.name ?? 'Domaćin'}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 px-4 py-2 rounded-xl bg-gray-50 dark:bg-white/5">
            <span className={`text-2xl sm:text-3xl font-black tabular-nums ${homeWins ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-600'}`}>{homePoints}</span>
            <span className="text-gray-300 dark:text-gray-700">:</span>
            <span className={`text-2xl sm:text-3xl font-black tabular-nums ${awayWins ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-600'}`}>{awayPoints}</span>
          </div>

          <div className="flex-1 min-w-0 text-right">
            <div className="text-[10px] text-gray-400 dark:text-gray-600 font-semibold uppercase tracking-widest mb-0.5">Gost</div>
            <div className={`font-bold text-base sm:text-lg truncate ${awayWins ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
              {match.away_team?.name ?? 'Gost'}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function Fixtures() {
  const { session } = useAuth()
  const [matches, setMatches] = useState([])
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('upcoming')
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    async function load() {
      const [{ data: matchData }, { data: playerData }] = await Promise.all([
        supabase
          .from('matches')
          .select(`
            id, match_date, notes, home_team_id, away_team_id,
            home_team:teams!matches_home_team_id_fkey(id, name),
            away_team:teams!matches_away_team_id_fkey(id, name),
            frames(id, home_score, away_score)
          `)
          .order('match_date', { ascending: true }),
        supabase.from('players').select('id, name, team_id')
      ])

      setMatches(matchData || [])
      setPlayers(playerData || [])
      setLoading(false)
    }
    load()
  }, [])

  const deleteMatch = async (id) => {
    if (!window.confirm('Obriši ovu utakmicu?')) return
    setDeletingId(id)
    await supabase.from('matches').delete().eq('id', id)
    setMatches(prev => prev.filter(m => m.id !== id))
    setDeletingId(null)
  }

  const upcoming = matches
    .filter(m => !m.frames || m.frames.length === 0)
    .sort((a, b) => new Date(a.match_date) - new Date(b.match_date))

  const completed = matches
    .filter(m => m.frames && m.frames.length > 0)
    .sort((a, b) => new Date(b.match_date) - new Date(a.match_date))

  const tabs = [
    { key: 'upcoming', label: 'Nadolazeće', count: upcoming.length },
    { key: 'completed', label: 'Odigrane', count: completed.length },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-emerald-600 dark:text-emerald-500 text-xs font-semibold uppercase tracking-widest mb-2">Sezona</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Raspored</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Nadolazeće utakmice i prošli rezultati</p>
        </div>
        {session && (
          <Link
            to="/admin/schedule"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 dark:bg-white hover:bg-gray-700 dark:hover:bg-gray-100 text-white dark:text-gray-900 font-semibold text-sm transition-all shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Zakaži utakmicu
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-xl mb-6">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.key
                ? 'bg-white dark:bg-[#222] text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full tabular-nums ${
                activeTab === tab.key
                  ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                  : 'bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400 dark:text-gray-600">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </div>
      ) : activeTab === 'upcoming' ? (
        upcoming.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📅</div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Nema zakazanih utakmica</p>
            <p className="text-gray-400 dark:text-gray-600 text-sm mt-1">
              {session ? 'Klikni "Zakaži utakmicu" da dodaš novu.' : 'Admin još nije zakazao utakmice.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {upcoming.map(m => (
              <div key={m.id}>
                <UpcomingCard match={m} players={players} session={session} />
                {session && (
                  <div className="flex justify-between mt-2 px-1">
                    <button
                      onClick={() => deleteMatch(m.id)}
                      disabled={deletingId === m.id}
                      className="text-xs font-semibold text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1 transition-colors disabled:opacity-40"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      {deletingId === m.id ? 'Brišem...' : 'Obriši'}
                    </button>
                    <Link
                      to={`/admin/result/new?fixture=${m.id}`}
                      className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Unesi rezultat
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        completed.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🎱</div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Još nema odigranih utakmica</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {completed.map(m => <CompletedCard key={m.id} match={m} />)}
          </div>
        )
      )}
    </div>
  )
}
