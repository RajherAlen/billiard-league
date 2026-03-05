import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import CustomSelect from '../../components/CustomSelect'

const DRAFT_KEY = 'addResult-draft'

const GAME_FRAMES = { '8ball': 5, '9ball': 6, '10ball': 5 }

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

function formatISOToDMY(value) {
  if (!value) return ''
  const isoMatch = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!isoMatch) return String(value)
  const [, year, month, day] = isoMatch
  return `${day}/${month}/${year}`
}

function getTodayDMY() {
  const today = new Date()
  const day = String(today.getDate()).padStart(2, '0')
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const year = today.getFullYear()
  return `${day}/${month}/${year}`
}

function getTodayISO() {
  return new Date().toISOString().slice(0, 10)
}

function parseDMYToISO(value) {
  const raw = String(value || '').trim()
  let dayStr = ''
  let monthStr = ''
  let yearStr = ''

  const compactMatch = raw.match(/^(\d{2})(\d{2})(\d{4})$/)
  if (compactMatch) {
    [, dayStr, monthStr, yearStr] = compactMatch
  } else {
    const match = raw.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/)
    if (!match) return null
    dayStr = match[1]
    monthStr = match[2]
    yearStr = match[3]
  }

  const dayPadded = String(Number(dayStr)).padStart(2, '0')
  const monthPadded = String(Number(monthStr)).padStart(2, '0')

  const day = Number(dayPadded)
  const month = Number(monthPadded)
  const year = Number(yearStr)
  const parsed = new Date(year, month - 1, day)

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) return null

  return `${yearStr}-${monthPadded}-${dayPadded}`
}

function normalizeStoredDate(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  return parseDMYToISO(raw) || ''
}

function normalizeDMYInput(value) {
  return String(value || '')
    .replace(/[.-]/g, '/')
    .replace(/[^\d/]/g, '')
    .slice(0, 10)
}

const EMPTY_FRAMES = FRAME_TEMPLATE.map(t => ({
  ...t,
  home_score: 0,
  away_score: 0,
  home_player1_id: '',
  home_player2_id: '',
  away_player1_id: '',
  away_player2_id: '',
}))

function loadDraft() {
  try {
    const d = sessionStorage.getItem(DRAFT_KEY)
    return d ? JSON.parse(d) : {}
  } catch { return {} }
}

function ScoreCounter({ value, onChange, max }) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors font-bold leading-none"
      >
        −
      </button>
      <span className="w-8 text-center text-2xl font-black tabular-nums text-gray-900 dark:text-white">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed transition-colors font-bold leading-none"
      >
        +
      </button>
    </div>
  )
}

