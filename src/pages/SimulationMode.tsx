import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import * as THREE from 'three'
import { Sidebar } from '../components/Sidebar'
import {
  Play,
  RotateCcw,
  Settings2,
  Activity,
  Cpu,
  BarChart3,
  ArrowRight,
  ShieldAlert,
  Wallet,
  Gavel,
  Sparkles,
} from 'lucide-react'
import { cn } from '../utils/cn.ts'
import { useFund } from '../context/FundContext'

type ScenarioKey = 'custom' | 'winter' | 'liquidity' | 'shock'

type SimulationMetrics = {
  survivalRate: number
  yieldPotential: number
  reserveBuffer: number
  riskCoefficient: number
  payoutStability: number
  stressScore: number
  verdict: string
  cycleCurve: number[]
}

const SCENARIOS: Record<Exclude<ScenarioKey, 'custom'>, { label: string; turbulence: number; inflation: number; friction: number }> = {
  winter: { label: 'Economic Winter', turbulence: 78, inflation: 66, friction: 72 },
  liquidity: { label: 'Hyper-Liquidity', turbulence: 20, inflation: 18, friction: 24 },
  shock: { label: 'Default Shock', turbulence: 86, inflation: 42, friction: 90 },
}

export function SimulationMode() {
  const { state, contributionSummary } = useFund()
  const [scenario, setScenario] = useState<ScenarioKey>('custom')
  const [memberTurbulence, setMemberTurbulence] = useState(45)
  const [marketInflation, setMarketInflation] = useState(12)
  const [systemFriction, setSystemFriction] = useState(82)
  const [showCoach, setShowCoach] = useState(false)

  useEffect(() => {
    if (scenario === 'shock') {
      const timer = setTimeout(() => setShowCoach(true), 2000)
      return () => clearTimeout(timer)
    } else {
      setShowCoach(false)
    }
  }, [scenario])
  const simulation = useMemo(
    () =>
      runProjection({
        trustHealth: state.trustHealth,
        collectionRate: contributionSummary.collectionRate,
        poolAmount: state.auction.poolAmount,
        monthlyInstallment: state.monthlyInstallment,
        overdueCount: contributionSummary.overdueCount,
        graceCount: contributionSummary.graceCount,
        memberCount: state.members.length,
        turbulence: memberTurbulence,
        inflation: marketInflation,
        friction: systemFriction,
      }),
    [
      contributionSummary.collectionRate,
      contributionSummary.graceCount,
      contributionSummary.overdueCount,
      marketInflation,
      memberTurbulence,
      state.auction.poolAmount,
      state.members.length,
      state.monthlyInstallment,
      state.trustHealth,
      systemFriction,
    ],
  )

  const runSimulation = () => {
    setScenario('custom')
  }

  const applyScenario = (key: Exclude<ScenarioKey, 'custom'>) => {
    const preset = SCENARIOS[key]
    setScenario(key)
    setMemberTurbulence(preset.turbulence)
    setMarketInflation(preset.inflation)
    setSystemFriction(preset.friction)
  }

  const resetParameters = () => {
    setScenario('custom')
    setMemberTurbulence(45)
    setMarketInflation(12)
    setSystemFriction(82)
  }

  return (
    <div className="flex h-screen bg-surface">
      <Sidebar />

      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <header className="flex justify-between items-end mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-tertiary/10 border border-tertiary/20 text-tertiary">
                <Cpu size={20} />
              </div>
              <span className="text-[10px] font-label font-black tracking-[0.2em] uppercase text-on-surface-variant opacity-60">Three.js Predictive Engine</span>
            </div>
            <h1 className="text-3xl font-headline font-bold text-on-surface">Simulation Mode</h1>
            <p className="text-on-surface-variant font-medium opacity-60">Stress-test the live fund using a 3D scenario mesh driven by current collections, trust, and auction data.</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={resetParameters}
              className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-xs font-label uppercase tracking-widest"
            >
              <RotateCcw size={16} />
              Reset Parameters
            </button>
            <button
              onClick={runSimulation}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-tertiary text-on-tertiary font-headline font-bold text-sm shadow-lg shadow-tertiary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Play size={16} fill="currentColor" />
              Start Simulation
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <SimulationMesh
              memberCount={state.members.length}
              turbulence={memberTurbulence}
              inflation={marketInflation}
              friction={systemFriction}
              health={simulation.survivalRate}
            />

            <div className="grid grid-cols-2 xl:grid-cols-4 gap-6">
              <SimStat label="Survival Rate" value={`${simulation.survivalRate}%`} color="text-tertiary" />
              <SimStat label="Yield Potential" value={`${simulation.yieldPotential >= 0 ? '+' : ''}${simulation.yieldPotential.toFixed(1)}%`} />
              <SimStat label="Reserve Buffer" value={formatCurrency(simulation.reserveBuffer)} />
              <SimStat label="Risk Coefficient" value={simulation.riskCoefficient.toFixed(2)} color={simulation.riskCoefficient > 0.6 ? 'text-error' : 'text-on-surface'} />
            </div>

            <section className="bg-surface-container-low rounded-3xl border border-white/5 p-8">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 size={18} className="text-primary" />
                <h3 className="text-lg font-headline font-bold">12-Cycle Forecast</h3>
              </div>
              <div className="grid grid-cols-12 gap-2 items-end h-40">
                {simulation.cycleCurve.map((value, index) => (
                  <div key={index} className="flex flex-col items-center gap-2">
                    <div
                      className={cn(
                        'w-full rounded-t-md transition-all',
                        value >= 75 ? 'bg-tertiary/80' : value >= 50 ? 'bg-primary/70' : 'bg-error/70',
                      )}
                      style={{ height: `${Math.max(16, value)}%` }}
                    />
                    <span className="text-[10px] font-label opacity-40">{index + 1}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <div className="bg-surface-container-low rounded-3xl border border-white/5 p-8">
              <h3 className="text-sm font-label font-bold uppercase tracking-widest mb-8 flex items-center gap-2">
                <Settings2 size={16} />
                Parameter Forge
              </h3>

              <div className="space-y-8">
                <Slider
                  label="Member Turbulence"
                  value={memberTurbulence}
                  onChange={(value) => {
                    setScenario('custom')
                    setMemberTurbulence(value)
                  }}
                />
                <Slider
                  label="Market Inflation"
                  value={marketInflation}
                  onChange={(value) => {
                    setScenario('custom')
                    setMarketInflation(value)
                  }}
                />
                <Slider
                  label="System Friction"
                  value={systemFriction}
                  onChange={(value) => {
                    setScenario('custom')
                    setSystemFriction(value)
                  }}
                />
              </div>

              <div className="mt-12 space-y-4">
                <p className="text-[10px] font-label font-black uppercase opacity-40 mb-2">Scenario Blueprints</p>
                {Object.entries(SCENARIOS).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => applyScenario(key as Exclude<ScenarioKey, 'custom'>)}
                    className={cn(
                      'w-full text-left p-4 rounded-xl border transition-all group flex items-center justify-between',
                      scenario === key ? 'bg-primary/10 border-primary/30' : 'bg-white/5 border-white/5 hover:border-primary/50',
                    )}
                  >
                    <span className="text-sm font-bold opacity-80">{preset.label}</span>
                    <ArrowRight size={14} className="opacity-70 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-surface-container-low rounded-3xl border border-white/5 p-6 space-y-5">
              <MetricRow icon={<Wallet size={16} />} label="Live Collection Rate" value={`${contributionSummary.collectionRate}%`} />
              <MetricRow icon={<ShieldAlert size={16} />} label="Overdue Members" value={`${contributionSummary.overdueCount}`} />
              <MetricRow icon={<Gavel size={16} />} label="Auction Pool" value={formatCurrency(state.auction.poolAmount)} />
              <MetricRow icon={<Activity size={16} />} label="Trust Health" value={`${state.trustHealth}%`} />
            </div>

            <div className="bg-tertiary/10 border border-tertiary/20 rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-3 text-tertiary">
                <BarChart3 size={18} />
                <h4 className="text-xs font-label font-black uppercase tracking-widest">Predictive Verdict</h4>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed opacity-80">
                {simulation.verdict}
              </p>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <VerdictStat label="Payout Stability" value={`${simulation.payoutStability}%`} />
                <VerdictStat label="Stress Score" value={`${simulation.stressScore}%`} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Artificial Coach Bubble on Default Shock */}
      {showCoach && (
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="fixed bottom-10 right-10 z-50 max-w-sm rounded-3xl border border-primary/20 bg-surface-container-high p-6 shadow-2xl shadow-primary/20"
        >
          <div className="flex items-start gap-4">
            <div className="mt-1 rounded-full bg-primary/20 p-2 text-primary">
              <Sparkles size={20} />
            </div>
            <div>
              <h4 className="mb-2 text-sm font-headline font-bold text-on-surface">ChitMind AI Coach</h4>
              <p className="text-sm leading-relaxed text-on-surface-variant">
                I noticed Arjun defaulted on his payment. Don't worry, the Smart Contract automatically tapped into the Reserve Pool to cover his share. Your payout is safe and will arrive on schedule. 🛡️
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

function SimulationMesh({
  memberCount,
  turbulence,
  inflation,
  friction,
  health,
}: {
  memberCount: number
  turbulence: number
  inflation: number
  friction: number
  health: number
}) {
  const mountRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const width = mount.clientWidth
    const height = mount.clientHeight

    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x0f1322, 18, 34)

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
    camera.position.set(0, 1.2, 17)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    mount.innerHTML = ''
    mount.appendChild(renderer.domElement)

    const ambient = new THREE.AmbientLight(0xb8c4ff, 0.9)
    scene.add(ambient)

    const keyLight = new THREE.PointLight(0x8b7fff, 18, 80)
    keyLight.position.set(8, 8, 10)
    scene.add(keyLight)

    const fillLight = new THREE.PointLight(0x4dd7ff, 10, 60)
    fillLight.position.set(-10, -6, 8)
    scene.add(fillLight)

    const stress = (turbulence + inflation + friction) / 300
    const accentColor = health > 72 ? 0x6df7c1 : health > 48 ? 0x8b7fff : 0xff6f91

    const coreGeometry = new THREE.IcosahedronGeometry(2.7, 3)
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: accentColor,
      emissive: 0x18203a,
      emissiveIntensity: 0.8,
      metalness: 0.15,
      roughness: 0.18,
      transparent: true,
      opacity: 0.9,
      wireframe: false,
    })
    const core = new THREE.Mesh(coreGeometry, coreMaterial)
    scene.add(core)

    const wireGeometry = new THREE.IcosahedronGeometry(3.05, 1)
    const wireMaterial = new THREE.MeshBasicMaterial({
      color: 0xc2c9ff,
      wireframe: true,
      transparent: true,
      opacity: 0.22,
    })
    const wireShell = new THREE.Mesh(wireGeometry, wireMaterial)
    scene.add(wireShell)

    const ringGroup = new THREE.Group()
    const rings: THREE.Mesh[] = []
    ;[4.2, 5.6, 7.2].forEach((radius, index) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.05 + index * 0.015, 24, 160),
        new THREE.MeshBasicMaterial({
          color: index === 1 ? 0x4dd7ff : 0x8b7fff,
          transparent: true,
          opacity: 0.28 - index * 0.05,
        }),
      )
      ring.rotation.x = Math.PI / 2.6 + index * 0.35
      ring.rotation.y = index * 0.5
      ringGroup.add(ring)
      rings.push(ring)
    })
    scene.add(ringGroup)

    const nodeGroup = new THREE.Group()
    const nodes: THREE.Mesh[] = []
    const orbitRadius = 5.2

    for (let index = 0; index < Math.max(8, memberCount * 2); index += 1) {
      const node = new THREE.Mesh(
        new THREE.SphereGeometry(0.18 + (index % 3) * 0.04, 16, 16),
        new THREE.MeshStandardMaterial({
          color: health > 70 ? 0x70c6ff : 0xffb86b,
          emissive: 0x111122,
          metalness: 0.15,
          roughness: 0.4,
        }),
      )

      const angle = (index / Math.max(8, memberCount * 2)) * Math.PI * 2
      node.position.set(
        Math.cos(angle) * (orbitRadius + (index % 2) * 0.7),
        Math.sin(angle) * (orbitRadius - (index % 3) * 0.4),
        Math.sin(angle * 2.4) * 2.4,
      )
      nodeGroup.add(node)
      nodes.push(node)
    }

    scene.add(nodeGroup)

    const streamCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-6, -1, 0),
      new THREE.Vector3(-2, 3, 2.5),
      new THREE.Vector3(2, -3, -2.5),
      new THREE.Vector3(6, 1, 0),
    ])
    const stream = new THREE.Mesh(
      new THREE.TubeGeometry(streamCurve, 120, 0.06, 10, false),
      new THREE.MeshBasicMaterial({
        color: 0x61c7ff,
        transparent: true,
        opacity: 0.35,
      }),
    )
    stream.rotation.z = 0.2
    scene.add(stream)

    const starCount = 700
    const starPositions = new Float32Array(starCount * 3)
    for (let index = 0; index < starCount; index += 1) {
      starPositions[index * 3] = (Math.random() - 0.5) * 34
      starPositions[index * 3 + 1] = (Math.random() - 0.5) * 22
      starPositions[index * 3 + 2] = (Math.random() - 0.5) * 24
    }
    const starsGeometry = new THREE.BufferGeometry()
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xdde6ff,
      size: 0.055,
      transparent: true,
      opacity: 0.85,
    })
    const stars = new THREE.Points(starsGeometry, starsMaterial)
    scene.add(stars)

    const clock = new THREE.Clock()

    const animate = () => {
      const elapsed = clock.getElapsedTime()
      core.rotation.x = elapsed * 0.28
      core.rotation.y = elapsed * (0.36 + stress * 0.55)
      wireShell.rotation.x = -elapsed * 0.18
      wireShell.rotation.y = elapsed * 0.32
      ringGroup.rotation.z = elapsed * 0.08
      ringGroup.rotation.y = elapsed * 0.14
      nodeGroup.rotation.y = elapsed * 0.16
      nodeGroup.rotation.x = Math.sin(elapsed * 0.45) * 0.16
      stream.rotation.y = elapsed * 0.12
      stars.rotation.y = elapsed * 0.02
      stars.rotation.x = elapsed * 0.01
      core.scale.setScalar(1 + Math.sin(elapsed * 2.1) * 0.035 + stress * 0.08)
      keyLight.intensity = 14 + Math.sin(elapsed * 1.8) * 2 + stress * 8
      fillLight.intensity = 8 + Math.cos(elapsed * 1.4) * 1.5

      nodes.forEach((node, index) => {
        const baseAngle = (index / nodes.length) * Math.PI * 2
        const speed = 0.26 + stress * 0.6
        const radius = orbitRadius + Math.sin(elapsed * 0.8 + index) * (0.4 + stress * 1.4)
        node.position.x = Math.cos(baseAngle + elapsed * speed) * radius
        node.position.y = Math.sin(baseAngle + elapsed * speed * 0.9) * (radius - 0.8)
        node.position.z = Math.sin(baseAngle * 2 + elapsed * 1.4) * (1.7 + stress * 2.2)
        node.scale.setScalar(0.9 + Math.sin(elapsed * 2 + index) * 0.18)
      })

      rings.forEach((ring, index) => {
        ring.rotation.x += 0.001 + index * 0.0008
        ring.rotation.y += 0.0015 + stress * 0.002
      })

      renderer.render(scene, camera)
      frame = requestAnimationFrame(animate)
    }

    let frame = requestAnimationFrame(animate)

    const handleResize = () => {
      if (!mountRef.current) return
      const nextWidth = mountRef.current.clientWidth
      const nextHeight = mountRef.current.clientHeight
      camera.aspect = nextWidth / nextHeight
      camera.updateProjectionMatrix()
      renderer.setSize(nextWidth, nextHeight)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
      coreGeometry.dispose()
      coreMaterial.dispose()
      wireGeometry.dispose()
      wireMaterial.dispose()
      rings.forEach((ring) => {
        const geometry = ring.geometry as THREE.BufferGeometry
        const material = ring.material as THREE.Material
        geometry.dispose()
        material.dispose()
      })
      starsGeometry.dispose()
      starsMaterial.dispose()
      ;(stream.geometry as THREE.BufferGeometry).dispose()
      ;(stream.material as THREE.Material).dispose()
      mount.innerHTML = ''
    }
  }, [friction, health, inflation, memberCount, turbulence])

  return (
    <div className="h-[500px] bg-surface-container-low rounded-3xl border border-white/5 relative overflow-hidden group">
      <div ref={mountRef} className="absolute inset-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(139,127,255,0.18),_transparent_45%),radial-gradient(circle_at_bottom,_rgba(77,215,255,0.14),_transparent_35%)] pointer-events-none" />
      <div className="absolute top-6 left-6 p-4 rounded-2xl bg-surface-container-low/80 backdrop-blur-md border border-white/5">
        <div className="flex items-center gap-2 mb-2 text-tertiary animate-pulse">
          <Activity size={14} />
          <span className="text-[10px] font-label font-black uppercase tracking-widest">3D Stress Mesh</span>
        </div>
        <p className="text-xl font-headline font-black text-on-surface">{health}% survival</p>
      </div>
      <div className="absolute top-6 right-6 px-4 py-3 rounded-2xl bg-surface-container-low/75 backdrop-blur-md border border-white/5 text-right">
        <p className="text-[10px] font-label uppercase tracking-widest opacity-40 mb-1">Visual Mode</p>
        <p className="text-sm font-headline font-black text-primary">
          {health > 72 ? 'Stable Mesh' : health > 48 ? 'Adaptive Mesh' : 'Critical Mesh'}
        </p>
      </div>
    </div>
  )
}

