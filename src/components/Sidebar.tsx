import { motion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import { 
  Home, 
  Wallet, 
  Gavel, 
  Users, 
  Receipt, 
  PlayCircle,
  Settings,
  LogOut,
  Brain,
  ShieldAlert,
  Trophy
} from 'lucide-react'
import { cn } from '../utils/cn.ts'
import { useAuth } from '../context/AuthContext'
import { useFund } from '../context/FundContext'

const menuItems = [
  { icon: Home, label: 'Dashboard', path: '/dashboard' },
  { icon: Wallet, label: 'Fund Flow', path: '/tracker' },
  { icon: Gavel, label: 'Live Auction', path: '/auction' },
  { icon: Brain, label: 'Fund DNA', path: '/dna' },
  { icon: Receipt, label: 'Ledger', path: '/ledger' },
  { icon: PlayCircle, label: 'Simulate', path: '/simulate' },
]

export function Sidebar() {
  const location = useLocation()
  const { signOutUser } = useAuth()
  const { state, topupWallet, unreadNotificationCount } = useFund()

  return (
    <aside className="w-64 h-screen bg-surface-container-low border-r border-white/5 flex flex-col p-6 fixed left-0 top-0 z-20">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 mb-8 group">
        <div className="relative w-8 h-8 flex items-center justify-center bg-surface-container-high rounded-full border border-white/10 shadow-[0_0_15px_rgba(196,192,255,0.15)] group-hover:scale-110 transition-transform">
          <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>visibility</span>
        </div>
        <span className="font-headline font-black text-primary tracking-tight text-lg">ArthaNetra</span>
      </Link>

      {/* Enhanced ArthaNetra Demo Wallet */}
      <div className="mb-10 p-6 rounded-[24px] bg-surface-container-high border border-white/10 relative group/wallet overflow-visible shadow-2xl shadow-primary/5">
        {/* Animated Background Mesh */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 rounded-[24px] opacity-50 group-hover/wallet:opacity-100 transition-opacity duration-500" />
        
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-4">
            <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[8px] font-black uppercase tracking-tighter border border-primary/20">
              Demo Account
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary/60 group-hover/wallet:text-primary transition-colors">
              <Wallet size={16} />
            </div>
          </div>
          
          <p className="text-[10px] font-label font-medium text-on-surface-variant opacity-40 uppercase tracking-[0.1em] mb-1">Available Funds</p>
          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-3xl font-headline font-black text-on-surface tracking-tighter">
              ₹{(state.myWalletBalance || 10000).toLocaleString('en-IN')}
            </span>
            <span className="text-xs font-bold text-primary/40 uppercase">INR</span>
          </div>

          <button 
            onClick={async (e) => { 
                e.preventDefault(); 
                const msg = await topupWallet();
                alert(msg);
            }}
            className="w-full group/btn relative overflow-hidden flex items-center justify-center py-3.5 rounded-2xl bg-primary text-on-primary text-xs font-headline font-black uppercase tracking-widest transition-all hover:translate-y-[-2px] hover:shadow-xl hover:shadow-primary/30 active:translate-y-[1px] active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover/btn:translate-y-0 transition-transform duration-300" />
            <div className="relative z-10 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">bolt</span>
              Quick Top Up
            </div>
          </button>
        </div>

        {/* Decorative elements to fix the visual 'cut-off' feel */}
        <div className="absolute -top-1 -right-1 w-20 h-20 bg-primary/5 blur-3xl opacity-0 group-hover/wallet:opacity-100 transition-opacity" />
      </div>

      {/* Nav Items */}
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-on-surface-variant hover:bg-white/5 hover:text-on-surface"
              )}
            >
              <item.icon size={18} className={cn(isActive ? "text-primary" : "text-on-surface-variant group-hover:text-on-surface")} />
              <span className="text-sm font-bold font-headline">{item.label}</span>
              {isActive && (
                <motion.div 
                  layoutId="active-pill"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Utility Nav */}
      <div className="pt-6 border-t border-white/5 space-y-1">
         <SidebarLink label="Member Profile" path="/profile" icon={<Users size={18} />} active={location.pathname === '/profile'} />
         <SidebarLink label="Join Fund" path="/join" icon={<Wallet size={18} />} active={location.pathname === '/join'} />
         <SidebarLink
           label="Notifications"
           path="/default"
           icon={<ShieldAlert size={18} />}
           active={location.pathname === '/default'}
           badge={unreadNotificationCount > 0 ? String(unreadNotificationCount) : undefined}
         />
         <SidebarLink label="Winner Circle" path="/winner" icon={<Trophy size={18} />} active={location.pathname === '/winner'} />
      </div>

      {/* Footer Nav */}
      <div className="pt-6 mt-2 border-t border-white/5 space-y-1">
        <button className="w-full flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-white/5 hover:text-on-surface rounded-xl transition-all group">
          <Settings size={18} className="group-hover:rotate-45 transition-transform" />
          <span className="text-sm font-bold font-headline">Settings</span>
        </button>
        <button
          onClick={signOutUser}
          className="w-full flex items-center gap-3 px-4 py-3 text-error/60 hover:bg-error/10 hover:text-error rounded-xl transition-all"
        >
          <LogOut size={18} />
          <span className="text-sm font-bold font-headline">Exit App</span>
        </button>
      </div>
    </aside>
  )
}

function SidebarLink({ label, path, icon, active, badge }: any) {
   return (
    <Link
      to={path}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
        active 
          ? "bg-primary/10 text-primary border border-primary/20" 
          : "text-on-surface-variant hover:bg-white/5 hover:text-on-surface"
      )}
    >
      {icon}
      <span className="text-xs font-headline font-bold">{label}</span>
      {badge ? (
        <span className="ml-auto min-w-5 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-label font-black text-primary text-center">
          {badge}
        </span>
      ) : null}
    </Link>
   )
}
