import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sidebar } from '../components/Sidebar'
import {
  Sparkles,
  Users,
  Calendar,
  Target,
  ArrowRight,
  Shield,
  Zap,
  BrainCircuit
} from 'lucide-react'
import { cn } from '../utils/cn.ts'
import { useFund } from '../context/FundContext'
import { ApiService, type BlueprintResponse } from '../services/ApiService'
import { useNavigate } from 'react-router-dom'

const DEFAULT_BLUEPRINT: BlueprintResponse = {
  fundName: 'Custom Goal Fund',
  summary: 'Enter your goal, group size, and duration to generate a tailored blueprint.',
  poolTotal: 'Rs 12,00,000',
  monthlyInstallment: 'Rs 10,000',
  riskLevel: 'Low',
  dividendEstimate: 'Rs 840',
  confidence: '92%',
}

const DURATION_OPTIONS = [6, 12, 18, 24]

export function CreateFund() {
  const { createLiveFund, state, hasActiveFund } = useFund()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [purpose, setPurpose] = useState('')
  const [groupSize, setGroupSize] = useState(10)
  const [durationMonths, setDurationMonths] = useState(12)
  const [joinPassword, setJoinPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<BlueprintResponse | null>(null)
  const [creationNotice, setCreationNotice] = useState('')

  const confidenceWidth = toPercent(result?.confidence ?? DEFAULT_BLUEPRINT.confidence)

  const handleSynthesize = async () => {
    if (!purpose.trim()) return

    setLoading(true)
    setError('')

    try {
      const blueprint = await ApiService.synthesize({
        intent: purpose.trim(),
        groupSize,
        durationMonths,
      })
      setResult(blueprint)
      setStep(2)
    } catch (requestError) {
      console.error('AI Synthesis Error:', requestError)
      setError('Unable to generate the blueprint right now. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFund = async () => {
    if (joinPassword.trim().length < 4) {
      setError('Set a join password with at least 4 characters.')
      return
    }

    setCreating(true)
    setError('')

    let blueprint = result

    if (!blueprint) {
      try {
        blueprint = await ApiService.synthesize({
          intent: purpose.trim() || 'Shared savings goal',
          groupSize,
          durationMonths,
        })
        setResult(blueprint)
        setStep(2)
      } catch {
        blueprint = DEFAULT_BLUEPRINT
      }
    }

    const created = await createLiveFund({
      fundName: blueprint.fundName,
      purpose: purpose.trim() || 'Shared savings goal',
      groupSize,
      durationMonths,
      monthlyInstallment: parseMoney(blueprint.monthlyInstallment),
      joinPassword: joinPassword.trim(),
    })

    setCreating(false)

    if (created.error || !created.fund) {
      setError(created.error || 'Could not create the live fund.')
      return
    }

    setStep(3)
    setCreationNotice(`Live fund created. Share code ${created.fund.fundCode} and your room password so other users can join.`)
    navigate('/dashboard')
  }

  const blueprint = result ?? DEFAULT_BLUEPRINT

  return (
    <div className="flex h-screen bg-surface">
      <Sidebar />

      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <header className="mb-10 max-w-4xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
              <Sparkles size={20} />
            </div>
            <span className="text-[10px] font-label font-black tracking-[0.2em] uppercase text-on-surface-variant opacity-60">AI Architect</span>
          </div>
          <h1 className="text-4xl font-headline font-bold text-on-surface mb-4">Create Fund</h1>
          <p className="text-on-surface-variant text-lg font-medium opacity-60">Tell ArthaNetra what your group is saving for, and let the AI architect the perfect structure.</p>
        </header>

        <div className="max-w-4xl">
          <div className="flex items-center gap-4 mb-12">
            <StepIndicator step={1} current={step} label="Intent" />
            <div className="w-12 h-px bg-white/10"></div>
            <StepIndicator step={2} current={step} label="Parameters" />
            <div className="w-12 h-px bg-white/10"></div>
            <StepIndicator step={3} current={step} label="DNA Launch" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-xs font-label uppercase tracking-widest text-on-surface-variant opacity-40">Describe your goal</label>
                <textarea
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. We are a group of 10 creators saving Rs 3,00,000 for a collaborative studio equipment upgrade over 12 months..."
                  className="w-full h-40 bg-surface-container-low border border-white/5 rounded-2xl p-6 text-on-surface text-lg font-medium focus:outline-none focus:border-primary/50 transition-all resize-none placeholder:text-on-surface-variant/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant opacity-40">Group Size</label>
                  <div className="flex items-center gap-3 bg-surface-container-low border border-white/5 rounded-xl px-4 py-3">
                    <Users size={16} className="text-primary" />
                    <input
                      type="number"
                      min={2}
                      value={groupSize}
                      onChange={(e) => setGroupSize(Math.max(2, Number(e.target.value) || 2))}
                      className="bg-transparent border-none w-full text-on-surface font-headline font-bold focus:outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant opacity-40">Duration</label>
                  <div className="flex items-center gap-3 bg-surface-container-low border border-white/5 rounded-xl px-4 py-3">
                    <Calendar size={16} className="text-primary" />
                    <select
                      value={durationMonths}
                      onChange={(e) => setDurationMonths(Number(e.target.value))}
                      className="bg-transparent border-none w-full text-on-surface font-headline font-bold focus:outline-none"
                    >
                      {DURATION_OPTIONS.map((months) => (
                        <option key={months} value={months}>
                          {months} Months
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {error ? <p className="text-sm text-red-300">{error}</p> : null}
              {creationNotice ? <p className="text-sm text-primary">{creationNotice}</p> : null}

              <button
                onClick={handleSynthesize}
                disabled={loading || !purpose.trim()}
                className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary py-5 rounded-2xl font-headline font-bold text-lg flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all group disabled:opacity-50 disabled:scale-100"
              >
                {loading ? 'Synthesizing...' : 'Synthesize Fund Blueprint'}
                <BrainCircuit size={20} className={cn('group-hover:rotate-12 transition-transform', loading && 'animate-spin')} />
              </button>

              <div className="rounded-2xl border border-white/5 bg-surface-container-low p-5 space-y-4">
                <div>
                  <label className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant opacity-40">Join Password</label>
                  <input
                    type="password"
                    value={joinPassword}
                    onChange={(event) => setJoinPassword(event.target.value)}
                    placeholder="Set a password other members must enter"
                    className="mt-2 w-full rounded-xl border border-white/10 bg-surface px-4 py-3 text-on-surface focus:outline-none focus:border-primary/50"
                  />
                </div>

                <button
                  onClick={handleCreateFund}
                  disabled={creating}
                  className="w-full rounded-2xl border border-primary/30 bg-primary/10 px-4 py-4 text-sm font-headline font-bold text-primary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {creating ? 'Creating Live Fund...' : 'Create Live Fund Room'}
                </button>

                {hasActiveFund ? (
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-on-surface">
                    <p className="font-headline font-bold mb-1">Current Live Fund</p>
                    <p>{state.fundName}</p>
                    <p className="text-primary mt-1">Code: {state.fundCode}</p>
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="mt-3 text-xs font-label uppercase tracking-widest text-primary"
                    >
                      Open dashboard
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="relative">
              <div className="sticky top-8">
                <section className="bg-surface-container-low rounded-3xl border border-white/5 p-8 relative overflow-hidden backdrop-blur-md">
                  <div className="absolute top-0 right-0 p-4">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-tertiary/10 border border-tertiary/20 text-tertiary text-[10px] font-label font-bold uppercase tracking-widest">
                      <Zap size={10} />
                      AI Prediction
                    </div>
                  </div>

                  <h3 className="text-xl font-headline font-bold mb-2">{blueprint.fundName}</h3>
                  <p className="text-sm text-on-surface-variant opacity-60 mb-8">{blueprint.summary}</p>

                  <div className="space-y-6">
                    <BlueprintItem
                      label="Target Pool"
                      value={blueprint.poolTotal}
                      icon={<Target size={16} />}
                    />
                    <BlueprintItem
                      label="Monthly Installment"
                      value={blueprint.monthlyInstallment}
                      icon={<Shield size={16} />}
                      sub="per member"
                    />
                    <div className="h-px bg-white/5"></div>
                    <div>
                      <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant opacity-40 mb-3">AI Risk Assessment</p>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: confidenceWidth }}
                            className="h-full bg-primary"
                          />
                        </div>
                        <span className="text-primary font-headline font-bold">{blueprint.riskLevel}</span>
                      </div>
                      <p className="text-[10px] text-on-surface-variant opacity-40 mt-2 italic">Confidence: {blueprint.confidence}</p>
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-label text-on-surface-variant opacity-40 uppercase tracking-widest">Projected Dividend</p>
                      <p className="text-xl font-headline font-black text-on-surface italic">~ {blueprint.dividendEstimate} <span className="text-xs font-medium opacity-40">/ mo</span></p>
                    </div>
                    <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-primary">
                      <ArrowRight size={24} />
                    </div>
                  </div>
                </section>

                <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-primary/10 blur-[100px] -z-10 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function parseMoney(value: string) {
  const digits = value.replace(/[^\d]/g, '')
  return Number(digits || '0')
}

function toPercent(value: string) {
  const match = value.match(/\d+/)
  return match ? `${Math.min(100, Math.max(0, Number(match[0])))}%` : '0%'
}

function StepIndicator({ step, current, label }: any) {
  const isActive = current === step
  const isPast = current > step

  return (
    <div className="flex items-center gap-3">
      <div className={cn(
        'w-8 h-8 rounded-full border flex items-center justify-center font-headline font-bold text-sm transition-all duration-500',
        isActive ? 'bg-primary text-on-primary border-primary shadow-[0_0_15px_rgba(196,192,255,0.3)]' :
        isPast ? 'bg-primary/20 text-primary border-primary/20' :
        'bg-white/5 text-on-surface-variant border-white/10'
      )}>
        {step}
      </div>
      <span className={cn(
        'text-xs font-label uppercase tracking-widest transition-colors duration-500',
        isActive ? 'text-on-surface font-bold' : 'text-on-surface-variant opacity-40'
      )}>{label}</span>
    </div>
  )
}

function BlueprintItem({ label, value, icon, sub }: any) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary border border-white/10">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant opacity-40">{label}</p>
        <div className="flex items-baseline gap-2">
          <h4 className="text-xl font-headline font-black">{value}</h4>
          {sub && <span className="text-[10px] text-on-surface-variant opacity-40">{sub}</span>}
        </div>
      </div>
    </div>
  )
}
