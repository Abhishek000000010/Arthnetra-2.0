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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/auction" element={<Auction />} />
        <Route path="/ledger" element={<Ledger />} />
        <Route path="/create" element={<CreateFund />} />
        <Route path="/dna" element={<FundDNA />} />
        <Route path="/profile" element={<MemberProfile />} />
        <Route path="/simulate" element={<SimulationMode />} />
        <Route path="/tracker" element={<ContributionTracker />} />
        <Route path="/winner" element={<WinnerAnnouncement />} />
        <Route path="/default" element={<DefaultHandling />} />
        {/* Navigation aliases for sidebar consistency */}
        <Route path="/fund" element={<Dashboard />} />
        <Route path="/members" element={<ContributionTracker />} />
      </Routes>
    </Router>
  )
}

export default App
