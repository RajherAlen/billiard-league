import { Link } from 'react-router-dom'

export default function MatchCard({ match }) {
  const homeFrames = match.frames?.filter(f => f.winning_team_id === match.home_team_id).length ?? 0
  const awayFrames = match.frames?.filter(f => f.winning_team_id === match.away_team_id).length ?? 0
  const homeWins = homeFrames > awayFrames
  const awayWins = awayFrames > homeFrames

  return (
    <Link to={`/matches/${match.id}`} className="block group">
      <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/8 rounded-2xl p-4 sm:p-5 transition-all hover:border-gray-300 dark:hover:border-white/15 hover:shadow-md dark:hover:shadow-none">
        {/* Top row */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-400 dark:text-gray-500 text-xs flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {new Date(match.match_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          {match.notes && <span className="text-gray-400 dark:text-gray-500 text-xs truncate max-w-28 sm:max-w-48">{match.notes}</span>}
          <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>

        {/* Teams & score */}
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-gray-400 dark:text-gray-600 font-semibold uppercase tracking-widest mb-0.5">Home</div>
            <div className={`font-bold text-base sm:text-lg truncate ${homeWins ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
              {match.home_team?.name ?? 'Home'}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 px-4 py-2 rounded-xl bg-gray-50 dark:bg-white/5">
            <span className={`text-2xl sm:text-3xl font-black tabular-nums ${homeWins ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-600'}`}>
              {homeFrames}
            </span>
            <span className="text-gray-300 dark:text-gray-700">:</span>
            <span className={`text-2xl sm:text-3xl font-black tabular-nums ${awayWins ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-600'}`}>
              {awayFrames}
            </span>
          </div>

          <div className="flex-1 min-w-0 text-right">
            <div className="text-[10px] text-gray-400 dark:text-gray-600 font-semibold uppercase tracking-widest mb-0.5">Away</div>
            <div className={`font-bold text-base sm:text-lg truncate ${awayWins ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
              {match.away_team?.name ?? 'Away'}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
