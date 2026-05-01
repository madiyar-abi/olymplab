import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* ── Hero Section ── */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden border-b border-border">
        {/* Abstract Background Grid */}
        <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05]" 
             style={{ backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
        </div>
        
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full pointer-events-none z-0" />
        
        <div className="container relative z-10 mx-auto px-4 text-center">
          <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary mb-8 backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
            Now open for advanced researchers & engineers
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground mb-6 font-mono leading-tight">
            Where Abstract Math Meets <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              Algorithmic Precision
            </span>
          </h1>
          
          <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground leading-relaxed">
            OlympLab is the elite training ground for the next generation of software engineers. Master competitive programming through the lens of rigorous mathematical logic.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href="/signup" 
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:bg-primary/90 hover:scale-105 transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)]"
            >
              Start Your Training
            </Link>
            <Link 
              href="/login" 
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-secondary border border-border text-foreground font-bold text-lg hover:bg-secondary/80 transition-colors"
            >
              Access Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="py-24 bg-card relative z-10">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-mono">The OlympLab Philosophy</h2>
            <p className="text-muted-foreground text-lg">
              We treat computer science as a physical manifestation of mathematical logic. Our curriculum is built for absolute rigor and high performance.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-xl border border-border bg-background hover:border-primary/50 transition-colors group">
              <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3 font-mono">Categorized Catalog</h3>
              <p className="text-muted-foreground leading-relaxed">
                Filter by difficulty (Beginner to Mastery) and domain (Graph Theory, Calculus, Logic) to target precise algorithmic weaknesses.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-xl border border-border bg-background hover:border-primary/50 transition-colors group">
              <div className="w-12 h-12 rounded-lg bg-accent/10 text-accent flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3 font-mono">Structured Syllabi</h3>
              <p className="text-muted-foreground leading-relaxed">
                Progress through modules broken down into lessons, interactive proofs, and strict mastery milestones engineered by industry veterans.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-xl border border-border bg-background hover:border-primary/50 transition-colors group">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3 font-mono">Integrated IDE View</h3>
              <p className="text-muted-foreground leading-relaxed">
                A high-performance sandboxed environment for real-time code execution, deeply integrated with mathematical context and proofs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 text-center border-t border-border mt-auto">
        <p className="text-muted-foreground text-sm font-mono">
          &copy; {new Date().getFullYear()} OlympLab. Elite Engineering Training.
        </p>
      </footer>
    </div>
  )
}
