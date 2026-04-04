import { useEffect, useState } from 'react'
import { Navigate, Link, useNavigate } from 'react-router-dom'
import { Eye, KeyRound, Mail, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useFund } from '../context/FundContext'
import { ApiService, type PublicFundCard } from '../services/ApiService'

export function JoinFund() {
  const { user } = useAuth()
  const { joinLiveFund } = useFund()
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [requestingId, setRequestingId] = useState<string | null>(null)
  const [publicFunds, setPublicFunds] = useState<PublicFundCard[]>([])
  const [loadingFunds, setLoadingFunds] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoadingFunds(true)
    ApiService.listPublicFunds()
      .then((response) => {
        if (!cancelled) setPublicFunds(response.funds)
      })
      .catch(() => {
        if (!cancelled) setPublicFunds([])
      })
      .finally(() => {
        if (!cancelled) setLoadingFunds(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const handleJoin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setNotice('')
    setSubmitting(true)
    const result = await joinLiveFund({ code, password })
    setSubmitting(false)

    if (result.error) {
      setError(result.error)
      return
    }

    navigate('/dashboard')
  }

  const handleRequestJoinEmail = async (fund: PublicFundCard) => {
    setError('')
    setNotice('')
    setRequestingId(fund.fundId)
    try {
      const response = await ApiService.requestJoinCodeEmail(fund.fundId, {
        recipientEmail: user.email,
        recipientName: user.name,
      })
      setNotice(response.message)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not send join code email.')
    } finally {
      setRequestingId(null)
    }
  }

  return (
    <main className="min-h-screen bg-surface px-6 py-16">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="bg-surface-container-low border border-white/5 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
              <Users size={22} />
            </div>
            <div>
              <p className="text-xs font-label uppercase tracking-[0.2em] opacity-50">ArthaNetra Live Fund</p>
              <h1 className="text-2xl font-headline font-black text-on-surface">Available Chit Funds</h1>
            </div>
          </div>

          <p className="text-sm text-on-surface-variant opacity-70 mb-6">
            When another user clicks join on one of these live rooms, they can receive the join code by email and then enter it below with the password.
          </p>

          {error ? <div className="mb-5 rounded-2xl border border-error/20 bg-error/10 p-4 text-sm text-error">{error}</div> : null}
          {notice ? <div className="mb-5 rounded-2xl border border-primary/20 bg-primary/10 p-4 text-sm text-primary">{notice}</div> : null}

          <div className="space-y-4">
            {loadingFunds ? (
              <div className="rounded-2xl border border-white/5 bg-surface-container-lowest p-6 text-sm text-on-surface-variant">
                Loading live fund rooms...
              </div>
            ) : publicFunds.length === 0 ? (
              <div className="rounded-2xl border border-white/5 bg-surface-container-lowest p-6 text-sm text-on-surface-variant">
                No open funds yet. Ask the creator to create a live room first.
              </div>
            ) : (
              publicFunds.map((fund) => (
                <div key={fund.fundId} className="rounded-2xl border border-white/5 bg-surface-container-lowest p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-lg font-headline font-black text-on-surface">{fund.fundName}</h3>
                      <p className="mt-1 text-sm text-on-surface-variant opacity-70">{fund.purpose}</p>
                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-on-surface-variant">
                        <span>Creator: {fund.creatorName}</span>
                        <span>{fund.memberCount} joined</span>
                        <span>{fund.availableSlots} slots left</span>
                        <span>Rs {fund.monthlyInstallment.toLocaleString('en-IN')} / month</span>
                      </div>
                    </div>

                    <button
                      onClick={() => { void handleRequestJoinEmail(fund) }}
                      disabled={requestingId === fund.fundId}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-headline font-bold text-on-primary disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Mail size={16} />
                      {requestingId === fund.fundId ? 'Sending...' : 'Get Join Code by Email'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="bg-surface-container-low border border-white/5 rounded-3xl p-8 shadow-2xl h-fit">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
              <KeyRound size={22} />
            </div>
            <div>
              <p className="text-xs font-label uppercase tracking-[0.2em] opacity-50">Manual Join</p>
              <h2 className="text-2xl font-headline font-black text-on-surface">Enter Code and Password</h2>
            </div>
          </div>

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs font-label uppercase tracking-[0.2em] text-on-surface-variant mb-2">
                Fund Code
              </label>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-surface px-4 py-3">
                <Eye size={18} className="text-primary" />
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value.toUpperCase())}
                  className="w-full bg-transparent text-on-surface outline-none"
                  placeholder="Example: A1B2C3"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-label uppercase tracking-[0.2em] text-on-surface-variant mb-2">
                Fund Password
              </label>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-surface px-4 py-3">
                <KeyRound size={18} className="text-primary" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full bg-transparent text-on-surface outline-none"
                  placeholder="Enter room password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-surface transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Joining...' : 'Join Fund'}
            </button>
          </form>

          <p className="mt-6 text-sm text-on-surface-variant text-center">
            Want to host your own room? <Link to="/create" className="text-primary font-bold">Create a fund</Link>
          </p>
        </section>
      </div>
    </main>
  )
}
