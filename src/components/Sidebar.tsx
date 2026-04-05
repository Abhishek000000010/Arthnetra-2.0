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
  const { state, topupWallet, withdrawFunds, unreadNotificationCount } = useFund()

  return (
    <aside className="w-64 h-screen bg-surface-container-low border-r border-white/5 flex flex-col p-6 fixed left-0 top-0 z-20">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 mb-8 group">
        <div className="relative w-8 h-8 flex items-center justify-center bg-surface-container-high rounded-full border border-white/10 shadow-[0_0_15px_rgba(196,192,255,0.15)] group-hover:scale-110 transition-transform">
          <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>visibility</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-headline font-black text-on-surface leading-none tracking-tighter group-hover:text-primary transition-colors">ARTHA</span>
          <span className="text-[10px] font-label font-black text-primary/60 uppercase tracking-[0.2em] -mt-0.5">Netra</span>
        </div>
      </Link>

      {/* Wallet Card */}
      <div className="relative group/wallet mb-8 p-5 bg-surface-container rounded-[2rem] border border-white/5 overflow-hidden transition-all hover:bg-surface-container-high hover:border-white/10 active:scale-[0.98]">
        <div className="relative z-10">
          <p className="text-[10px] font-label font-medium text-on-surface-variant opacity-40 uppercase tracking-[0.1em] mb-1">Available Funds</p>
          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-3xl font-headline font-black text-on-surface tracking-tighter">
              ₹{(state.myWalletBalance || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-xs font-bold text-primary/40 uppercase">INR</span>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={async (e) => { 
                  e.preventDefault(); 
                  const msg = await topupWallet();
                  alert(msg);
              }}
              className="flex-1 group/btn relative overflow-hidden flex items-center justify-center py-3 rounded-xl bg-primary text-on-primary text-[10px] font-headline font-black uppercase tracking-wider transition-all hover:translate-y-[-2px] hover:shadow-lg active:translate-y-[1px]"
            >
              <div className="relative z-10 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">bolt</span>
                Top Up
              </div>
            </button>

            <button 
              onClick={async (e) => { 
                e.preventDefault(); 
                const amount = prompt("Move proceeds to external bank account. Amount:");
                if (amount && !isNaN(Number(amount))) {
                  const msg = await withdrawFunds(Number(amount));
                  alert(msg);
                }
              }}
              className="flex-1 group/btn relative overflow-hidden flex items-center justify-center py-3 rounded-xl bg-white/10 text-on-surface text-[10px] font-headline font-black uppercase tracking-wider border border-white/10 transition-all hover:bg-white/15 hover:translate-y-[-2px] active:translate-y-[1px]"
            >
              <div className="relative z-10 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">payments</span>
                Move to Bank
              </div>
            </button>
          </div>
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

      {/* Network Status */}
      <div className="mt-auto px-4 py-3 bg-[#0a0a0a] rounded-2xl border border-white/5 flex items-center gap-3">
        <div className="relative">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(196,192,255,0.6)]" />
          <div className="absolute inset-0 w-2 h-2 rounded-full bg-primary/40 animate-ping" />
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-black uppercase tracking-widest text-primary leading-none mb-0.5">Mainnet Alpha</span>
          <span className="text-[10px] font-mono text-on-surface-variant opacity-40">Block #482,942</span>
        </div>
      </div>

      {/* Footer Nav */}
      <div className="pt-4 mt-2 border-t border-white/5 space-y-1">
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
