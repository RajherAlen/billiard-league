import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Players from './pages/Players'
import PlayerProfile from './pages/PlayerProfile'
import Matches from './pages/Matches'
import MatchDetail from './pages/MatchDetail'
import Team from './pages/Team'
import Fixtures from './pages/Fixtures'
import Login from './pages/Login'
import Dashboard from './pages/admin/Dashboard'
import AddResult from './pages/admin/AddResult'
import ManageTeams from './pages/admin/ManageTeams'
import ScheduleMatch from './pages/admin/ScheduleMatch'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white transition-colors duration-200">
            <Navbar />
            <div className="pb-16 sm:pb-0">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/players" element={<Players />} />
                <Route path="/players/:id" element={<PlayerProfile />} />
                <Route path="/teams/:id" element={<Team />} />
                <Route path="/matches" element={<Matches />} />
                <Route path="/matches/:id" element={<MatchDetail />} />
                <Route path="/fixtures" element={<Fixtures />} />
                <Route path="/login" element={<Login />} />
                <Route path="/admin" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/admin/result/new" element={<ProtectedRoute><AddResult /></ProtectedRoute>} />
                <Route path="/admin/teams" element={<ProtectedRoute><ManageTeams /></ProtectedRoute>} />
                <Route path="/admin/schedule" element={<ProtectedRoute><ScheduleMatch /></ProtectedRoute>} />
              </Routes>
            </div>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