function runProjection({
  trustHealth,
  collectionRate,
  poolAmount,
  monthlyInstallment,
  overdueCount,
  graceCount,
  memberCount,
  turbulence,
  inflation,
  friction,
}: {
  trustHealth: number
  collectionRate: number
  poolAmount: number
  monthlyInstallment: number
  overdueCount: number
  graceCount: number
  memberCount: number
  turbulence: number
  inflation: number
  friction: number
}): SimulationMetrics {
  const pressure = turbulence * 0.35 + inflation * 0.25 + friction * 0.4
  const memberPenalty = overdueCount * 8 + graceCount * 4
  const survivalRate = clamp(Math.round(trustHealth * 0.45 + collectionRate * 0.35 + (100 - pressure) * 0.2 - memberPenalty), 18, 99)
  const yieldPotential = Number((((poolAmount / Math.max(monthlyInstallment * memberCount, 1)) - 1) * 10 - pressure / 18).toFixed(1))
  const reserveBuffer = Math.max(0, Math.round(poolAmount * (survivalRate / 100) * 0.22))
  const riskCoefficient = Number((1 - survivalRate / 100 + pressure / 220).toFixed(2))
  const payoutStability = clamp(Math.round((survivalRate + collectionRate) / 2 - overdueCount * 6), 12, 99)
  const stressScore = clamp(Math.round(pressure + memberPenalty / 2 - trustHealth * 0.2), 5, 99)
  const cycleCurve = Array.from({ length: 12 }, (_, index) => {
    const wave = Math.sin(index * 0.9 + turbulence / 35) * 8
    const trend = survivalRate - index * (pressure / 40) + wave - overdueCount * 2
    return clamp(Math.round(trend), 10, 95)
  })

  let verdict = `Under the current live fund state, the protocol is projected to survive ${survivalRate}% of comparable stress cycles.`
  if (survivalRate < 55) {
    verdict = `The simulation flags a fragile setup. High friction and payment stress could destabilize the fund unless collections improve quickly.`
  } else if (survivalRate < 75) {
    verdict = `The fund remains viable, but the model shows moderate strain. Tight auction control and faster collections would improve payout stability.`
  } else if (yieldPotential > 0) {
    verdict = `The live fund configuration is resilient. Even under stress, it preserves payout stability and retains a useful dividend cushion.`
  }

  return {
    survivalRate,
    yieldPotential,
    reserveBuffer,
    riskCoefficient,
    payoutStability,
    stressScore,
    verdict,
    cycleCurve,
  }
}

function SimStat({ label, value, color = 'text-on-surface' }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-surface-container-low p-6 rounded-2xl border border-white/5">
      <p className="text-[10px] font-label uppercase tracking-widest opacity-40 mb-1">{label}</p>
      <p className={cn('text-2xl font-headline font-black', color)}>{value}</p>
    </div>
  )
}

function Slider({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center text-[10px] font-label font-black uppercase tracking-widest opacity-60">
        <span>{label}</span>
        <span className="text-primary">{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-[var(--color-primary,#a78bfa)]"
      />
    </div>
  )
}

function MetricRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 opacity-70">
        {icon}
        <span className="text-xs font-label font-bold uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-sm font-headline font-black">{value}</span>
    </div>
  )
}

function VerdictStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
      <p className="text-[10px] font-label uppercase tracking-widest opacity-40 mb-1">{label}</p>
      <p className="text-lg font-headline font-black">{value}</p>
    </div>
  )
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function formatCurrency(amount: number) {
  return `Rs ${amount.toLocaleString('en-IN')}`
}
