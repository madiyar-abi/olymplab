"use client"

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Footer } from '@/components/shared/Footer'
import { ArrowRight, Bot, Terminal, EyeOff, Map, BarChart3, CheckCircle2, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15 } }
}

export default function LandingPage() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [])

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden bg-background text-foreground selection:bg-primary/30 scroll-smooth">
      <div className="flex flex-col min-h-max">
      
      {/* ── Navbar ── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/70 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <Image src="/logo.png" alt="OlympLab" width={32} height={32} className="rounded-lg shadow-sm transition-shadow" />
            <span className="font-mono font-bold text-lg tracking-tight text-foreground group-hover:text-primary transition-colors">
              OlympLab
            </span>
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <Link href="/dashboard" className="text-sm font-bold px-5 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-sm flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
                  Sign in
                </Link>
                <Link href="/signup" className="text-sm font-bold px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-primary-foreground hover:from-blue-500 hover:to-indigo-500 transition-all duration-300 shadow-sm">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative pt-40 pb-24 md:pt-52 md:pb-32 overflow-hidden border-b border-white/5">
        {/* Abstract Background Grid */}
        <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.04]" 
             style={{ backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/10 blur-[150px] rounded-full pointer-events-none z-0" />
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-violet-500/10 blur-[150px] rounded-full pointer-events-none z-0" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none -z-10" />
        
        <div className="container relative z-10 mx-auto px-6 text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs sm:text-sm font-medium text-primary mb-10 backdrop-blur-md"
          >
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2.5 animate-pulse shadow-sm"></span>
            Version 2.0 is now live for advanced engineers
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter mb-8 font-sans leading-[1.1] text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/50"
          >
            Algorithmic Mastery,<br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-indigo-600">
              Systematically Built.
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground/80 leading-relaxed font-medium"
          >
            An elite ecosystem combining Socratic AI tutoring, Piston-powered live execution, and structured mathematical logic to forge top-tier software engineers.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="mt-12 flex flex-col sm:flex-row justify-center gap-4 sm:gap-6"
          >
            {!user && (
              <Link 
                href="/signup" 
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-primary-foreground font-bold text-base md:text-lg hover:from-blue-500 hover:to-indigo-500 hover:-translate-y-1 transition-all duration-300 shadow-sm group"
              >
                Start Your Training
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
            <Link 
              href={user ? "/dashboard" : "/login"}
              className={cn(
                "inline-flex items-center justify-center px-8 py-4 rounded-xl border font-bold text-base md:text-lg transition-all duration-300 backdrop-blur-md",
                user 
                  ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90 shadow-sm hover:-translate-y-1" 
                  : "bg-secondary/50 border-white/10 text-foreground hover:bg-secondary"
              )}
            >
              <Terminal className="w-5 h-5 mr-2 opacity-70" />
              Access Dashboard
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Main Content Container for proper vertical flow ── */}
      <div className="flex flex-col gap-20 mb-24">
        {/* ── Trust/Stats Banner ── */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="bg-white/5 border-y border-border backdrop-blur-md py-10 relative z-30"
        >          <div className="container mx-auto px-6">
            <div className="flex flex-wrap justify-around items-center gap-8">
              <div className="flex flex-col items-center text-center">
                <span className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">500+</span>
                <span className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold mt-1">Curated Problems</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <span className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">Zero-Lag</span>
                <span className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold mt-1">IDE</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <span className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">Structured</span>
                <span className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold mt-1">Syllabi</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <span className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">ICPC & IOI</span>
                <span className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold mt-1">Level</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Visual Break / Mockup Area ── */}
        <section className="relative z-20 px-6 mt-4">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-5xl mx-auto rounded-2xl border border-white/10 bg-card/80 backdrop-blur-xl shadow-2xl overflow-hidden"
          >
            {/* Mock Window Header */}
            <div className="h-10 bg-secondary/50 border-b border-white/5 flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <div className="ml-4 flex gap-2">
                <div className="h-4 w-32 bg-white/5 rounded-full" />
                <div className="h-4 w-24 bg-white/5 rounded-full" />
              </div>
            </div>
            {/* Mock Body */}
            <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 min-h-[300px]">
               <div className="flex-1 space-y-4">
                  <div className="h-6 w-1/3 bg-white/10 rounded-md" />
                  <div className="h-4 w-full bg-white/5 rounded-md" />
                  <div className="h-4 w-5/6 bg-white/5 rounded-md" />
                  <div className="h-4 w-4/6 bg-white/5 rounded-md" />
                  <div className="pt-4 space-y-2">
                    <div className="flex gap-2 items-center">
                      <Terminal className="w-4 h-4 text-primary" />
                      <div className="h-4 w-24 bg-primary/20 rounded-md" />
                    </div>
                    <div className="h-20 w-full bg-black/40 rounded-lg border border-white/5 p-3 font-mono text-xs text-white/40">
                      $ g++ solution.cpp -o solution -O3<br/>
                      $ ./solution &lt; input.txt<br/>
                      &gt; Execution time: 0.012s
                    </div>
                  </div>
               </div>
               <div className="flex-1 border-l border-white/5 pl-0 md:pl-6 space-y-4">
                  <div className="flex items-center gap-3">
                     <Bot className="w-6 h-6 text-violet-400" />
                     <div className="h-5 w-24 bg-violet-400/20 rounded-md" />
                  </div>
                  <div className="p-4 bg-violet-500/5 border border-violet-500/10 rounded-xl space-y-3">
                     <div className="h-3 w-full bg-white/10 rounded-full" />
                     <div className="h-3 w-5/6 bg-white/10 rounded-full" />
                     <div className="h-3 w-4/6 bg-white/10 rounded-full" />
                  </div>
                  <div className="p-4 bg-secondary/50 rounded-xl flex justify-end">
                     <div className="h-3 w-2/3 bg-primary/30 rounded-full" />
                  </div>
               </div>
            </div>
          </motion.div>
        </section>
      </div>

      {/* ── Features Bento Grid ── */}
      <section className="py-24 relative z-10 overflow-hidden">
        <div className="container mx-auto px-4 max-w-7xl">
          <motion.div 
            initial="hidden"
            whileInView="show"
            viewport={{ root: scrollRef, once: true, margin: "-100px" }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-sans font-bold tracking-tighter text-white mb-4 leading-tight">Engineered for Competitive Excellence</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Built by competitors, for competitors. Every feature is optimized for peak mental performance and algorithmic mastery.
            </p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="show"
            viewport={{ root: scrollRef, once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12"
          >
            {/* Card 1: IDE (Span 2) */}
            <motion.div 
              variants={fadeUp}
              className="md:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/20 group overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
              <Terminal className="w-12 h-12 text-primary mb-6" />
              <h3 className="text-2xl font-bold mb-4">Distraction-Free IDE</h3>
              <p className="text-muted-foreground/80 leading-relaxed text-lg max-w-xl">
                Write code in a lightning-fast, Monaco-powered editor with auto-formatting and Vim mode. No clutter, just you and the algorithm.
              </p>
            </motion.div>

            {/* Card 2: Spoiler Protection */}
            <motion.div 
              variants={fadeUp}
              className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/20 group"
            >
              <EyeOff className="w-12 h-12 text-violet-400 mb-6" />
              <h3 className="text-2xl font-bold mb-4">Spoiler Protection</h3>
              <p className="text-muted-foreground/80 leading-relaxed">
                Hide problem tags and difficulties to simulate real Olympiad conditions. Train your brain to identify patterns blindly.
              </p>
            </motion.div>

            {/* Card 3: Structured Roadmap */}
            <motion.div 
              variants={fadeUp}
              className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/20 group"
            >
              <Map className="w-12 h-12 text-emerald-400 mb-6" />
              <h3 className="text-2xl font-bold mb-4">Structured Roadmap</h3>
              <p className="text-muted-foreground/80 leading-relaxed">
                Don&apos;t solve randomly. Follow our expertly crafted Syllabi from basic arrays to advanced dynamic programming and graphs.
              </p>
            </motion.div>

            {/* Card 4: Analytics (Span 2) */}
            <motion.div 
              variants={fadeUp}
              className="md:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/20 group overflow-hidden relative"
            >
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl group-hover:bg-sky-500/10 transition-colors" />
              <BarChart3 className="w-12 h-12 text-sky-400 mb-6" />
              <h3 className="text-2xl font-bold mb-4">Deep Analytics & Submissions</h3>
              <p className="text-muted-foreground/80 leading-relaxed text-lg max-w-xl">
                Track your execution time, memory usage, and logic efficiency on every test case. Compare your solutions and climb the ranks.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Why OlympLab? Section ── */}
      <section className="py-24 bg-secondary/10 relative overflow-hidden border-t border-border">
        <div className="container mx-auto px-6 max-w-5xl">
          <motion.div 
            initial="hidden"
            whileInView="show"
            viewport={{ root: scrollRef, once: true }}
            variants={fadeUp}
            className="flex flex-col md:flex-row items-center gap-16"
          >
            <div className="flex-1 space-y-8">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Why OlympLab?</h2>
              <div className="space-y-6">
                {[
                  { title: "Built by competitors, for competitors.", desc: "Every pixel and feature is designed to eliminate friction during intense coding sessions and simulate real contest pressure." },
                  { title: "Strictly curated problem sets.", desc: "No low-quality or duplicate tasks. We only host high-signal problems from Codeforces, CSES, and ICPC that actually improve your skill." },
                  { title: "Premium UI/UX experience.", desc: "A dark, focused aesthetic that doesn't hurt your eyes after 10 hours of intense training. Professional-grade tools for professional-grade engineers." }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 group">
                    <div className="mt-1 bg-primary/10 p-1 rounded-full group-hover:bg-primary/20 transition-colors">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-foreground">{item.title}</h4>
                      <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex-1 w-full max-w-md relative">
              <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full" />
              <div className="relative border border-white/10 rounded-3xl p-1 bg-white/5 backdrop-blur-sm">
                <div className="bg-card rounded-[22px] p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                       <Shield className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-bold uppercase tracking-widest text-primary">The Standard</div>
                      <div className="text-lg font-bold">Uncompromising Quality</div>
                    </div>
                  </div>
                  <p className="text-muted-foreground italic mb-6 leading-relaxed">
                    &quot;OlympLab is the first platform that feels like it was actually made for serious competitive training, not just generic technical interview prep. The focus on rigor is unmatched.&quot;
                  </p>
                  <div className="flex items-center gap-3 border-t border-white/5 pt-6">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-primary/20" />
                    <div>
                      <div className="text-sm font-bold">Top 1% Global Engineer</div>
                      <div className="text-xs text-muted-foreground">ICPC World Finalist</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-32 relative border-t border-border">
        <div className="container mx-auto px-6 text-center max-w-4xl">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ root: scrollRef, once: true }}
            variants={fadeUp}
            className="space-y-10"
          >
            <h2 className="text-5xl md:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
              Ready to elevate your rating?
            </h2>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Link 
                href={user ? "/dashboard" : "/signup"} 
                className="inline-flex items-center justify-center px-10 py-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-primary-foreground font-bold text-xl hover:from-blue-500 hover:to-indigo-500 hover:-translate-y-1 transition-all duration-300 shadow-lg group"
              >
                Start Solving Now
                <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>
            <p className="text-muted-foreground font-medium text-lg">
              Free during the beta period. Join the elite algorithmic community.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <Footer />
      </div>
    </div>
  )
}