export default function AddResult() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fixtureId = searchParams.get('fixture') || null

  const draft = fixtureId ? {} : loadDraft() // don't restore draft when editing a fixture
  const datePickerRef = useRef(null)

  const [step, setStep] = useState(() => fixtureId ? 1 : (draft.step ?? 1))
  const [homeTeamId, setHomeTeamId] = useState(() => draft.homeTeamId ?? '')
  const [awayTeamId, setAwayTeamId] = useState(() => draft.awayTeamId ?? '')
  const [matchDate, setMatchDate] = useState(() => formatISOToDMY(normalizeStoredDate(draft.matchDate) || getTodayISO()))
  const [notes, setNotes] = useState(() => draft.notes ?? '')
  const [frames, setFrames] = useState(() => draft.frames ?? EMPTY_FRAMES)

  const [teams, setTeams] = useState([])
  const [players, setPlayers] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fixtureLoading, setFixtureLoading] = useState(!!fixtureId)
  const [fixtureLocked, setFixtureLocked] = useState(false)

  useEffect(() => {
    supabase.from('teams').select('*').order('name').then(({ data }) => setTeams(data || []))
    supabase.from('players').select('*').order('name').then(({ data }) => setPlayers(data || []))
  }, [])

  // Load fixture data if ?fixture= param is present
  useEffect(() => {
    if (!fixtureId) return
    async function loadFixture() {
      setFixtureLoading(true)
      const { data, error: err } = await supabase
        .from('matches')
        .select('id, home_team_id, away_team_id, match_date, notes')
        .eq('id', fixtureId)
        .single()
      if (err || !data) {
        setError('Nije moguće učitati utakmicu. Pokušaj ponovo.')
        setFixtureLoading(false)
        return
      }
      setHomeTeamId(data.home_team_id)
      setAwayTeamId(data.away_team_id)
      setMatchDate(formatISOToDMY(data.match_date))
      setNotes(data.notes || '')
      setFixtureLocked(true)
      setFixtureLoading(false)
    }
    loadFixture()
  }, [fixtureId])

  // Persist draft to sessionStorage (only when not in fixture mode)
  useEffect(() => {
    if (fixtureId) return
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ step, homeTeamId, awayTeamId, matchDate, notes, frames }))
  }, [step, homeTeamId, awayTeamId, matchDate, notes, frames, fixtureId])

  const teamOptions = teams.map(t => ({ value: t.id, label: t.name }))
  const homePlayers = players.filter(p => p.team_id === homeTeamId).map(p => ({ value: p.id, label: p.name }))
  const awayPlayers = players.filter(p => p.team_id === awayTeamId).map(p => ({ value: p.id, label: p.name }))
  const homeTeamName = teams.find(t => t.id === homeTeamId)?.name || 'Domaćin'
  const awayTeamName = teams.find(t => t.id === awayTeamId)?.name || 'Gost'

  const updateFrame = (i, field, value) =>
    setFrames(prev => prev.map((f, idx) => idx === i ? { ...f, [field]: value } : f))

  const updateScore = (i, side, value) =>
    setFrames(prev => prev.map((f, idx) => idx === i ? { ...f, [side]: value } : f))

  const handleStep1 = (e) => {
    e.preventDefault()
    if (homeTeamId === awayTeamId) { setError('Domaća i gostujuća ekipa moraju biti različite.'); return }
    if (!parseDMYToISO(matchDate)) { setError('Datum mora biti u formatu dd/mm/yyyy.'); return }
    setError('')
    setStep(2)
  }

  const clearDraft = () => {
    sessionStorage.removeItem(DRAFT_KEY)
    setStep(1)
    setHomeTeamId('')
    setAwayTeamId('')
    setMatchDate(getTodayDMY())
    setNotes('')
    setFrames(EMPTY_FRAMES)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const matchDateISO = parseDMYToISO(matchDate)
    if (!matchDateISO) {
      setError('Datum mora biti u formatu dd/mm/yyyy.')
      return
    }

    for (const f of frames) {
      const max = GAME_FRAMES[f.game_type]
      if (f.home_score >= max && f.away_score >= max) {
        setError(`Meč #${f.frame_order} (${f.label}): rezultat ne može biti ${max}:${max}.`)
        return
      }
      if (f.home_score < max && f.away_score < max) {
        setError(`Meč #${f.frame_order} (${f.label}): jedan igrač mora doseći ${max} poena.`)
        return
      }
    }
    setSaving(true); setError('')

    let matchId = fixtureId

    if (!fixtureId) {
      // Create a new match record
      const { data: matchData, error: matchError } = await supabase
        .from('matches').insert({ home_team_id: homeTeamId, away_team_id: awayTeamId, match_date: matchDateISO, notes: notes || null })
        .select().single()

      if (matchError) { setError(matchError.message); setSaving(false); return }
      matchId = matchData.id
    } else {
      // Update existing fixture date/notes if they changed
      const { error: updateErr } = await supabase
        .from('matches')
        .update({ match_date: matchDateISO, notes: notes || null })
        .eq('id', fixtureId)
      if (updateErr) { setError(updateErr.message); setSaving(false); return }
    }

    const { error: framesError } = await supabase.from('frames').insert(
      frames.map(f => ({
        match_id: matchId,
        frame_order: f.frame_order,
        game_type: f.game_type,
        is_doubles: f.is_doubles,
        home_score: f.home_score,
        away_score: f.away_score,
        winning_team_id: f.home_score >= f.away_score ? homeTeamId : awayTeamId,
        home_player1_id: f.home_player1_id || null,
        home_player2_id: f.is_doubles ? (f.home_player2_id || null) : null,
        away_player1_id: f.away_player1_id || null,
        away_player2_id: f.is_doubles ? (f.away_player2_id || null) : null,
      }))
    )

    if (framesError) { setError(framesError.message); setSaving(false); return }

    sessionStorage.removeItem(DRAFT_KEY)
    navigate(`/matches/${matchId}`)
  }

  const homePoints = frames.reduce((s, f) => s + f.home_score, 0)
  const awayPoints = frames.reduce((s, f) => s + f.away_score, 0)
  const completedFrames = frames.filter(f => {
    const max = GAME_FRAMES[f.game_type]
    return f.home_score >= max || f.away_score >= max
  }).length
  const hasDraft = !fixtureId && (step === 2 || homeTeamId || awayTeamId || frames.some(f => f.home_score + f.away_score > 0))

  const openDatePicker = () => {
    if (!datePickerRef.current) return
    if (typeof datePickerRef.current.showPicker === 'function') {
      datePickerRef.current.showPicker()
      return
    }
    datePickerRef.current.focus()
  }

  if (fixtureLoading) {
    return (
      <div className="flex items-center justify-center py-32 text-gray-400 dark:text-gray-600">
        <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="text-emerald-600 dark:text-emerald-500 text-xs font-semibold uppercase tracking-widest mb-2">Admin</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Dodaj rezultat</h1>
          {fixtureId && fixtureLocked && (
            <p className="text-sm text-purple-600 dark:text-purple-400 mt-1 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Zakazana utakmica: {homeTeamName} vs {awayTeamName}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1">
          {hasDraft && (
            <button
              type="button"
              onClick={clearDraft}
              className="text-xs text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            >
              Obriši nacrt
            </button>
          )}
          <div className="flex items-center gap-2">
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
                  {s === 1 ? 'Podaci utakmice' : 'Mečevi'}
                </span>
                {s < 2 && <div className="w-5 h-px bg-gray-200 dark:bg-white/10" />}
              </div>
            ))}
          </div>
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
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                placeholder="dd/mm/yyyy"
                value={matchDate}
                onChange={e => setMatchDate(normalizeDMYInput(e.target.value))}
                onBlur={e => {
                  const iso = parseDMYToISO(normalizeDMYInput(e.target.value))
                  if (iso) setMatchDate(formatISOToDMY(iso))
                }}
                required
                className={inputCls}
                style={{ width: 'auto' }}
              />
              <button
                type="button"
                onClick={openDatePicker}
                className="h-10 w-10 rounded-xl border border-gray-300 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors flex items-center justify-center"
                aria-label="Otvori kalendar"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10m-12 9h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v11a2 2 0 002 2z" />
                </svg>
              </button>
              <input
                ref={datePickerRef}
                type="date"
                value={parseDMYToISO(matchDate) || ''}
                onChange={e => setMatchDate(formatISOToDMY(e.target.value))}
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Domaća ekipa</label>
              {fixtureLocked ? (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8">
                  <svg className="w-4 h-4 text-purple-500 dark:text-purple-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{homeTeamName}</span>
                </div>
              ) : (
                <CustomSelect value={homeTeamId} onChange={setHomeTeamId} options={teamOptions} placeholder="Odaberi ekipu" />
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Gostujuća ekipa</label>
              {fixtureLocked ? (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8">
                  <svg className="w-4 h-4 text-purple-500 dark:text-purple-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{awayTeamName}</span>
                </div>
              ) : (
                <CustomSelect value={awayTeamId} onChange={setAwayTeamId} options={teamOptions} placeholder="Odaberi ekipu" />
              )}
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
            Sljedeće: Unesi mečeve
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </form>
      )}

      {/* Korak 2 */}
      {step === 2 && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Live score */}
          <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/8 rounded-2xl px-5 py-4 flex items-center justify-between shadow-sm dark:shadow-none">
            <div className="min-w-0">
              <div className="text-[10px] text-gray-400 dark:text-gray-600 uppercase tracking-widest">Domaćin</div>
              <div className="font-bold text-gray-900 dark:text-white text-sm truncate">{homeTeamName}</div>
            </div>
            <div className="text-center shrink-0">
              <div className="text-2xl font-black tabular-nums text-gray-900 dark:text-white">
                <span className={homePoints > awayPoints ? 'text-emerald-600 dark:text-emerald-400' : ''}>{homePoints}</span>
                <span className="text-gray-300 dark:text-gray-700 mx-1">:</span>
                <span className={awayPoints > homePoints ? 'text-emerald-600 dark:text-emerald-400' : ''}>{awayPoints}</span>
              </div>
              <div className="text-[10px] text-gray-400 dark:text-gray-600 uppercase tracking-widest">{completedFrames}/6 mečeva</div>
            </div>
            <div className="min-w-0 text-right">
              <div className="text-[10px] text-gray-400 dark:text-gray-600 uppercase tracking-widest">Gost</div>
              <div className="font-bold text-gray-900 dark:text-white text-sm truncate">{awayTeamName}</div>
            </div>
          </div>

          {frames.map((frame, i) => {
            const max = GAME_FRAMES[frame.game_type]
            const homeAtMax = frame.home_score >= max
            const awayAtMax = frame.away_score >= max
            const done = homeAtMax || awayAtMax
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

                {/* Score input */}
                <div className="flex items-center justify-center gap-4 bg-gray-50 dark:bg-white/3 rounded-xl py-4 px-3 mb-4">
                  <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                    <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-widest truncate w-full text-center">{homeTeamName}</span>
                    <ScoreCounter value={frame.home_score} max={awayAtMax ? max - 1 : max} onChange={v => updateScore(i, 'home_score', v)} />
                  </div>
                  <div className="shrink-0 text-gray-300 dark:text-gray-700 font-bold text-xl">:</div>
                  <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                    <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-widest truncate w-full text-center">{awayTeamName}</span>
                    <ScoreCounter value={frame.away_score} max={homeAtMax ? max - 1 : max} onChange={v => updateScore(i, 'away_score', v)} />
                  </div>
                </div>

                {/* Players */}
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
              onClick={() => { setStep(1); setError('') }}
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
