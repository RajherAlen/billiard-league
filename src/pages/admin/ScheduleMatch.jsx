import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import CustomSelect from '../../components/CustomSelect'

const inputCls = 'w-full rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 border border-gray-300 dark:border-white/10 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all'

function formatISOToDMY(value) {
  if (!value) return ''
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return String(value)
  const [, year, month, day] = match
  return `${day}/${month}/${year}`
}

function parseDMYToISO(value) {
  const raw = String(value || '').trim()
  const compactMatch = raw.match(/^(\d{2})(\d{2})(\d{4})$/)
  let dayStr, monthStr, yearStr
  if (compactMatch) {
    [, dayStr, monthStr, yearStr] = compactMatch
  } else {
    const match = raw.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/)
    if (!match) return null
    dayStr = match[1]; monthStr = match[2]; yearStr = match[3]
  }
  const day = Number(dayStr); const month = Number(monthStr); const year = Number(yearStr)
  const dayPadded = String(day).padStart(2, '0')
  const monthPadded = String(month).padStart(2, '0')
  const parsed = new Date(year, month - 1, day)
  if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) return null
  return `${yearStr}-${monthPadded}-${dayPadded}`
}

function normalizeDMYInput(value) {
  return String(value || '').replace(/[.-]/g, '/').replace(/[^\d/]/g, '').slice(0, 10)
}

function getTodayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function ScheduleMatch() {
  const navigate = useNavigate()
  const datePickerRef = useRef(null)

  const [homeTeamId, setHomeTeamId] = useState('')
  const [awayTeamId, setAwayTeamId] = useState('')
  const [matchDate, setMatchDate] = useState(formatISOToDMY(getTodayISO()))
  const [notes, setNotes] = useState('')
  const [teams, setTeams] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('teams').select('*').order('name').then(({ data }) => setTeams(data || []))
  }, [])

  const teamOptions = teams.map(t => ({ value: t.id, label: t.name }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (homeTeamId === awayTeamId) { setError('Domaća i gostujuća ekipa moraju biti različite.'); return }
    const matchDateISO = parseDMYToISO(matchDate)
    if (!matchDateISO) { setError('Datum mora biti u formatu dd/mm/yyyy.'); return }

    setSaving(true); setError('')
    const { error: err } = await supabase.from('matches').insert({
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      match_date: matchDateISO,
      notes: notes || null,
    })
    if (err) { setError(err.message); setSaving(false); return }
    navigate('/fixtures')
  }

  const openDatePicker = () => {
    if (!datePickerRef.current) return
    if (typeof datePickerRef.current.showPicker === 'function') {
      datePickerRef.current.showPicker(); return
    }
    datePickerRef.current.focus()
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8 sm:py-12">
      <div className="mb-8">
        <p className="text-emerald-600 dark:text-emerald-500 text-xs font-semibold uppercase tracking-widest mb-2">Admin</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Zakaži utakmicu</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Utakmica bez rezultata — dodaj rezultat poslije</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-xl mb-5">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/8 rounded-2xl p-6 flex flex-col gap-5 shadow-sm dark:shadow-none">
        {/* Date */}
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
              className="h-10 w-10 rounded-xl border border-gray-300 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors flex items-center justify-center shrink-0"
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

        {/* Teams */}
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

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">
            Napomena <span className="normal-case font-normal tracking-normal text-gray-400 dark:text-gray-600">(neobavezno)</span>
          </label>
          <input
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="npr. Tjedan 3, domaći teren"
            className={inputCls}
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={() => navigate('/fixtures')}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-semibold text-sm transition-all"
          >
            Odustani
          </button>
          <button
            type="submit"
            disabled={saving || !homeTeamId || !awayTeamId}
            className="flex-1 py-2.5 rounded-xl bg-gray-900 dark:bg-white hover:bg-gray-700 dark:hover:bg-gray-100 disabled:opacity-40 text-white dark:text-gray-900 font-semibold text-sm transition-all flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Spremanje...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10m-12 9h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v11a2 2 0 002 2z" />
                </svg>
                Zakaži utakmicu
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
