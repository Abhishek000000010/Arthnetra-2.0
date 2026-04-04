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

  return (
    <aside className="w-64 h-screen bg-surface-container-low border-r border-white/5 flex flex-col p-6 fixed left-0 top-0 z-20">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 mb-12 group">
        <div className="relative w-8 h-8 flex items-center justify-center bg-surface-container-high rounded-full border border-white/10 shadow-[0_0_15px_rgba(196,192,255,0.15)] group-hover:scale-110 transition-transform">
          <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>visibility</span>
        </div>
        <span className="font-headline font-black text-primary tracking-tight text-lg">ArthaNetra</span>
      </Link>

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
         <SidebarLink label="Security Alerts" path="/default" icon={<ShieldAlert size={18} />} active={location.pathname === '/default'} />
         <SidebarLink label="Winner Circle" path="/winner" icon={<Trophy size={18} />} active={location.pathname === '/winner'} />
      </div>

      {/* Footer Nav */}
      <div className="pt-6 mt-2 border-t border-white/5 space-y-1">
        <button className="w-full flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-white/5 hover:text-on-surface rounded-xl transition-all group">
          <Settings size={18} className="group-hover:rotate-45 transition-transform" />
          <span className="text-sm font-bold font-headline">Settings</span>
        </button>
        <Link to="/" className="w-full flex items-center gap-3 px-4 py-3 text-error/60 hover:bg-error/10 hover:text-error rounded-xl transition-all">
          <LogOut size={18} />
          <span className="text-sm font-bold font-headline">Exit App</span>
        </Link>
      </div>
    </aside>
  )
}

function SidebarLink({ label, path, icon, active }: any) {
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
    </Link>
   )
}
