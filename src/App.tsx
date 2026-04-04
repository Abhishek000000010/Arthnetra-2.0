import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Landing } from './pages/Landing'
import { Dashboard } from './pages/Dashboard'
import { Auction } from './pages/Auction'
import { Ledger } from './pages/Ledger'
import { CreateFund } from './pages/CreateFund'
import { FundDNA } from './pages/FundDNA'
import { MemberProfile } from './pages/MemberProfile'
import { SimulationMode } from './pages/SimulationMode'
import { ContributionTracker } from './pages/ContributionTracker'
import { WinnerAnnouncement } from './pages/WinnerAnnouncement'
import { DefaultHandling } from './pages/DefaultHandling'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { JoinFund } from './pages/JoinFund'
import { ProtectedRoute } from './components/ProtectedRoute'
import { NotificationOverlay } from './components/NotificationOverlay'

function App() {
  return (
    <Router>
      <NotificationOverlay />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/join" element={<ProtectedRoute><JoinFund /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/auction" element={<ProtectedRoute><Auction /></ProtectedRoute>} />
        <Route path="/ledger" element={<ProtectedRoute><Ledger /></ProtectedRoute>} />
        <Route path="/create" element={<ProtectedRoute><CreateFund /></ProtectedRoute>} />
        <Route path="/dna" element={<ProtectedRoute><FundDNA /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><MemberProfile /></ProtectedRoute>} />
        <Route path="/simulate" element={<ProtectedRoute><SimulationMode /></ProtectedRoute>} />
        <Route path="/tracker" element={<ProtectedRoute><ContributionTracker /></ProtectedRoute>} />
        <Route path="/winner" element={<ProtectedRoute><WinnerAnnouncement /></ProtectedRoute>} />
        <Route path="/default" element={<ProtectedRoute><DefaultHandling /></ProtectedRoute>} />
        {/* Navigation aliases for sidebar consistency */}
        <Route path="/fund" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/members" element={<ProtectedRoute><ContributionTracker /></ProtectedRoute>} />
      </Routes>
    </Router>
  )
}

export default App
