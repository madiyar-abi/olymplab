"use client"

import { Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Footer } from '@/components/shared/Footer'
import { ArrowRight, Terminal, Bot, EyeOff, Map, BarChart3, CheckCircle2, Shield, Bug, Users, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ─── Motion variants ──────────────────────────────────────────────────────── */
const reveal = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
}
const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } },
}

/* ─── Data ─────────────────────────────────────────────────────────────────── */
const stats = [
  { value: '500+',       label: 'Curated Problems' },
  { value: 'Zero-Lag',   label: 'Monaco IDE'        },
  { value: 'Structured', label: 'Syllabi'            },
  { value: 'ICPC & IOI', label: 'Level Problems'    },
]

const bento = [
  {
    icon: <Shield className="w-7 h-7 text-indigo-400" />,
    title: 'Anti-Cheat Engine',
    desc: 'Real-time monitoring ensures submission integrity. Every solution is fingerprinted and cross-validated against known patterns.',
    span: 'md:col-span-2',
    accent: 'from-indigo-500/10',
  },
  {
    icon: <Bug className="w-7 h-7 text-cyan-400" />,
    title: 'Visual Debugger',
    desc: 'Step through your code line by line. Inspect variables and trace execution paths without leaving the browser.',
    span: '',
    accent: 'from-cyan-500/10',
  },
  {
    icon: <Users className="w-7 h-7 text-emerald-400" />,
    title: 'Community Solutions',
    desc: 'After solving, unlock top community submissions. Learn different approaches and paradigms from elite engineers.',
    span: '',
    accent: 'from-emerald-500/10',
  },
  {
    icon: <Sun className="w-7 h-7 text-amber-400" />,
    title: 'Daily Challenges',
    desc: 'A fresh algorithmic challenge every day. Build consistency and track your weekly growth streak on the leaderboard.',
    span: 'md:col-span-2',
    accent: 'from-amber-500/10',
  },
]

const mainFeatures = [
  {
    icon: <Terminal className="w-10 h-10 text-primary" />,
    title: 'Distraction-Free IDE',
    desc: 'Write code in a lightning-fast, Monaco-powered editor with auto-formatting and Vim mode. No clutter — just you and the algorithm.',
    span: 'md:col-span-2',
  },
  {
    icon: <EyeOff className="w-10 h-10 text-violet-400" />,
    title: 'Spoiler Protection',
    desc: 'Hide tags and difficulties to simulate real Olympiad conditions. Train your brain to identify patterns blindly.',
    span: '',
  },
  {
    icon: <Map className="w-10 h-10 text-emerald-400" />,
    title: 'Structured Roadmap',
    desc: "Don't solve randomly. Follow expertly crafted Syllabi from arrays to advanced DP and graphs.",
    span: '',
  },
  {
    icon: <BarChart3 className="w-10 h-10 text-sky-400" />,
    title: 'Deep Analytics',
    desc: 'Track execution time, memory usage, and logic efficiency on every test case. Compare solutions and climb the ranks.',
    span: 'md:col-span-2',
  },
]

