import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import CustomSelect from '../../components/CustomSelect'

const FRAME_TEMPLATE = [
  { frame_order: 1, game_type: '8ball',  is_doubles: false, label: 'Singl — 8-Ball' },
  { frame_order: 2, game_type: '9ball',  is_doubles: false, label: 'Singl — 9-Ball' },
  { frame_order: 3, game_type: '9ball',  is_doubles: true,  label: 'Dubl — 9-Ball' },
  { frame_order: 4, game_type: '10ball', is_doubles: true,  label: 'Dubl — 10-Ball' },
  { frame_order: 5, game_type: '9ball',  is_doubles: false, label: 'Singl — 9-Ball' },
  { frame_order: 6, game_type: '10ball', is_doubles: false, label: 'Singl — 10-Ball' },
]

const GAME_COLORS = {
  '8ball':  'bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300',
  '9ball':  'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300',
  '10ball': 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300',
}

const inputCls = 'w-full rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 border border-gray-300 dark:border-white/10 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all'

export default function AddResult() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [teams, setTeams] = useState([])
  const [players, setPlayers] = useState([])
  const [homeTeamId, setHomeTeamId] = useState('')
  const [awayTeamId, setAwayTeamId] = useState('')
  const [matchDate, setMatchDate] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [frames, setFrames] = useState(
    FRAME_TEMPLATE.map(t => ({ ...t, winning_team_id: '', home_player1_id: '', home_player2_id: '', away_player1_id: '', away_player2_id: '' }))
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('teams').select('*').order('name').then(({ data }) => setTeams(data || []))
    supabase.from('players').select('*').order('name').then(({ data }) => setPlayers(data || []))
  }, [])

  const teamOptions = teams.map(t => ({ value: t.id, label: t.name }))
  const homePlayers = players.filter(p => p.team_id === homeTeamId).map(p => ({ value: p.id, label: p.name }))
  const awayPlayers = players.filter(p => p.team_id === awayTeamId).map(p => ({ value: p.id, label: p.name }))
  const homeTeamName = teams.find(t => t.id === homeTeamId)?.name || 'Domaćin'
  const awayTeamName = teams.find(t => t.id === awayTeamId)?.name || 'Gost'

  const updateFrame = (i, field, value) => setFrames(prev => prev.map((f, idx) => idx === i ? { ...f, [field]: value } : f))

  const handleStep1 = (e) => {
    e.preventDefault()
    if (homeTeamId === awayTeamId) { setError('Domaća i gostujuća ekipa moraju biti različite.'); return }
    setError('')
    setFrames(prev => prev.map(f => ({ ...f, winning_team_id: '', home_player1_id: '', home_player2_id: '', away_player1_id: '', away_player2_id: '' })))
    setStep(2)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    for (const f of frames) {
      if (!f.winning_team_id) { setError('Odaberite pobjednika za svaki frame.'); return }
    }
    setSaving(true); setError('')

    const { data: matchData, error: matchError } = await supabase
      .from('matches').insert({ home_team_id: homeTeamId, away_team_id: awayTeamId, match_date: matchDate, notes: notes || null })
      .select().single()

    if (matchError) { setError(matchError.message); setSaving(false); return }

    const { error: framesError } = await supabase.from('frames').insert(
      frames.map(f => ({
        match_id: matchData.id,
        frame_order: f.frame_order,
        game_type: f.game_type,
        is_doubles: f.is_doubles,
        winning_team_id: f.winning_team_id,
        home_player1_id: f.home_player1_id || null,
        home_player2_id: f.is_doubles ? (f.home_player2_id || null) : null,
        away_player1_id: f.away_player1_id || null,
        away_player2_id: f.is_doubles ? (f.away_player2_id || null) : null,
      }))
    )

    if (framesError) { setError(framesError.message); setSaving(false); return }
    navigate(`/matches/${matchData.id}`)
  }

  const completedFrames = frames.filter(f => f.winning_team_id).length
  const homeWins = frames.filter(f => f.winning_team_id === homeTeamId).length
  const awayWins = frames.filter(f => f.winning_team_id === awayTeamId).length

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="text-emerald-600 dark:text-emerald-500 text-xs font-semibold uppercase tracking-widest mb-2">Admin</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Dodaj rezultat</h1>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === s ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : step > s ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                : 'bg-gray-100 dark:bg-white/8 text-gray-400 dark:text-gray-600'
              }`}>
                {step > s ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : s}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${step === s ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}>
                {s === 1 ? 'Podaci utakmice' : 'Framovi'}
              </span>
              {s < 2 && <div className="w-5 h-px bg-gray-200 dark:bg-white/10" />}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-xl mb-5">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Korak 1 */}
      {step === 1 && (
        <form onSubmit={handleStep1} className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/8 rounded-2xl p-6 flex flex-col gap-5 shadow-sm dark:shadow-none">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Datum utakmice</label>
            <input type="date" value={matchDate} onChange={e => setMatchDate(e.target.value)} required className={inputCls} style={{ width: 'auto' }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Domaća ekipa</label>
              <CustomSelect value={homeTeamId} onChange={setHomeTeamId} options={teamOptions} placeholder="Odaberi ekipu" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Gostujuća ekipa</label>
              <CustomSelect value={awayTeamId} onChange={setAwayTeamId} options={teamOptions} placeholder="Odaberi ekipu" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">
              Napomena <span className="normal-case font-normal tracking-normal text-gray-400 dark:text-gray-600">(neobavezno)</span>
            </label>
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="npr. Tjedan 3, domaći teren" className={inputCls} />
          </div>
          <button
            type="submit"
            disabled={!homeTeamId || !awayTeamId}
            className="py-2.5 rounded-xl bg-gray-900 dark:bg-white hover:bg-gray-700 dark:hover:bg-gray-100 disabled:opacity-40 text-white dark:text-gray-900 font-semibold text-sm transition-all flex items-center justify-center gap-2"
          >
            Sljedeće: Unesi framove
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </form>
      )}

      {/* Korak 2 */}
      {step === 2 && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/8 rounded-2xl px-5 py-4 flex items-center justify-between shadow-sm dark:shadow-none">
            <div className="min-w-0">
              <div className="text-[10px] text-gray-400 dark:text-gray-600 uppercase tracking-widest">Domaćin</div>
              <div className="font-bold text-gray-900 dark:text-white text-sm truncate">{homeTeamName}</div>
            </div>
            <div className="text-center shrink-0">
              <div className="text-2xl font-black tabular-nums text-gray-900 dark:text-white">{homeWins} : {awayWins}</div>
              <div className="text-[10px] text-gray-400 dark:text-gray-600 uppercase tracking-widest">{completedFrames}/6 framova</div>
            </div>
            <div className="min-w-0 text-right">
              <div className="text-[10px] text-gray-400 dark:text-gray-600 uppercase tracking-widest">Gost</div>
              <div className="font-bold text-gray-900 dark:text-white text-sm truncate">{awayTeamName}</div>
            </div>
          </div>

          {frames.map((frame, i) => {
            const done = !!frame.winning_team_id
            return (
              <div key={frame.frame_order}
                className={`bg-white dark:bg-[#111] border rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-none ${done ? 'border-emerald-200 dark:border-emerald-500/25' : 'border-gray-200 dark:border-white/8'}`}
              >
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 dark:text-gray-600 text-xs font-mono font-bold">#{frame.frame_order}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${GAME_COLORS[frame.game_type]}`}>
                      {frame.game_type === '8ball' ? '8-Ball' : frame.game_type === '9ball' ? '9-Ball' : '10-Ball'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                      {frame.is_doubles ? 'Dubl' : 'Singl'}
                    </span>
                  </div>
                  {done && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Gotovo
                    </span>
                  )}
                </div>

                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Pobjednik</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[{ id: homeTeamId, name: homeTeamName }, { id: awayTeamId, name: awayTeamName }].map(team => (
                      <button
                        key={team.id}
                        type="button"
                        onClick={() => updateFrame(i, 'winning_team_id', team.id)}
                        className={`py-2.5 px-3 rounded-xl font-semibold text-sm transition-all border truncate ${
                          frame.winning_team_id === team.id
                            ? 'bg-gray-900 dark:bg-white border-gray-900 dark:border-white text-white dark:text-gray-900'
                            : 'bg-white dark:bg-[#0a0a0a] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-white/25 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        {team.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: `${homeTeamName} I1`, field: 'home_player1_id', options: homePlayers },
                    { label: `${awayTeamName} I1`, field: 'away_player1_id', options: awayPlayers },
                    ...(frame.is_doubles ? [
                      { label: `${homeTeamName} I2`, field: 'home_player2_id', options: homePlayers },
                      { label: `${awayTeamName} I2`, field: 'away_player2_id', options: awayPlayers },
                    ] : []),
                  ].map(({ label, field, options }) => (
                    <div key={field}>
                      <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-1.5">{label}</label>
                      <CustomSelect value={frame[field]} onChange={v => updateFrame(i, field, v)} options={options} placeholder="— bez —" />
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-semibold text-sm transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Natrag
            </button>
            <button
              type="submit"
              disabled={saving || completedFrames < 6}
              className="flex-1 py-2.5 rounded-xl bg-gray-900 dark:bg-white hover:bg-gray-700 dark:hover:bg-gray-100 disabled:opacity-40 text-white dark:text-gray-900 font-semibold text-sm transition-all"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Spremanje...
                </span>
              ) : completedFrames < 6 ? `Spremi rezultat (${completedFrames}/6)` : 'Spremi rezultat'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
