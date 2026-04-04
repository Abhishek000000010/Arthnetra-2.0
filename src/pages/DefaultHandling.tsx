import type { ReactNode } from 'react'
import { Sidebar } from '../components/Sidebar'
import {
  Bell,
  UserPlus,
  Wallet,
  Gavel,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react'
import { useFund } from '../context/FundContext'
import { cn } from '../utils/cn'

export function DefaultHandling() {
  const { hasActiveFund, notifications, unreadNotificationCount, markNotificationsRead, state } = useFund()

  return (
    <div className="flex h-screen bg-surface">
      <Sidebar />

      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <header className="mb-10 max-w-5xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                <Bell size={20} />
              </div>
              <span className="text-[10px] font-label font-black tracking-[0.2em] uppercase text-on-surface-variant opacity-60">
                Live Alerts
              </span>
            </div>
            <h1 className="text-3xl font-headline font-bold text-on-surface mb-2">Notification Center</h1>
            <p className="text-on-surface-variant font-medium opacity-60">
              Join events, contributions, bids, and auction outcomes appear here in real time for the active fund room.
            </p>
          </div>

          {hasActiveFund ? (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 px-6 py-4">
              <p className="text-[10px] font-label uppercase tracking-[0.2em] text-primary mb-1">Live Room</p>
              <p className="text-lg font-headline font-black text-on-surface">{state.fundName}</p>
              <p className="text-sm text-primary">Code: {state.fundCode}</p>
            </div>
          ) : null}
        </header>

        {!hasActiveFund ? (
          <section className="max-w-2xl rounded-[2rem] border border-white/5 bg-surface-container-low p-10 text-center">
            <h2 className="text-4xl font-headline font-black text-on-surface mb-4">No Live Fund Yet</h2>
            <p className="text-on-surface-variant opacity-60">
              Create or join a live chit fund first. After that, every join event and auction update will appear here.
            </p>
          </section>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-5xl">
              <SummaryCard label="Unread Alerts" value={String(unreadNotificationCount)} icon={<Bell size={18} />} />
              <SummaryCard label="Members in Room" value={String(state.memberCount)} icon={<UserPlus size={18} />} />
              <SummaryCard label="Recent Events" value={String(notifications.length)} icon={<CheckCircle2 size={18} />} />
            </div>

            <div className="max-w-5xl flex justify-end mb-6">
              <button
                onClick={markNotificationsRead}
                className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-xs font-label uppercase tracking-[0.2em] text-primary"
              >
                Mark All Read
              </button>
            </div>

            <section className="max-w-5xl bg-surface-container-low rounded-3xl border border-white/5 p-6">
              <div className="space-y-4">
                {notifications.length === 0 ? (
                  <div className="rounded-2xl border border-white/5 bg-surface-container-lowest p-8 text-center text-on-surface-variant opacity-60">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        'rounded-2xl border p-5 transition-all',
                        item.unread ? 'border-primary/20 bg-primary/5' : 'border-white/5 bg-surface-container-lowest',
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-1 rounded-xl border border-white/10 bg-surface p-3 text-primary">
                          {iconForType(item.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-sm font-headline font-bold text-on-surface">{item.title}</h3>
                            {item.unread ? (
                              <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-label uppercase tracking-[0.2em] text-primary">
                                New
                              </span>
                            ) : null}
                          </div>
                          <p className="text-sm text-on-surface-variant opacity-80">{item.detail}</p>
                          <p className="mt-2 text-[10px] font-label uppercase tracking-[0.2em] text-on-surface-variant opacity-50">
                            {formatDateTime(item.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}

function SummaryCard({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="bg-surface-container-low p-6 rounded-2xl border border-white/5">
      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4">
        {icon}
      </div>
      <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant opacity-40 mb-2">{label}</p>
      <h3 className="text-2xl font-headline font-black text-on-surface">{value}</h3>
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

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}
