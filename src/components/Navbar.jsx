import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

function NavLink({ to, children, onClick }) {
  const location = useLocation()
  const active = location.pathname === to
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

export default function Navbar() {
  const { session, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  const handleSignOut = async () => { await signOut(); navigate('/') }

  return (
    <nav className="sticky top-0 z-50 bg-white/95 dark:bg-black/90 border-b border-gray-200 dark:border-white/8 backdrop-blur-sm shadow-sm dark:shadow-none">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2 font-bold text-gray-900 dark:text-white text-base tracking-tight shrink-0">
            <span className="text-xl leading-none">🎱</span>
            <span>Bilijar <span className="text-emerald-600 dark:text-emerald-400">Liga</span></span>
          </Link>

          <div className="hidden sm:flex items-center gap-1">
            <NavLink to="/">Ljestvica</NavLink>
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

          <div className="sm:hidden flex items-center gap-1">
            <ThemeToggle />
            <button
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Izbornik"
            >
              {menuOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="sm:hidden border-t border-gray-100 dark:border-white/5 py-3 flex flex-col gap-1 pb-4">
            <NavLink to="/">Ljestvica</NavLink>
            <NavLink to="/players">Igrači</NavLink>
            <NavLink to="/matches">Utakmice</NavLink>
            {session ? (
              <>
                <NavLink to="/admin">Admin nadzorna ploča</NavLink>
                <NavLink to="/admin/result/new">Dodaj rezultat</NavLink>
                <NavLink to="/admin/teams">Upravljaj ekipama</NavLink>
                <button
                  onClick={handleSignOut}
                  className="mt-1 px-3 py-2 text-sm text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium"
                >
                  Odjava
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="mt-1 px-3 py-2 text-sm bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-semibold text-center"
              >
                Admin prijava
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
