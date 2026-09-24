"use client"

import { Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { motion, Variants, AnimatePresence } from 'framer-motion'
import { useEffect, useState, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Footer } from '@/components/shared/Footer'
import Image from 'next/image'
import {
  ArrowRight,
  ChevronRight,
  Menu,
  X,
  Terminal,
  Bot,
  CheckCircle2,
  Sparkles,
  Send,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { InteractivePlayground } from '@/components/landing/InteractivePlayground'
import { InteractiveVisualizerTeaser } from '@/components/landing/InteractiveVisualizerTeaser'

import {
  featureCards,
  extraCards,
  trustItems,
  steps,
  mentorPoints,
  languages,
  visualizers,
  accentStyles,
} from './landing-data'

/* ─── Motion variants ──────────────────────────────────────────────────────── */
const reveal: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
}
const stagger: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}

const GOLD = 'bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 dark:from-amber-200 dark:via-amber-300 dark:to-orange-400 bg-clip-text text-transparent'

export default function LandingPage() {
  const t = useTranslations('Landing')
  const tNav = useTranslations('Navbar')
  const [user, setUser] = useState<User | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setUser(data?.user ?? null))
      .catch(() => setUser(null))
  }, [])

  const navLinks = [
    { label: t('nav.features'), href: '#features' },
    { label: t('nav.visualizers'), href: '#visualizers' },
    { label: t('nav.mentor'), href: '#mentor' },
    { label: t('nav.how'), href: '#how' },
  ]

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    const elem = document.getElementById(href.replace('#', ''))
    const container = containerRef.current
    if (!elem || !container) return
    const headerOffset = 96
    const offset =
      elem.getBoundingClientRect().top -
      container.getBoundingClientRect().top +
      container.scrollTop -
      headerOffset
    container.scrollTo({ top: offset, behavior: 'smooth' })
    setMobileMenuOpen(false)
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto overflow-x-hidden bg-background text-foreground scroll-smooth selection:bg-amber-400/30 relative"
    >
      {/* ── Ink canvas + warm/cool ambient glow ── */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/5 via-background to-background dark:from-[#11101a] dark:via-[#070709] dark:to-black" />
        <div className="absolute top-[-10%] right-[-5%] w-[45vw] h-[45vw] bg-amber-500/10 blur-[180px] rounded-full opacity-60 dark:opacity-100" />
        <div className="absolute top-[30%] left-[-10%] w-[40vw] h-[40vw] bg-blue-600/10 blur-[180px] rounded-full opacity-50 dark:opacity-100" />
        <div className="absolute bottom-[-10%] left-[30%] w-[45vw] h-[45vw] bg-indigo-700/10 blur-[200px] rounded-full opacity-50 dark:opacity-100" />
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
          style={{
            backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
            backgroundSize: '46px 46px',
            maskImage: 'radial-gradient(ellipse at top, black 30%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse at top, black 30%, transparent 75%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 250 250' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="flex flex-col relative z-0">
        {/* ── Header ── */}
        <header className="fixed top-0 left-0 right-0 z-50 pt-4 px-4 sm:px-6">
          <motion.div
            initial={{ y: -90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="max-w-6xl mx-auto rounded-2xl border border-border bg-card/85 dark:bg-black/60 backdrop-blur-xl shadow-lg dark:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.6)]"
          >
            <div className="px-4 sm:px-5 h-16 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2.5 group/logo">
                <Image src="/logo.png" alt="OlympLab" width={30} height={30} className="rounded-lg" />
                <span className="font-bold text-lg tracking-tight text-foreground group-hover/logo:text-amber-500 dark:group-hover/logo:text-amber-200 transition-colors">
                  OlympLab
                </span>
              </Link>

              <nav className="hidden md:flex items-center gap-1 bg-muted/40 border border-border rounded-full px-1.5 py-1.5">
                {navLinks.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={(e) => scrollToSection(e, item.href)}
                    className="text-sm font-medium px-3.5 py-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>

              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden md:flex items-center gap-2">
                  <LanguageSwitcher />
                  <ThemeToggle />
                </div>
                {user ? (
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl border border-amber-400/40 bg-amber-400/10 text-amber-700 dark:text-amber-100 hover:bg-amber-400/20 transition-colors"
                  >
                    <Terminal className="w-4 h-4" />
                    <span className="hidden sm:inline">{tNav('dashboard')}</span>
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block px-3"
                    >
                      {tNav('login')}
                    </Link>
                    <Link
                      href="/signup"
                      className="text-sm font-bold px-4 sm:px-5 py-2 rounded-xl bg-amber-400 text-black hover:bg-amber-300 transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      {tNav('signup')}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </>
                )}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-xl border border-border text-foreground/80 hover:text-foreground hover:bg-muted transition-colors"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {mobileMenuOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="md:hidden overflow-hidden border-t border-border px-5 py-5 space-y-5"
                >
                  <nav className="flex flex-col gap-4">
                    {navLinks.map((item) => (
                      <a
                        key={item.label}
                        href={item.href}
                        onClick={(e) => scrollToSection(e, item.href)}
                        className="text-base font-semibold text-foreground/80 hover:text-foreground transition-colors"
                      >
                        {item.label}
                      </a>
                    ))}
                  </nav>
                  <div className="pt-4 border-t border-border flex items-center justify-between">
                    <LanguageSwitcher />
                    <ThemeToggle />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </header>

        {/* ── Hero ── */}
        <section className="relative pt-36 md:pt-48 pb-16 md:pb-24 px-4">
          <motion.div
            initial="hidden"
            animate="show"
            variants={stagger}
            className="max-w-4xl mx-auto text-center relative z-10"
          >
            <motion.a
              variants={reveal}
              href="#features"
              onClick={(e) => scrollToSection(e, '#features')}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-4 py-1.5 text-xs sm:text-sm font-medium text-foreground/80 hover:border-amber-400/40 hover:text-foreground transition-colors mb-8"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400/70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
              </span>
              {t('badge')}
            </motion.a>

            <motion.h1
              variants={reveal}
              className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6"
            >
              <span className="block text-foreground">{t('heroTitle1')}</span>
              <span className={cn('block', GOLD)}>{t('heroTitle2')}</span>
            </motion.h1>

            <motion.p
              variants={reveal}
              className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto mb-9 leading-relaxed"
            >
              {t('heroSubtitle')}
            </motion.p>

            <motion.div variants={reveal} className="flex flex-col sm:flex-row justify-center items-center gap-3">
              <Link
                href={user ? '/dashboard' : '/signup'}
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-amber-400 text-black font-bold text-base hover:bg-amber-300 transition-all shadow-[0_0_40px_-8px_rgba(251,191,36,0.5)] hover:scale-[1.02] active:scale-[0.99]"
              >
                {t('startTraining')}
                <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a
                href="#features"
                onClick={(e) => scrollToSection(e, '#features')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-muted/60 border border-border text-foreground font-semibold text-base hover:bg-muted transition-colors"
              >
                {t('exploreFeatures')}
              </a>
            </motion.div>

            <motion.div
              variants={reveal}
              className="mt-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 font-mono text-xs sm:text-sm text-muted-foreground/70"
            >
              {languages.map((lang, i) => (
                <span key={lang} className="flex items-center gap-3">
                  {i > 0 && <span className="text-muted-foreground/40">·</span>}
                  <span className="hover:text-amber-500 dark:hover:text-amber-200 transition-colors">{lang}</span>
                </span>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* ── IDE Interactive Showcase ── */}
        <section className="px-4 pb-24 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="max-w-5xl mx-auto"
          >
            <InteractivePlayground />
          </motion.div>
        </section>

        {/* ── Trust strip ── */}
        <section className="relative z-10 border-y border-border bg-muted/20 py-10">
          <div className="max-w-5xl mx-auto px-6">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={stagger}
              className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-4"
            >
              {trustItems.map((key) => (
                <motion.div key={key} variants={reveal} className="text-center">
                  <div className={cn('text-2xl md:text-3xl font-black tracking-tight mb-1', GOLD)}>
                    {t(`trust.${key}Value`)}
                  </div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t(`trust.${key}`)}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" style={{ scrollMarginTop: 96 }} className="py-24 md:py-32 px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={reveal}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-5 text-foreground">
                {t('featuresHeading')} <span className={GOLD}>{t('featuresHeadingColor')}</span>
              </h2>
              <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">{t('featuresSub')}</p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={stagger}
              className="grid grid-cols-1 md:grid-cols-3 gap-5"
            >
              {featureCards.map((f) => {
                const a = accentStyles[f.accent]
                const Icon = f.icon
                return (
                  <motion.div
                    key={f.key}
                    variants={reveal}
                    className={cn(
                      'group relative overflow-hidden rounded-3xl border border-border bg-card/70 backdrop-blur-md p-7 transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-md',
                      a.hoverBorder,
                      a.glow,
                      f.span,
                    )}
                  >
                    <div
                      className={cn(
                        'absolute inset-0 bg-gradient-to-br to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500',
                        a.gradient,
                      )}
                    />
                    <div className="relative">
                      <div className={cn('inline-flex p-3 rounded-2xl border mb-5', a.icon)}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-2.5 tracking-tight">
                        {t(`features.${f.key}Title`)}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed text-[15px]">{t(`features.${f.key}Desc`)}</p>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>
        </section>

        {/* ── Visualizers ── */}
        <section id="visualizers" style={{ scrollMarginTop: 96 }} className="py-24 md:py-32 px-4 relative z-10 border-t border-border">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={reveal}>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-200 mb-6">
                <Sparkles className="w-3.5 h-3.5" /> {t('trust.visualizersValue')}
              </div>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-5 text-foreground">{t('visualizersHeading')}</h2>
              <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto mb-12">{t('visualizersSub')}</p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={stagger}
              className="flex flex-wrap justify-center gap-2.5 mb-14"
            >
              {visualizers.map((name) => (
                <motion.span
                  key={name}
                  variants={reveal}
                  className="rounded-xl border border-border bg-card/60 px-4 py-2 text-sm font-medium text-foreground/80 hover:border-amber-400/30 hover:text-foreground hover:bg-amber-400/10 transition-colors cursor-default"
                >
                  {name}
                </motion.span>
              ))}
              <motion.span
                variants={reveal}
                className="rounded-xl border border-dashed border-border px-4 py-2 text-sm font-medium text-muted-foreground"
              >
                {t('visualizersMore')}…
              </motion.span>
            </motion.div>

            {/* Interactive Live Teaser */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-left"
            >
              <InteractiveVisualizerTeaser />
            </motion.div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="how" style={{ scrollMarginTop: 96 }} className="py-24 md:py-32 px-4 relative z-10 border-t border-border">
          <div className="max-w-6xl mx-auto">
            <motion.h2
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={reveal}
              className="text-3xl md:text-5xl font-black tracking-tight text-center mb-16 text-foreground"
            >
              {t('howHeading')}
            </motion.h2>
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={stagger}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
            >
              {steps.map((n) => (
                <motion.div
                  key={n}
                  variants={reveal}
                  className="relative rounded-2xl border border-border bg-card/60 p-6 shadow-sm"
                >
                  <div className="text-5xl font-black text-foreground/[0.08] mb-3 leading-none">{`0${n}`}</div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{t(`how.step${n}Title`)}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{t(`how.step${n}Desc`)}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── AI mentor spotlight ── */}
        <section id="mentor" style={{ scrollMarginTop: 96 }} className="py-24 md:py-32 px-4 relative z-10 border-t border-border">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
              <motion.div
                variants={reveal}
                className="inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-700 dark:text-violet-200 mb-6"
              >
                <Bot className="w-3.5 h-3.5" /> {t('ide.mentorName')}
              </motion.div>
              <motion.h2 variants={reveal} className="text-3xl md:text-5xl font-black tracking-tight mb-5 text-foreground">
                {t('mentorHeading')}
              </motion.h2>
              <motion.p variants={reveal} className="text-muted-foreground text-base md:text-lg leading-relaxed mb-8">
                {t('mentorSub')}
              </motion.p>
              <ul className="space-y-4">
                {mentorPoints.map((key) => (
                  <motion.li key={key} variants={reveal} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-amber-500 dark:text-amber-300 shrink-0 mt-0.5" />
                    <span className="text-foreground/80">{t(key)}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="rounded-2xl border border-border bg-card p-6 shadow-2xl"
            >
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="w-9 h-9 rounded-lg bg-violet-500/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-violet-600 dark:text-violet-300" />
                </div>
                <div className="text-sm font-bold text-foreground">{t('ide.mentorName')}</div>
              </div>
              <div className="space-y-3 pt-4">
                <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-amber-400/10 border border-amber-400/20 px-4 py-2.5 text-sm text-amber-800 dark:text-amber-50">
                  {t('how.step3Title')}?
                </div>
                <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-muted/60 border border-border px-4 py-2.5 text-sm text-foreground/80 leading-relaxed">
                  {t('ide.mentorText')}
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <div className="flex-1 rounded-xl bg-muted/40 border border-border px-4 py-2.5 text-sm text-muted-foreground">
                    …
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-amber-400 flex items-center justify-center text-black">
                    <Send className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Extras ── */}
        <section className="py-20 px-4 relative z-10 border-t border-border">
          <div className="max-w-6xl mx-auto">
            <motion.h2
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={reveal}
              className="text-2xl md:text-3xl font-black tracking-tight text-center mb-12 text-foreground"
            >
              {t('extrasHeading')}
            </motion.h2>
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={stagger}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
            >
              {extraCards.map((f) => {
                const a = accentStyles[f.accent]
                const Icon = f.icon
                return (
                  <motion.div
                    key={f.key}
                    variants={reveal}
                    className={cn(
                      'rounded-2xl border border-border bg-card/60 p-6 transition-colors shadow-sm hover:shadow-md',
                      a.hoverBorder,
                    )}
                  >
                    <div className={cn('inline-flex p-2.5 rounded-xl border mb-4', a.icon)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-foreground mb-2">{t(`extras.${f.key}Title`)}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{t(`extras.${f.key}Desc`)}</p>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="py-28 md:py-36 px-4 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.h2 variants={reveal} className="text-4xl md:text-6xl font-black tracking-tight mb-8 text-foreground">
              {t('ctaTitle')} <span className={GOLD}>{t('ctaTitleColor')}</span>
            </motion.h2>
            <motion.div variants={reveal} className="flex justify-center">
              <Link
                href={user ? '/dashboard' : '/signup'}
                className="inline-flex items-center justify-center gap-2 px-9 py-4 rounded-xl bg-amber-400 text-black font-bold text-lg hover:bg-amber-300 transition-all hover:scale-[1.02] shadow-[0_0_50px_-10px_rgba(251,191,36,0.55)]"
              >
                {t('ctaBtn')}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
            <motion.p variants={reveal} className="text-muted-foreground mt-6 text-sm">
              {t('ctaSub')}
            </motion.p>
          </motion.div>
        </section>

        <Footer />
      </div>
    </div>
  )
}