/* ─── Component ────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const t = useTranslations('Navbar')
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => setUser(user))
  }, [])

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden bg-[#0B0D12] text-foreground scroll-smooth selection:bg-primary/30">
      {/* ── Ambient background globs ── */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-primary/8 blur-[180px] rounded-full" />
        <div className="absolute top-[40%] right-[-150px] w-[500px] h-[500px] bg-violet-600/8 blur-[140px] rounded-full" />
        <div className="absolute bottom-[20%] left-[-100px] w-[400px] h-[400px] bg-cyan-600/6 blur-[130px] rounded-full" />
      </div>

      <div className="flex flex-col">
        {/* ── Navbar ── */}
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0B0D12]/70 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <Image src="/logo.png" alt="OlympLab" width={30} height={30} className="rounded-lg transition-opacity group-hover:opacity-80" />
              <span className="font-mono font-bold text-lg tracking-tight text-foreground group-hover:text-primary transition-colors">
                OlympLab
              </span>
            </Link>
            <div className="flex items-center gap-4">
              {user ? (
                <Link href="/dashboard" className="flex items-center gap-2 text-sm font-bold px-5 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-white transition-all duration-300">
                  <Terminal className="w-4 h-4" /> {t('dashboard')}
                </Link>
              ) : (
                <>
                  <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
                    {t('login')}
                  </Link>
                  <Link href="/signup" className="text-sm font-bold px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 transition-all duration-300">
                    {t('signup')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>

        {/* ── Hero ── */}
        <section className="relative pt-40 pb-32 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-8 leading-[0.9]">
                <span className="block text-white">Master the</span>
                <span className="block bg-gradient-to-r from-primary via-blue-400 to-indigo-400 bg-clip-text text-transparent">Algorithm.</span>
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-lg md:text-xl text-white/40 max-w-2xl mx-auto mb-12 font-medium leading-relaxed"
            >
              The ultimate training ground for competitive programmers. Integrated IDE, 
              expert syllabi, and AI-powered mentorship to take you from 0 to Master.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
              className="flex flex-col sm:flex-row justify-center gap-4"
            >
              {!user && (
                <Link href="/signup" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-base hover:from-blue-500 hover:to-indigo-500 hover:-translate-y-0.5 transition-all duration-300 shadow-lg shadow-blue-500/20 group">
                  {t('signup')}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
              <Link
                href={user ? '/dashboard' : '/login'}
                className={cn(
                  'inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border font-bold text-base transition-all duration-300',
                  user
                    ? 'bg-primary text-white border-primary hover:bg-primary/90 shadow-lg shadow-primary/20 hover:-translate-y-0.5'
                    : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                )}
              >
                <Terminal className="w-5 h-5 opacity-70" />
                {t('dashboard')}
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ── Stats Banner ── */}
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
          className="border-y border-white/5 bg-white/[0.02] backdrop-blur-md py-14"
        >
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-wrap justify-around items-center gap-10">
              {stats.map((s) => (
                <motion.div key={s.value} variants={reveal} className="flex flex-col items-center text-center">
                  <span className="text-3xl md:text-4xl font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    {s.value}
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.2em] text-white/40 font-bold mt-1.5">{s.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ── Floating IDE Mockup ── */}
        <section className="py-24 px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: 'easeOut' }}
          >
            <motion.div
              animate={{ y: [0, -14, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="max-w-5xl mx-auto rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-xl shadow-2xl shadow-black/60 overflow-hidden"
            >
              {/* Window chrome */}
              <div className="h-10 bg-white/[0.03] border-b border-white/5 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
                <div className="ml-4 flex gap-2">
                  <div className="h-4 w-32 bg-white/5 rounded-full" />
                  <div className="h-4 w-20 bg-white/5 rounded-full" />
                </div>
              </div>
              {/* Body */}
              <div className="p-8 flex flex-col md:flex-row gap-8 min-h-[280px]">
                <div className="flex-1 space-y-3">
                  <div className="h-5 w-2/5 bg-white/10 rounded-md" />
                  <div className="h-3.5 w-full bg-white/5 rounded-md" />
                  <div className="h-3.5 w-5/6 bg-white/5 rounded-md" />
                  <div className="h-3.5 w-4/6 bg-white/5 rounded-md" />
                  <div className="pt-4 space-y-2">
                    <div className="flex gap-2 items-center">
                      <Terminal className="w-4 h-4 text-primary" />
                      <div className="h-3.5 w-24 bg-primary/20 rounded-md" />
                    </div>
                    <div className="h-20 w-full bg-black/40 rounded-xl border border-white/5 p-3 font-mono text-xs text-white/35">
                      $ g++ solution.cpp -o sol -O3<br />
                      $ ./sol &lt; input.txt<br />
                      &gt; Execution time: 0.012s ✓
                    </div>
                  </div>
                </div>
                <div className="flex-1 border-l border-white/5 pl-8 space-y-4">
                  <div className="flex items-center gap-3">
                    <Bot className="w-6 h-6 text-violet-400" />
                    <div className="h-4 w-24 bg-violet-400/20 rounded-md" />
                  </div>
                  <div className="p-4 bg-violet-500/5 border border-violet-500/10 rounded-xl space-y-2.5">
                    <div className="h-2.5 w-full bg-white/10 rounded-full" />
                    <div className="h-2.5 w-5/6 bg-white/10 rounded-full" />
                    <div className="h-2.5 w-4/6 bg-white/10 rounded-full" />
                  </div>
                  <div className="p-4 bg-white/[0.03] rounded-xl flex justify-end">
                    <div className="h-2.5 w-2/3 bg-primary/25 rounded-full" />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* ── Main Features Bento ── */}
        <section className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} variants={reveal}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter font-sans bg-gradient-to-br from-white via-white to-white/40 bg-clip-text text-transparent mb-4 leading-tight">
                Engineered for Competitive Excellence
              </h2>
              <p className="text-white/40 text-lg max-w-2xl mx-auto">
                Built by competitors, for competitors. Every feature optimized for peak performance.
              </p>
            </motion.div>

            <motion.div
              initial="hidden" whileInView="show" viewport={{ once: true, margin: '-50px' }} variants={stagger}
              className="grid grid-cols-1 md:grid-cols-3 gap-5"
            >
              {mainFeatures.map((f) => (
                <motion.div
                  key={f.title}
                  variants={reveal}
                  className={cn(
                    'bg-white/[0.03] border border-white/5 backdrop-blur-xl rounded-3xl p-8',
                    'hover:bg-white/[0.06] hover:-translate-y-1 hover:border-white/10 transition-all duration-500 group',
                    f.span
                  )}
                >
                  <div className="mb-6">{f.icon}</div>
                  <h3 className="text-xl font-bold text-white mb-3 font-sans">{f.title}</h3>
                  <p className="text-white/40 leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── New Bento Features ── */}
        <section className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} variants={reveal}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter font-sans bg-gradient-to-br from-white via-white to-white/40 bg-clip-text text-transparent mb-4 leading-tight">
                Every Tool You Need to Win
              </h2>
              <p className="text-white/40 text-lg max-w-2xl mx-auto">
                From integrity enforcement to daily habits — OlympLab is the complete competitive programming OS.
              </p>
            </motion.div>

            <motion.div
              initial="hidden" whileInView="show" viewport={{ once: true, margin: '-50px' }} variants={stagger}
              className="grid grid-cols-1 md:grid-cols-3 gap-5"
            >
              {bento.map((f) => (
                <motion.div
                  key={f.title}
                  variants={reveal}
                  className={cn(
                    'relative overflow-hidden bg-white/[0.03] border border-white/5 backdrop-blur-xl rounded-3xl p-8',
                    'hover:bg-white/[0.06] hover:-translate-y-1 hover:border-white/10 transition-all duration-500',
                    f.span
                  )}
                >
                  <div className={cn('absolute inset-0 bg-gradient-to-br to-transparent opacity-60', f.accent)} />
                  <div className="relative">
                    <div className="mb-5">{f.icon}</div>
                    <h3 className="text-xl font-bold text-white mb-3 font-sans">{f.title}</h3>
                    <p className="text-white/40 leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── Why OlympLab ── */}
        <section className="py-24 px-6 border-t border-white/5">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
              className="flex flex-col md:flex-row items-center gap-20"
            >
              <motion.div variants={reveal} className="flex-1 space-y-8">
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter font-sans bg-gradient-to-br from-white via-white to-white/40 bg-clip-text text-transparent">
                  Why OlympLab?
                </h2>
                <div className="space-y-6">
                  {[
                    { title: 'Built by competitors, for competitors.', desc: 'Every pixel is designed to eliminate friction during intense coding sessions and simulate real contest pressure.' },
                    { title: 'Strictly curated problem sets.', desc: 'Only high-signal problems from Codeforces, CSES, and ICPC that actually sharpen your skill.' },
                    { title: 'Premium UI/UX experience.', desc: 'A dark, focused aesthetic that doesn\'t hurt your eyes after 10 hours of intense training.' },
                  ].map((item, i) => (
                    <motion.div key={i} variants={reveal} className="flex items-start gap-4 group">
                      <div className="mt-1 bg-primary/10 p-1 rounded-full group-hover:bg-primary/20 transition-colors shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white mb-1 font-sans">{item.title}</h4>
                        <p className="text-white/40 leading-relaxed">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div variants={reveal} className="flex-1 w-full max-w-md">
                <div className="relative border border-white/8 rounded-3xl p-1 bg-white/[0.02] backdrop-blur-sm">
                  <div className="bg-[#14171F] rounded-[22px] p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-widest text-primary">The Standard</div>
                        <div className="text-base font-bold text-white">Uncompromising Quality</div>
                      </div>
                    </div>
                    <p className="text-white/40 italic mb-6 leading-relaxed text-sm">
                      &quot;OlympLab is the first platform that feels like it was made for serious competitive training — not generic interview prep. The rigor is unmatched.&quot;
                    </p>
                    <div className="flex items-center gap-3 border-t border-white/5 pt-6">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600" />
                      <div>
                        <div className="text-sm font-bold text-white">Top 1% Global Engineer</div>
                        <div className="text-xs text-white/40">ICPC World Finalist</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="py-32 px-6 border-t border-white/5">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
              className="space-y-10"
            >
              <motion.h2
                variants={reveal}
                className="text-5xl md:text-7xl font-extrabold tracking-tighter font-sans bg-gradient-to-br from-white via-white to-white/40 bg-clip-text text-transparent"
              >
                Ready to elevate your rating?
              </motion.h2>
              <motion.div variants={reveal} className="flex flex-col sm:flex-row justify-center gap-5">
                <Link
                  href={user ? '/dashboard' : '/signup'}
                  className="inline-flex items-center justify-center gap-2 px-10 py-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xl hover:from-blue-500 hover:to-indigo-500 hover:-translate-y-0.5 transition-all duration-300 shadow-xl shadow-blue-500/20 group"
                >
                  Start Solving Now
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1.5 transition-transform" />
                </Link>
              </motion.div>
              <motion.p variants={reveal} className="text-white/35 font-medium text-lg">
                Free during the beta period. Join the elite algorithmic community.
              </motion.p>
            </motion.div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  )
}
