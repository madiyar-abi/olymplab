"use client"

import { Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { motion, Variants } from 'framer-motion'
import { useEffect, useState, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Footer } from '@/components/shared/Footer'
import Image from 'next/image'
import { ArrowRight, Terminal, Bot, CheckCircle2, Star, PlayCircle, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

import { stats, mainFeatures, bentoFeatures, testimonials, whyPoints } from './landing-data'

/* ─── Motion variants ──────────────────────────────────────────────────────── */
const reveal: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: "easeOut" } },
}
const stagger: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
}
const letterStagger: Variants = {
  hidden: { opacity: 0, y: 30, rotateX: -45 },
  show: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.6, ease: "easeOut" } },
}

export default function LandingPage() {
  const t = useTranslations('Navbar')
  const [user, setUser] = useState<User | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => setUser(user))
  }, [])

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const targetId = href.replace('#', '');
    const elem = document.getElementById(targetId);
    if (elem && containerRef.current) {
      // Calculate offsetTop manually to ignore any active CSS transforms (like y: 30)
      let top = elem.offsetTop;
      let parent = elem.offsetParent as HTMLElement;
      while (parent && parent !== containerRef.current) {
        top += parent.offsetTop;
        parent = parent.offsetParent as HTMLElement;
      }
      // Subtract 100px for the fixed header
      containerRef.current.scrollTo({ top: top - 100, behavior: 'smooth' });
    }
  };

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto overflow-x-hidden text-foreground scroll-smooth selection:bg-blue-500/30 relative">
      
      {/* ── Premium Gradient Background ── */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[#060814]">
        {/* Core deeply colored gradient backdrop */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-[#060814] to-black" />
        
        {/* Colorful large gradient meshes */}
        <div className="absolute inset-0 opacity-100">
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-600/40 blur-[130px] rounded-full animate-pulse" />
          <div className="absolute top-[30%] right-[-10%] w-[45vw] h-[45vw] bg-fuchsia-600/30 blur-[140px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute bottom-[-10%] left-[20%] w-[60vw] h-[60vw] bg-cyan-600/30 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '4s' }} />
        </div>
        
        {/* Animated Grid */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.07] bg-repeat [background-size:40px_40px] animate-[pulse_10s_ease-in-out_infinite]" />
        
        {/* High frequency noise overlay for texture */}
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.04] mix-blend-overlay" />
      </div>

      <div className="flex flex-col relative z-0">
        {/* ── Premium Glassmorphism Header ── */}
        <header className="fixed top-0 left-0 right-0 z-50 pt-4 px-4 sm:px-6">
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-7xl mx-auto rounded-2xl border border-white/10 bg-[#0A0A0A]/80 backdrop-blur-xl shadow-lg relative overflow-hidden group"
          >
            <div className="px-5 h-16 flex items-center justify-between relative z-10">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-3 group/logo">
                <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 p-[1px] overflow-hidden">
                  <div className="w-full h-full bg-[#0A0A0A] rounded-[10px] flex items-center justify-center relative z-10 overflow-hidden">
                    <Image src="/logo.png" alt="OlympLab" width={24} height={24} className="rounded-md" />
                  </div>
                </div>
                <span className="font-sans font-bold text-lg tracking-tight text-white group-hover/logo:text-blue-100 transition-all duration-300">
                  OlympLab
                </span>
              </Link>

              {/* Center nav pills */}
              <nav className="hidden md:flex items-center gap-1 bg-black/40 border border-white/10 rounded-full px-1.5 py-1.5 backdrop-blur-md">
                {[{ label: 'Features', href: '#features' }, { label: 'Curriculum', href: '#curriculum' }, { label: 'Wall of Fame', href: '#community' }].map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={(e) => scrollToSection(e, item.href)}
                    className="text-sm font-medium px-4 py-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300 ease-out"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>

              {/* CTA */}
              <div className="flex items-center gap-3">
                {user ? (
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 text-sm font-bold px-5 py-2 rounded-xl relative overflow-hidden border border-white/10 bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <Terminal className="w-4 h-4 text-blue-400" />
                    <span className="text-white">{t('dashboard')}</span>
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="text-sm font-medium text-white/70 hover:text-white transition-colors hidden sm:block px-4"
                    >
                      {t('login')}
                    </Link>
                    <Link
                      href="/signup"
                      className="relative text-sm font-bold px-6 py-2 rounded-xl overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all flex items-center gap-2 text-white"
                    >
                      {t('signup')}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </header>

        {/* ── Hero Section ── */}
        <section className="relative pt-40 md:pt-52 pb-20 md:pb-32 px-4 perspective-[2000px]">
          <motion.div
            className="max-w-5xl mx-auto text-center relative z-10 origin-bottom"
          >
            <motion.div
              initial="hidden"
              animate="show"
              variants={stagger}
            >
              <h1 className="text-6xl md:text-[88px] font-black tracking-tighter leading-[1.05] mb-8 font-sans perspective-[1000px]">
                <motion.span variants={letterStagger} className="text-white block pb-2 origin-bottom">Out-Code</motion.span>
                <motion.span variants={letterStagger} className="bg-gradient-to-br from-blue-400 via-indigo-300 to-violet-400 bg-clip-text text-transparent block origin-bottom">The Competition.</motion.span>
              </h1>

              <motion.p variants={reveal} className="text-lg md:text-2xl text-white/60 max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
                The ultimate OS for competitive programmers. Sub-50ms judge, AI-guided syllabi, and an IDE built to win.
              </motion.p>

              <motion.div variants={reveal} className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <Link
                  href={user ? '/dashboard' : '/signup'}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white text-black font-extrabold text-base hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-[0_0_30px_rgba(255,255,255,0.15)]"
                >
                  Start Training
                  <ChevronRight className="w-5 h-5" />
                </Link>
                <a 
                  href="#features" 
                  onClick={(e) => scrollToSection(e, '#features')} 
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white/10 border border-white/20 text-white font-bold text-base hover:bg-white/20 hover:border-white/30 transition-all duration-300 group"
                >
                  <PlayCircle className="w-5 h-5 text-white/70 group-hover:text-blue-400 group-hover:scale-110 transition-all" />
                  Watch Demo
                </a>
              </motion.div>
            </motion.div>
          </motion.div>
        </section>

        {/* ── Stats Banner ── */}
        <section className="relative z-10 border-y border-white/10 bg-white/[0.02] backdrop-blur-md py-12">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={stagger}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4"
            >
              {stats.map((s, i) => (
                <motion.div key={i} variants={reveal} className="flex flex-col items-center justify-center text-center group">
                  <div className="text-2xl mb-2 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500">
                    {s.icon}
                  </div>
                  <span className="text-3xl md:text-4xl font-black text-white tracking-tight mb-1">
                    {s.value}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
                    {s.label}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── Floating IDE Mockup ── */}
        <section className="py-32 px-4 relative z-10 perspective-[2000px]">
          <motion.div
            initial={{ opacity: 0, y: 80, rotateX: 10, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="max-w-6xl mx-auto relative"
          >
            {/* Background glow for mockup */}
            <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full scale-90 pointer-events-none animate-[pulse_4s_ease-in-out_infinite]" />
            
            <motion.div
              animate={{ y: [0, -10, 0], rotateX: [0, 2, 0], rotateY: [0, -1, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="relative rounded-2xl border border-white/20 bg-[#0A0A0A] shadow-[0_0_80px_rgba(0,0,0,0.5)] overflow-hidden transform-gpu"
            >
              {/* Window chrome */}
              <div className="h-12 bg-[#141414] border-b border-white/10 flex items-center px-4 justify-between">
                <div className="flex gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-red-500/90" />
                  <div className="w-3.5 h-3.5 rounded-full bg-yellow-500/90" />
                  <div className="w-3.5 h-3.5 rounded-full bg-green-500/90" />
                </div>
                <div className="flex bg-[#0A0A0A] rounded-lg border border-white/10 p-1">
                  <div className="px-3 py-1 rounded bg-white/10 text-[11px] font-mono text-white/90">solution.cpp</div>
                  <div className="px-3 py-1 text-[11px] font-mono text-white/50">input.txt</div>
                </div>
                <div className="w-16" /> {/* Spacer */}
              </div>
              
              {/* IDE Body Split */}
              <div className="flex flex-col md:flex-row h-[400px] md:h-[600px] bg-[#0A0A0A]">
                {/* Editor area */}
                <div className="flex-1 p-6 border-r border-white/10 font-mono text-[13px] leading-relaxed overflow-hidden relative bg-[#0A0A0A]">
                  <div className="flex items-center gap-4 text-white/50 text-[10px] uppercase tracking-widest mb-4 border-b border-white/10 pb-2">
                    <span className="text-blue-400">solution.cpp</span>
                    <span className="hover:text-white transition-colors cursor-pointer">CMakeLists.txt</span>
                  </div>
                  
                  {/* Code Lines */}
                  <div className="space-y-1">
                    <div><span className="text-blue-400">#include</span> <span className="text-emerald-400">&lt;iostream&gt;</span></div>
                    <div><span className="text-blue-400">#include</span> <span className="text-emerald-400">&lt;vector&gt;</span></div>
                    <div className="h-4"></div>
                    <div><span className="text-purple-400">using</span> <span className="text-purple-400">namespace</span> <span className="text-white">std</span>;</div>
                    <div className="h-4"></div>
                    <div>
                      <span className="text-purple-400">int</span> <span className="text-blue-300">main</span>() {'{'}
                    </div>
                    <div className="pl-6 border-l border-white/10 ml-1">
                      <div><span className="text-purple-400">int</span> <span className="text-white">n</span>, <span className="text-white">q</span>;</div>
                      <div><span className="text-blue-300">cin</span> <span className="text-purple-400">&gt;&gt;</span> n <span className="text-purple-400">&gt;&gt;</span> q;</div>
                      <div>vector&lt;<span className="text-purple-400">int</span>&gt; <span className="text-white">arr</span>(n);</div>
                      <div><span className="text-purple-400">for</span>(<span className="text-purple-400">int</span> i=0; i&lt;n; ++i) {'{'}</div>
                      <div className="pl-6 border-l border-white/10 ml-1">
                        <div><span className="text-blue-300">cin</span> <span className="text-purple-400">&gt;&gt;</span> arr[i];</div>
                      </div>
                      <div>{'}'}</div>
                      
                      {/* Animated typing line */}
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1, duration: 0.5 }}
                        className="flex items-center"
                      >
                        <div><span className="text-purple-400">return</span> <span className="text-orange-300">0</span>;</div>
                        <motion.div 
                          animate={{ opacity: [1, 0] }}
                          transition={{ repeat: Infinity, duration: 0.8 }}
                          className="w-2 h-4 bg-blue-500 ml-1"
                        />
                      </motion.div>
                    </div>
                    <div>{'}'}</div>
                  </div>
                </div>
                
                {/* Terminal / Output area */}
                <div className="w-full md:w-[400px] flex flex-col bg-[#050505] relative z-10">
                  <div className="p-4 border-b border-white/10 bg-[#0A0A0A]">
                    <div className="flex items-center gap-2 text-xs font-semibold text-white/70 uppercase tracking-wider">
                      <Terminal className="w-4 h-4" /> Integrated Terminal
                    </div>
                  </div>
                  <div className="p-4 font-mono text-[13px] text-green-400 space-y-3 flex-1 overflow-y-auto">
                    <div className="text-white/60">~ <span className="text-blue-400">$</span> g++ -O3 solution.cpp</div>
                    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 1.5 }} className="text-white/60">~ <span className="text-blue-400">$</span> ./a.out &lt; test_01.in</motion.div>
                    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 2.2 }} className="flex items-center gap-2 mt-4 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" /> 
                      Test 1 Passed (12ms)
                    </motion.div>
                    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 2.4 }} className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" /> 
                      Test 2 Passed (15ms)
                    </motion.div>
                  </div>
                  
                  {/* AI Mentor Widget */}
                  <div className="m-4 rounded-xl border border-violet-500/30 bg-violet-500/10 p-4 relative overflow-hidden group/ai">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-transparent opacity-0 group-hover/ai:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-3 mb-3 relative z-10">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/30 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-violet-300" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">AI Mentor</div>
                        <div className="text-[10px] text-violet-300 font-mono">Analyzing O(N) approach...</div>
                      </div>
                    </div>
                    <p className="text-xs text-white/80 leading-relaxed relative z-10">
                      Great start! To handle the range queries efficiently, consider precomputing a prefix sum array. This will reduce your query time from O(N) to O(1).
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* ── Features Bento Grid ── */}
        <section id="features" style={{ scrollMarginTop: '100px' }} className="py-32 px-4 relative z-10 border-t border-white/10">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial="hidden" whileInView="show" viewport={{ once: true }} variants={reveal}
              className="text-center mb-20"
            >
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-6 text-white">
                Engineered for <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">Excellence</span>
              </h2>
              <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto font-medium">
                Everything you need to reach Grandmaster, wrapped in a frictionless, premium interface.
              </p>
            </motion.div>

            <motion.div
              initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {mainFeatures.map((f, i) => (
                <motion.div
                  key={i}
                  variants={reveal}
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className={cn(
                    'relative overflow-hidden bg-[#0A0A0A] border border-white/10 rounded-3xl p-8',
                    'hover:border-white/30 transition-all duration-300 group z-10',
                    f.span
                  )}
                >
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                        {f.icon}
                      </div>
                      <span className={cn("text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border", f.badgeColor)}>
                        {f.badge}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">{f.title}</h3>
                    <p className="text-white/60 leading-relaxed font-medium">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── Additional Features Bento ── */}
        <section className="py-20 px-4 relative z-10">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {bentoFeatures.map((f, i) => (
                <motion.div
                  key={i}
                  variants={reveal}
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className={cn(
                    'relative overflow-hidden bg-[#0A0A0A] border border-white/10 rounded-3xl p-8',
                    'hover:border-white/30 transition-all duration-300 group z-10',
                    f.span,
                    f.glow
                  )}
                >
                  <div className="relative z-10">
                    <div className="mb-5">{f.icon}</div>
                    <h3 className="text-xl font-bold text-white mb-3 font-sans tracking-tight">{f.title}</h3>
                    <p className="text-white/60 leading-relaxed font-medium">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── Curriculum / Why OlympLab ── */}
        <section id="curriculum" style={{ scrollMarginTop: '100px' }} className="py-32 px-4 relative z-10 border-t border-white/10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-16 items-center">
              <motion.div 
                initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
                className="flex-1 space-y-10"
              >
                <motion.h2 variants={reveal} className="text-4xl md:text-5xl font-black tracking-tighter text-white">
                  Why Serious Competitors Choose Us
                </motion.h2>
                <div className="space-y-8">
                  {whyPoints.map((item, i) => (
                    <motion.div key={i} variants={reveal} className="flex items-start gap-5 group">
                      <div className={cn("mt-1 p-2 rounded-xl transition-transform group-hover:scale-110", item.color)}>
                        {item.icon}
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-white mb-2 tracking-tight">{item.title}</h4>
                        <p className="text-white/60 leading-relaxed font-medium">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="flex-1 w-full max-w-lg relative"
              >
                <div className="relative bg-[#0A0A0A] border border-white/20 rounded-3xl p-1 shadow-xl">
                  <div className="bg-[#050505] rounded-[22px] p-8 border border-white/10">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                        <Terminal className="w-7 h-7 text-blue-400" />
                      </div>
                      <div>
                        <div className="text-sm font-bold uppercase tracking-widest text-blue-400 mb-1">The Standard</div>
                        <div className="text-xl font-black text-white">Uncompromising Quality</div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 w-[92%]" />
                      </div>
                      <div className="flex justify-between text-xs font-bold text-white/50 uppercase tracking-wider">
                        <span>Platform Rigor</span>
                        <span className="text-blue-400">92% Match to Real Contests</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── Testimonials / Social Proof ── */}
        <section id="community" style={{ scrollMarginTop: '100px' }} className="pt-32 pb-0 px-4 relative z-10 border-t border-white/10">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial="hidden" whileInView="show" viewport={{ once: true }} variants={reveal}
              className="text-center mb-20"
            >
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-6 text-white">
                Trusted by the Elite
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-8 relative group hover:border-white/30 hover:shadow-xl z-10"
                >
                  <div className="relative z-10">
                    <div className="flex gap-1 mb-6">
                      {[...Array(t.rating)].map((_, j) => (
                        <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-white/80 italic mb-8 leading-relaxed font-medium">&quot;{t.quote}&quot;</p>
                    <div className="flex items-center gap-4">
                      <div className={cn("w-10 h-10 rounded-full bg-gradient-to-br", t.gradient)} />
                      <div>
                        <div className="text-white font-bold">{t.name}</div>
                        <div className="text-white/50 text-sm font-medium">{t.role}</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="pt-32 pb-40 px-4 relative z-10 overflow-hidden">
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.div
              initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
              className="space-y-10"
            >
              <motion.h2
                variants={reveal}
                className="text-5xl md:text-7xl font-black tracking-tighter text-white"
              >
                Ready to elevate your <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">rating?</span>
              </motion.h2>
              <motion.div variants={reveal} className="flex justify-center">
                <Link
                  href={user ? '/dashboard' : '/signup'}
                  className="inline-flex items-center justify-center gap-2 px-12 py-5 rounded-full bg-white text-black font-extrabold text-xl hover:scale-105 transition-all duration-300"
                >
                  Join OlympLab Free
                  <ArrowRight className="w-6 h-6" />
                </Link>
              </motion.div>
              <motion.p variants={reveal} className="text-white/60 font-medium text-lg">
                No credit card required. Start solving immediately.
              </motion.p>
            </motion.div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  )
}
