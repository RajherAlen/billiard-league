import { Link } from 'react-router-dom'

const MEDALS = ['🥇', '🥈', '🥉']

const FORM_STYLES = {
  W: 'bg-emerald-500 text-white',
  L: 'bg-red-400 text-white',
}
const FORM_LABELS = { W: 'P', L: 'I' }

function FormPill({ result }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${FORM_STYLES[result] || 'bg-gray-200 dark:bg-white/10 text-gray-500'}`}
      title={result === 'W' ? 'Pobjeda' : 'Poraz'}
    >
      {FORM_LABELS[result] || '?'}
    </span>
  )
}

function getPointsGap(standings, index) {
  const row = standings[index]
  if (!row) return null
  if (index === 0) {
    const second = standings[1]?.framePoints
    if (typeof second !== 'number') return null
    const diff = row.framePoints - second
    return diff > 0 ? { text: '+' + diff, cls: 'text-emerald-600 dark:text-emerald-400' } : null
  }
  const leader = standings[0]?.framePoints
  if (typeof leader !== 'number') return null
  const diff = leader - row.framePoints
  return diff > 0 ? { text: '-' + diff, cls: 'text-red-500 dark:text-red-400' } : null
}

export default function StandingsTable({ standings }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-white/8 shadow-sm dark:shadow-none bg-white dark:bg-[#111]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 dark:border-white/8">
            <th className="px-4 py-3.5 text-left w-12 text-gray-400 dark:text-gray-500 text-xs font-semibold uppercase tracking-widest">#</th>
            <th className="px-3 py-3.5 text-left text-gray-400 dark:text-gray-500 text-xs font-semibold uppercase tracking-widest">Ekipa</th>
            <th className="px-2 py-3.5 text-center text-gray-400 dark:text-gray-500 text-xs font-semibold uppercase tracking-widest hidden sm:table-cell" title="Odigrane utakmice">O</th>
            <th className="px-2 py-3.5 text-center text-gray-400 dark:text-gray-500 text-xs font-semibold uppercase tracking-widest hidden sm:table-cell" title="Pobjede">P</th>
            <th className="px-2 py-3.5 text-center text-gray-400 dark:text-gray-500 text-xs font-semibold uppercase tracking-widest hidden sm:table-cell" title="Izgubljene">I</th>
            <th className="px-3 py-3.5 text-center text-gray-400 dark:text-gray-500 text-xs font-semibold uppercase tracking-widest hidden md:table-cell" title="Forma zadnjih 5">Forma</th>
            <th className="px-4 py-3.5 text-center text-gray-400 dark:text-gray-500 text-xs font-semibold uppercase tracking-widest">Bod.</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-white/4">
          {standings.map((row, i) => {
            const gap = getPointsGap(standings, i)
            const isLeader = i === 0
            return (
              <tr
                key={row.team_id}
                className={'transition-colors hover:bg-gray-50 dark:hover:bg-white/3 ' + (isLeader ? 'bg-amber-50/40 dark:bg-amber-400/5' : '')}
              >
                <td className="px-4 py-4 text-center">
                  {i < 3
                    ? <span className="text-base leading-none">{MEDALS[i]}</span>
                    : <span className="text-gray-400 dark:text-gray-600 font-semibold tabular-nums">{i + 1}</span>
                  }
                </td>

                <td className="px-3 py-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      to={'/teams/' + row.team_id}
                      className={'font-semibold hover:underline underline-offset-2 transition-colors hover:text-emerald-600 dark:hover:text-emerald-400 ' + (isLeader ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-200')}
                    >
                      {row.team_name}
                    </Link>
                    {isLeader && (row.framePoints ?? 0) > 0 && (
                      <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-400/15 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full uppercase tracking-wide shrink-0">
                        Lider
                      </span>
                    )}
                    <div className="sm:hidden flex items-center gap-2 w-full mt-0.5">
                      <span className="text-[10px] text-gray-400 dark:text-gray-600 tabular-nums">
                        {row.wins ?? 0}P {row.losses ?? 0}I
                      </span>
                      {row.form && row.form.length > 0 && (
                        <div className="flex items-center gap-0.5">
                          {row.form.map(function(r, fi) { return <FormPill key={fi} result={r} /> })}
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                <td className="px-2 py-4 text-center text-gray-500 dark:text-gray-400 tabular-nums hidden sm:table-cell">{row.played ?? 0}</td>
                <td className="px-2 py-4 text-center tabular-nums hidden sm:table-cell">
                  <span className={(row.wins ?? 0) > 0 ? 'font-semibold text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-600'}>{row.wins ?? 0}</span>
                </td>
                <td className="px-2 py-4 text-center tabular-nums hidden sm:table-cell">
                  <span className={(row.losses ?? 0) > 0 ? 'text-red-500 dark:text-red-400' : 'text-gray-400 dark:text-gray-600'}>{row.losses ?? 0}</span>
                </td>

                <td className="px-3 py-4 hidden md:table-cell">
                  <div className="flex items-center justify-center gap-0.5">
                    {row.form && row.form.length > 0
                      ? row.form.map(function(r, fi) { return <FormPill key={fi} result={r} /> })
                      : <span className="text-gray-300 dark:text-gray-700 text-xs">-</span>
                    }
                  </div>
                </td>

                <td className="px-4 py-4 text-center">
                  <span className={'text-lg font-bold tabular-nums ' + (isLeader && (row.framePoints ?? 0) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white')}>
                    {row.framePoints ?? 0}
                  </span>
                  {gap && <span className={'ml-1 text-xs font-semibold tabular-nums ' + gap.cls}>{gap.text}</span>}
                </td>
              </tr>
            )
          })}

          {standings.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-16 text-center">
                <div className="text-4xl mb-3">🎱</div>
                <div className="text-base font-medium text-gray-500 dark:text-gray-400">Sezona jos nije pocela</div>
                <div className="text-sm text-gray-400 dark:text-gray-600 mt-1">Rezultati ce se pojaviti ovdje nakon odigranih utakmica</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {standings.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-100 dark:border-white/5 flex items-center gap-4 flex-wrap">
          <span className="text-[10px] text-gray-400 dark:text-gray-600 uppercase tracking-widest">Legenda:</span>
          {[['O', 'Odigrane'], ['P', 'Pobjede'], ['I', 'Izgubljene']].map(function(item) {
            return (
              <span key={item[0]} className="text-[10px] text-gray-400 dark:text-gray-600">
                <span className="font-bold text-gray-600 dark:text-gray-400">{item[0]}</span> = {item[1]}
              </span>
            )
          })}
          <span className="text-[10px] text-gray-400 dark:text-gray-600">Bod. = Ukupni bodovi mečeva</span>
        </div>
      )}
    </div>
  )
}
