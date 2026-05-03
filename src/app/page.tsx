"use client"

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight, Bot, Code2, PenTool, Terminal, Target, Library, Sparkles, BrainCircuit, Activity } from 'lucide-react'
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
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/50 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <Image src="/logo.png" alt="OlympLab" width={32} height={32} className="rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.3)] group-hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-shadow" />
            <span className="font-mono font-bold text-lg tracking-tight text-foreground group-hover:text-primary transition-colors">
              OlympLab
            </span>
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <Link href="/dashboard" className="text-sm font-bold px-5 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-[0_0_20px_rgba(37,99,235,0.15)] flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
                  Sign in
                </Link>
                <Link href="/signup" className="text-sm font-bold px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-[0_0_20px_rgba(37,99,235,0.15)] hover:shadow-[0_0_30px_rgba(37,99,235,0.4)]">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative pt-40 pb-24 md:pt-52 md:pb-32 overflow-hidden border-b border-border">
        {/* Abstract Background Grid */}
        <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.04]" 
             style={{ backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/10 blur-[150px] rounded-full pointer-events-none z-0" />
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-violet-500/10 blur-[150px] rounded-full pointer-events-none z-0" />
        
        <div className="container relative z-10 mx-auto px-6 text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs sm:text-sm font-medium text-primary mb-10 backdrop-blur-md"
          >
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2.5 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]"></span>
            Version 2.0 is now live for advanced engineers
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter text-foreground mb-8 font-sans leading-[1.1]"
          >
            Algorithmic Mastery,<br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-white via-white/90 to-white/40 dark:from-white dark:to-white/50">
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
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base md:text-lg hover:bg-primary/90 hover:-translate-y-1 transition-all duration-300 shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_40px_rgba(37,99,235,0.5)] group"
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
                  ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90 shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:-translate-y-1" 
                  : "bg-secondary/50 border-white/10 text-foreground hover:bg-secondary"
              )}
            >
              <Terminal className="w-5 h-5 mr-2 opacity-70" />
              Access Dashboard
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Visual Break / Mockup Area ── */}
      <section className="relative z-20 -mt-20 md:-mt-32 px-6">
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

      {/* ── Features Bento Grid ── */}
      <section className="py-32 relative z-10">
        <div className="container mx-auto px-6 max-w-6xl">
          <motion.div 
            initial="hidden"
            whileInView="show"
            viewport={{ root: scrollRef, once: true, margin: "-100px" }}
            variants={fadeUp}
            className="text-center mb-20"
          >
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">An Ecosystem of Excellence</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We replaced disjointed tools with a unified, high-performance platform engineered for absolute focus and skill progression.
            </p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="show"
            viewport={{ root: scrollRef, once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {/* Bento 1: Piston IDE (Large) */}
            <motion.div variants={fadeUp} className="lg:col-span-2 p-8 rounded-3xl bg-gradient-to-br from-card to-card/50 border border-white/10 hover:border-primary/30 transition-colors group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
              <Terminal className="w-10 h-10 text-primary mb-6" />
              <h3 className="text-2xl font-bold mb-3">Live Piston Execution Environment</h3>
              <p className="text-muted-foreground/80 leading-relaxed max-w-md">
                Write, compile, and test code instantly. Our integrated sandboxed engine supports C++ and Python with microsecond-level execution tracking and custom testcase validation. No local setup required.
              </p>
            </motion.div>

            {/* Bento 2: AI Mentor */}
            <motion.div variants={fadeUp} className="p-8 rounded-3xl bg-gradient-to-br from-card to-card/50 border border-white/10 hover:border-violet-500/30 transition-colors group relative overflow-hidden">
               <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-violet-500/10 rounded-full blur-2xl group-hover:bg-violet-500/20 transition-colors" />
              <BrainCircuit className="w-10 h-10 text-violet-400 mb-6" />
              <h3 className="text-xl font-bold mb-3">Socratic AI Mentor</h3>
              <p className="text-muted-foreground/80 leading-relaxed text-sm">
                Powered by Gemini. Our mentor follows George Polya&apos;s &quot;How to Solve It&quot; methodology. It never gives you the answer—it guides your intuition and logic until you solve it yourself.
              </p>
            </motion.div>

            {/* Bento 3: Syllabi */}
            <motion.div variants={fadeUp} className="p-8 rounded-3xl bg-gradient-to-br from-card to-card/50 border border-white/10 hover:border-emerald-500/30 transition-colors group relative overflow-hidden">
              <Library className="w-10 h-10 text-emerald-400 mb-6" />
              <h3 className="text-xl font-bold mb-3">Structured Syllabi</h3>
              <p className="text-muted-foreground/80 leading-relaxed text-sm">
                Progress through curated roadmaps from Introduction to Mastery. Each stage features interactive articles, embedded formulas, and hyper-targeted practice grids.
              </p>
            </motion.div>

            {/* Bento 4: Whiteboard */}
            <motion.div variants={fadeUp} className="p-8 rounded-3xl bg-gradient-to-br from-card to-card/50 border border-white/10 hover:border-amber-500/30 transition-colors group relative overflow-hidden">
              <PenTool className="w-10 h-10 text-amber-400 mb-6" />
              <h3 className="text-xl font-bold mb-3">Spatial Whiteboarding</h3>
              <p className="text-muted-foreground/80 leading-relaxed text-sm">
                Integrated Excalidraw instance. Sketch out complex graph structures, tree traversals, and dynamic programming state machines right next to your code.
              </p>
            </motion.div>

            {/* Bento 5: Progress (Wide) */}
            <motion.div variants={fadeUp} className="md:col-span-2 lg:col-span-1 p-8 rounded-3xl bg-gradient-to-br from-card to-card/50 border border-white/10 hover:border-sky-500/30 transition-colors group relative overflow-hidden">
              <Activity className="w-10 h-10 text-sky-400 mb-6" />
              <h3 className="text-xl font-bold mb-3">Activity Tracking</h3>
              <p className="text-muted-foreground/80 leading-relaxed text-sm">
                Visualize your consistency with GitHub-style contribution heatmaps. Track your accepted submissions and dominate the problem catalog layer by layer.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Methodology Spotlight ── */}
      <section className="py-32 bg-secondary/20 border-t border-border relative overflow-hidden">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary/5 blur-[120px] -translate-y-1/2 pointer-events-none" />
        <div className="container mx-auto px-6 max-w-5xl">
          <motion.div 
            initial="hidden"
            whileInView="show"
            viewport={{ root: scrollRef, once: true, margin: "-100px" }}
            variants={fadeUp}
            className="flex flex-col md:flex-row items-center gap-16"
          >
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center rounded-lg bg-white/5 px-3 py-1 text-sm font-medium text-muted-foreground">
                <Target className="w-4 h-4 mr-2 text-primary" />
                The Philosophy
              </div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Stop memorizing.<br/>Start reasoning.</h2>
              <p className="text-lg text-muted-foreground/80 leading-relaxed">
                Most platforms encourage grinding through thousands of problems to memorize patterns. OlympLab is built on absolute rigor. We treat computer science as a physical manifestation of mathematical logic. 
              </p>
              <ul className="space-y-4 mt-6">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-foreground/90">Deep conceptual understanding over raw syntax.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Code2 className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-foreground/90">Curated, high-signal problems instead of infinite noise.</span>
                </li>
              </ul>
            </div>
            
            {/* Right side visual element */}
            <div className="flex-1 w-full max-w-md relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-violet-500/20 blur-3xl rounded-full" />
              <div className="relative bg-card border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
                <div className="text-sm font-mono text-muted-foreground mb-4">Polya&apos;s Four Principles:</div>
                <div className="space-y-3">
                  {['1. Understand the Problem', '2. Devise a Plan', '3. Carry out the Plan', '4. Look Back & Review'].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-white/5">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span className="font-medium text-sm text-foreground/80">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-32 relative">
        <div className="container mx-auto px-6 text-center max-w-3xl">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ root: scrollRef, once: true, margin: "-50px" }}
            variants={fadeUp}
          >
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-8">Ready to elevate your code?</h2>
            {user ? (
              <Link 
                href="/dashboard" 
                className="inline-flex items-center justify-center px-10 py-5 rounded-2xl bg-primary text-primary-foreground font-bold text-lg hover:bg-primary/90 hover:-translate-y-1 transition-all duration-300 shadow-[0_0_40px_rgba(37,99,235,0.4)] group"
              >
                Go to Dashboard
                <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-2 transition-transform" />
              </Link>
            ) : (
              <Link 
                href="/signup" 
                className="inline-flex items-center justify-center px-10 py-5 rounded-2xl bg-primary text-primary-foreground font-bold text-lg hover:bg-primary/90 hover:-translate-y-1 transition-all duration-300 shadow-[0_0_40px_rgba(37,99,235,0.4)] group"
              >
                Access OlympLab Now
                <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-2 transition-transform" />
              </Link>
            )}
            <p className="mt-6 text-muted-foreground text-sm">
              Free during the beta period. Join the elite.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 text-center border-t border-border mt-auto bg-background">
        <p className="text-muted-foreground text-sm font-mono opacity-60">
          &copy; {new Date().getFullYear()} OlympLab. Built for absolute rigor.
        </p>
      </footer>
      </div>
    </div>
  )
}
