import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export function Landing() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-start px-6 pt-24 pb-20 overflow-x-hidden overflow-y-auto">
      <div className="absolute inset-0 network-lines pointer-events-none"></div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"
      ></motion.div>

      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="absolute top-10 left-10 flex items-center gap-3"
      >
        <div className="relative w-12 h-12 flex items-center justify-center bg-surface-container-high rounded-full border border-white/10 shadow-[0_0_20px_rgba(196,192,255,0.15)]">
          <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>visibility</span>
          <div className="absolute -bottom-1 -right-1 bg-primary text-on-primary w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold">₹</div>
        </div>
        <span className="font-headline font-black text-primary tracking-tight text-xl">ArthaNetra</span>
      </motion.div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-4xl w-full mt-12">
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="font-headline text-[3.5rem] md:text-[5rem] leading-[1.2] font-extrabold tracking-tighter text-on-surface mb-6"
        >
          अर्थ को <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-container">देखो</span>
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-on-surface-variant text-lg md:text-xl font-medium max-w-xl leading-relaxed mb-12"
        >
          AI-governed chit funds that think, adapt, and protect your group. Secure your collective future with institutional precision.
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 w-full justify-center mb-16"
        >
          <Link
            to="/create"
            className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-10 py-5 rounded-full font-headline font-bold text-lg shadow-[0_0_15px_rgba(196,192,255,0.2)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer text-center"
          >
            Create a Fund
          </Link>
          <Link
            to="/dashboard"
            className="border border-outline-variant bg-surface-container-lowest/50 backdrop-blur-md text-primary px-10 py-5 rounded-full font-headline font-bold text-lg hover:bg-white/5 transition-all cursor-pointer text-center"
          >
            Join a Fund
          </Link>
        </motion.div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl"
        >
          <div className="bg-surface-container-low p-6 rounded-xl border border-white/5 backdrop-blur-sm flex flex-col items-center justify-center">
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-on-surface-variant text-sm font-label uppercase tracking-widest opacity-60">₹</span>
              <span className="text-3xl font-headline font-bold text-on-surface tabular-nums">2.4Cr</span>
            </div>
            <span className="text-xs font-label text-slate-400 tracking-wide">managed capital</span>
          </div>
          <div className="bg-surface-container-low p-6 rounded-xl border border-white/5 backdrop-blur-sm flex flex-col items-center justify-center">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-headline font-bold text-on-surface tabular-nums">1,240</span>
              <span className="material-symbols-outlined text-primary text-xl">verified_user</span>
            </div>
            <span className="text-xs font-label text-slate-400 tracking-wide">members trusted</span>
          </div>
          <div className="bg-surface-container-low p-6 rounded-xl border border-white/5 backdrop-blur-sm flex flex-col items-center justify-center">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-headline font-bold text-tertiary tabular-nums">98.2%</span>
            </div>
            <span className="text-xs font-label text-slate-400 tracking-wide">on-time contribution</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="relative mt-12 flex flex-col items-center gap-2 group cursor-pointer"
        >
          <span className="text-on-surface-variant font-label text-xs tracking-[0.2em] uppercase transition-colors group-hover:text-primary">How it works</span>
          <div className="w-px h-12 bg-gradient-to-b from-primary to-transparent"></div>
        </motion.div>
      </div>

      <div className="fixed top-0 right-0 w-[40vw] h-[400px] bg-primary/5 blur-[150px] -z-10 rounded-full"></div>
      <div className="fixed bottom-0 left-0 w-[40vw] h-[400px] bg-tertiary/5 blur-[150px] -z-10 rounded-full"></div>

      <div className="fixed inset-0 pointer-events-none opacity-10 mix-blend-soft-light overflow-hidden">
        <div className="w-full h-full bg-slate-400/10"></div>
      </div>
    </main>
  )
}
