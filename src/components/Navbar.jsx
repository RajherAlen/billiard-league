import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

function NavLink({ to, children, onClick, exact }) {
  const location = useLocation()
  const active = exact ? location.pathname === to : location.pathname.startsWith(to)
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
      }`}
    >
      {children}
    </Link>
  )
}

function BottomTab({ to, label, icon, exact }) {
  const location = useLocation()
  const active = exact ? location.pathname === to : location.pathname.startsWith(to)
  return (
    <Link
      to={to}
      className={`flex flex-col items-center justify-center gap-0.5 pt-1 pb-safe transition-colors ${
        active
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400'
      }`}
    >
      <span className="w-6 h-6">{icon}</span>
      <span className="text-[10px] font-semibold tracking-wide">{label}</span>
    </Link>
  )
}

function ThemeToggle() {
  const { dark, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      aria-label="Promijeni temu"
      className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
    >
      {dark ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  )
}

const BOTTOM_TABS = [
  {
    to: '/',
    exact: true,
    label: 'Ljestvica',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
    ),
  },
  {
    to: '/fixtures',
    label: 'Raspored',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    to: '/players',
    label: 'Igrači',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    to: '/matches',
    label: 'Utakmice',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8a4 4 0 100 8 4 4 0 000-8z" />
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
      </svg>
    ),
  },
]

export default function Navbar() {
  const { session, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  const handleSignOut = async () => { await signOut(); navigate('/') }

  return (
    <>
      {/* Top navbar */}
      <nav className="sticky top-0 z-50 bg-white/95 dark:bg-black/90 border-b border-gray-200 dark:border-white/8 backdrop-blur-sm shadow-sm dark:shadow-none">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link to="/" className="flex items-center gap-2 font-bold text-gray-900 dark:text-white text-base tracking-tight shrink-0">
              <span className="text-xl leading-none">🎱</span>
              <span>Bilijar <span className="text-emerald-600 dark:text-emerald-400">Liga</span></span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden sm:flex items-center gap-1">
              <NavLink to="/" exact>Ljestvica</NavLink>
              <NavLink to="/fixtures">Raspored</NavLink>
              <NavLink to="/players">Igrači</NavLink>
              <NavLink to="/matches">Utakmice</NavLink>
              {session && <NavLink to="/admin">Admin</NavLink>}
              <div className="w-px h-5 bg-gray-200 dark:bg-white/10 mx-1" />
              <ThemeToggle />
              {session ? (
                <button
                  onClick={handleSignOut}
                  className="ml-1 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium"
                >
                  Odjava
                </button>
              ) : (
                <Link
                  to="/login"
                  className="ml-1 px-4 py-1.5 text-sm bg-gray-900 dark:bg-white hover:bg-gray-700 dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-lg transition-colors font-semibold"
                >
                  Admin
                </Link>
              )}
            </div>

            {/* Mobile top-right actions */}
            <div className="sm:hidden flex items-center gap-1">
              <ThemeToggle />
              {session && (
                <button
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                  onClick={() => setMenuOpen(v => !v)}
                  aria-label="Admin izbornik"
                >
                  {menuOpen ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              )}
              {!session && (
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-semibold"
                >
                  Admin
                </Link>
              )}
            </div>
          </div>

          {/* Mobile admin dropdown */}
          {menuOpen && session && (
            <div className="sm:hidden border-t border-gray-100 dark:border-white/5 py-3 flex flex-col gap-1 pb-4">
              <NavLink to="/admin" exact>Admin nadzorna ploča</NavLink>
              <NavLink to="/admin/schedule">Zakaži utakmicu</NavLink>
              <NavLink to="/admin/result/new">Dodaj rezultat</NavLink>
              <NavLink to="/admin/teams">Upravljaj ekipama</NavLink>
              <button
                onClick={handleSignOut}
                className="mt-1 px-3 py-2 text-sm text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium"
              >
                Odjava
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-black/90 border-t border-gray-200 dark:border-white/8 backdrop-blur-sm">
        <div className="grid grid-cols-4 h-16">
          {BOTTOM_TABS.map(tab => (
            <BottomTab key={tab.to} to={tab.to} label={tab.label} icon={tab.icon} exact={tab.exact} />
          ))}
        </div>
      </div>
    </>
  )
}
