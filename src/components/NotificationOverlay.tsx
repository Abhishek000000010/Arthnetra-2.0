import { useEffect } from 'react'
import { Bell, UserPlus, Wallet, Gavel, ShieldAlert } from 'lucide-react'
import { useFund } from '../context/FundContext'

export function NotificationOverlay() {
  const { latestToast, dismissToast } = useFund()

  useEffect(() => {
    if (!latestToast) return
    const timer = window.setTimeout(() => dismissToast(), 4500)
    return () => window.clearTimeout(timer)
  }, [latestToast, dismissToast])

  if (!latestToast) return null

  return (
    <div className="fixed top-6 right-6 z-[80] max-w-sm">
      <div className="rounded-2xl border border-primary/20 bg-surface-container-high/95 backdrop-blur-xl p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="mt-1 rounded-xl bg-primary/10 p-2 text-primary border border-primary/20">
            {iconForType(latestToast.type)}
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-label uppercase tracking-[0.2em] text-primary mb-1">Live Notification</p>
            <h3 className="text-sm font-headline font-bold text-on-surface">{latestToast.title}</h3>
            <p className="mt-1 text-xs text-on-surface-variant opacity-80">{latestToast.detail}</p>
          </div>
          <button
            onClick={dismissToast}
            className="text-on-surface-variant hover:text-on-surface text-xs font-label uppercase tracking-widest"
          >
            Hide
          </button>
        </div>
      </div>
    </div>
  )
}

function iconForType(type: string) {
  if (type === 'member') return <UserPlus size={18} />
  if (type === 'payment') return <Wallet size={18} />
  if (type === 'bid') return <Gavel size={18} />
  if (type === 'alert') return <ShieldAlert size={18} />
  return <Bell size={18} />
}
