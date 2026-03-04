import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const GAME_LABELS = { '8ball': '8-Ball', '9ball': '9-Ball', '10ball': '10-Ball' }
const GAME_FRAMES = { '8ball': 5, '9ball': 6, '10ball': 5 }
const GAME_COLORS = {
  '8ball':  'bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300',
  '9ball':  'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300',
  '10ball': 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300',
}

export default function MatchDetail() {
  const { id } = useParams()
  const [match, setMatch] = useState(null)
  const [frames, setFrames] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: m } = await supabase
        .from('matches')
        .select(`id, match_date, notes, home_team_id, away_team_id,
          home_team:teams!matches_home_team_id_fkey(id, name),
          away_team:teams!matches_away_team_id_fkey(id, name)`)
        .eq('id', id).single()

      const { data: f } = await supabase
        .from('frames')
        .select(`id, frame_order, game_type, is_doubles, home_score, away_score,
          home_player1:players!frames_home_player1_id_fkey(id, name),
          home_player2:players!frames_home_player2_id_fkey(id, name),
          away_player1:players!frames_away_player1_id_fkey(id, name),
          away_player2:players!frames_away_player2_id_fkey(id, name)`)
        .eq('match_id', id).order('frame_order')

      setMatch(m); setFrames(f || [])
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-gray-400 dark:text-gray-600">
      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
    </div>
  )
  if (!match) return <div className="max-w-3xl mx-auto px-4 py-12 text-center text-gray-500">Utakmica nije pronađena.</div>

  const homePoints = frames.reduce((s, f) => s + (f.home_score || 0), 0)
  const awayPoints = frames.reduce((s, f) => s + (f.away_score || 0), 0)
  const homeWins = homePoints > awayPoints
  const awayWins = awayPoints > homePoints

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <Link to="/matches" className="inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm mb-6 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Natrag na utakmice
      </Link>

      <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/8 rounded-2xl p-6 sm:p-8 mb-6 shadow-sm dark:shadow-none">
        <div className="text-center text-gray-400 dark:text-gray-500 text-sm mb-6">
          {new Date(match.match_date).toLocaleDateString('hr-HR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex-1 text-right min-w-0">
            <div className="text-[10px] text-gray-400 dark:text-gray-600 font-semibold uppercase tracking-widest mb-1">Domaćin</div>
            <div className={`font-extrabold text-xl sm:text-2xl truncate ${homeWins ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
              {match.home_team?.name}
            </div>
            {homeWins && <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-widest mt-1">Pobjednik</div>}
          </div>
          <div className="shrink-0 text-center bg-gray-50 dark:bg-white/5 px-5 py-3 rounded-2xl">
            <div className="flex items-center gap-2">
              <span className={`text-4xl sm:text-5xl font-black tabular-nums ${homeWins ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-600'}`}>{homePoints}</span>
              <span className="text-gray-300 dark:text-gray-700 text-xl">:</span>
              <span className={`text-4xl sm:text-5xl font-black tabular-nums ${awayWins ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-600'}`}>{awayPoints}</span>
            </div>
            <div className="text-gray-400 dark:text-gray-600 text-xs mt-1 uppercase tracking-widest">bodovi</div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-gray-400 dark:text-gray-600 font-semibold uppercase tracking-widest mb-1">Gost</div>
            <div className={`font-extrabold text-xl sm:text-2xl truncate ${awayWins ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
              {match.away_team?.name}
            </div>
            {awayWins && <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-widest mt-1">Pobjednik</div>}
          </div>
        </div>
        {match.notes && (
          <div className="mt-5 pt-4 border-t border-gray-100 dark:border-white/5 text-center text-gray-500 dark:text-gray-400 text-sm">
            {match.notes}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-base font-bold text-gray-900 dark:text-white">Rezultati mečeva</h2>
        <span className="text-xs text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full">{frames.length} mečeva</span>
      </div>

      <div className="flex flex-col gap-2">
        {frames.map(frame => {
          const homeWon = frame.home_score > frame.away_score
          const awayWon = frame.away_score > frame.home_score
          const max = GAME_FRAMES[frame.game_type]
          return (
            <div key={frame.id} className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/8 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 dark:text-gray-600 text-xs font-mono">#{frame.frame_order}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${GAME_COLORS[frame.game_type]}`}>
                    {GAME_LABELS[frame.game_type]}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                    {frame.is_doubles ? 'Dubl' : 'Singl'}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 rounded-lg px-3 py-1">
                  <span className={`text-lg font-black tabular-nums ${homeWon ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-600'}`}>
                    {frame.home_score}
                  </span>
                  <span className="text-gray-300 dark:text-gray-700 text-sm">:</span>
                  <span className={`text-lg font-black tabular-nums ${awayWon ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-600'}`}>
                    {frame.away_score}
                  </span>
                  <span className="text-gray-400 dark:text-gray-600 text-xs ml-1">/{max}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  { team: match.home_team, p1: frame.home_player1, p2: frame.home_player2, won: homeWon },
                  { team: match.away_team, p1: frame.away_player1, p2: frame.away_player2, won: awayWon },
                ].map(({ team, p1, p2, won }) => (
                  <div key={team?.id} className={`rounded-lg px-3 py-2 ${won ? 'bg-amber-50 dark:bg-amber-400/8 border border-amber-200 dark:border-amber-400/20' : 'bg-gray-50 dark:bg-white/3 border border-gray-100 dark:border-white/5'}`}>
                    <div className="text-[10px] text-gray-400 dark:text-gray-600 font-semibold uppercase tracking-widest mb-1">{team?.name}</div>
                    <div className={won ? 'text-amber-800 dark:text-amber-200 font-medium' : 'text-gray-500 dark:text-gray-400'}>
                      {p1?.name || <span className="italic text-gray-300 dark:text-gray-700">—</span>}
                      {frame.is_doubles && p2 && <span> / {p2.name}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
