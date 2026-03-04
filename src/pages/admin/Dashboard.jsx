import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const cards = [
  {
    to: '/admin/result/new',
    label: 'Dodaj rezultat utakmice',
    description: 'Unesi rezultate meč po meč za utakmicu',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
    iconBg: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
    border: 'hover:border-emerald-200 dark:hover:border-emerald-500/30',
  },
  {
    to: '/admin/teams',
    label: 'Upravljaj ekipama i igračima',
    description: 'Dodaj ekipe i rasporedi igrače u sastave',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    iconBg: 'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400',
    border: 'hover:border-blue-200 dark:hover:border-blue-500/30',
  },
  {
    to: '/matches',
    label: 'Pregledaj sve utakmice',
    description: 'Pregledaj rezultate i detalje mečeva',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    iconBg: 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400',
    border: 'hover:border-amber-200 dark:hover:border-amber-500/30',
  },
]

export default function Dashboard() {
  const { session } = useAuth()

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <div className="mb-8">
        <p className="text-emerald-600 dark:text-emerald-500 text-xs font-semibold uppercase tracking-widest mb-2">Admin panel</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Nadzorna ploča</h1>
        {session?.user?.email && (
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Prijavljeni kao {session.user.email}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {cards.map(card => (
          <Link
            key={card.to}
            to={card.to}
            className={`group bg-white dark:bg-[#111] border border-gray-200 dark:border-white/8 rounded-2xl p-5 transition-all hover:shadow-md dark:hover:shadow-none hover:-translate-y-0.5 ${card.border}`}
          >
            <div className={`inline-flex p-2.5 rounded-xl mb-4 ${card.iconBg}`}>{card.icon}</div>
            <div className="text-gray-900 dark:text-white font-bold text-base mb-1">{card.label}</div>
            <div className="text-gray-500 dark:text-gray-400 text-sm">{card.description}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
