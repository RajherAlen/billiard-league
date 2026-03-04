import { Link } from 'react-router-dom'

const MEDALS = ['🥇', '🥈', '🥉']

export default function StandingsTable({ standings }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-white/8 shadow-sm dark:shadow-none bg-white dark:bg-[#111]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 dark:border-white/8">
            <th className="px-5 py-3.5 text-left w-14 text-gray-400 dark:text-gray-500 text-xs font-semibold uppercase tracking-widest">#</th>
            <th className="px-4 py-3.5 text-left text-gray-400 dark:text-gray-500 text-xs font-semibold uppercase tracking-widest">Ekipa</th>
            <th className="px-4 py-3.5 text-center text-gray-400 dark:text-gray-500 text-xs font-semibold uppercase tracking-widest hidden sm:table-cell">OU</th>
            <th className="px-5 py-3.5 text-center text-gray-400 dark:text-gray-500 text-xs font-semibold uppercase tracking-widest">Bodovi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-white/4">
          {standings.map((row, i) => (
            <tr key={row.team_id} className={`transition-colors hover:bg-gray-50 dark:hover:bg-white/3 ${i === 0 ? 'bg-amber-50/50 dark:bg-amber-400/5' : ''}`}>
              <td className="px-5 py-4 text-center">
                {i < 3
                  ? <span className="text-base">{MEDALS[i]}</span>
                  : <span className="text-gray-400 dark:text-gray-600 font-semibold">{i + 1}</span>
                }
              </td>
              <td className="px-4 py-4">
                <Link to={`/teams/${row.team_id}`} className={`font-semibold hover:underline underline-offset-2 ${i === 0 ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-200'}`}>
                  {row.team_name}
                </Link>
                {i === 0 && row.points > 0 && (
                  <span className="ml-2 text-[10px] font-bold bg-amber-100 dark:bg-amber-400/15 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                    Lider
                  </span>
                )}
              </td>
              <td className="px-4 py-4 text-center text-gray-500 dark:text-gray-400 hidden sm:table-cell">{row.matches}</td>
              <td className="px-5 py-4 text-center">
                <span className={`text-lg font-bold tabular-nums ${i === 0 && row.points > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
                  {row.points}
                </span>
              </td>
            </tr>
          ))}
          {standings.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-16 text-center">
                <div className="text-4xl mb-3">🎱</div>
                <div className="text-base font-medium text-gray-500 dark:text-gray-400">Sezona još nije počela</div>
                <div className="text-sm text-gray-400 dark:text-gray-600 mt-1">Rezultati će se pojaviti ovdje nakon odigranih utakmica</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
