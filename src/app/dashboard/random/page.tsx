export default function RandomProblemPage() {
  return (
    <div className="max-w-4xl mx-auto flex flex-col min-h-[calc(100vh-8rem)]">
      <header className="border-b border-border pb-6 mb-8">
        <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2 font-mono">
          // Randomized Execution
        </h1>
        <p className="text-muted-foreground font-mono text-sm">
          Trust the algorithm to select your next optimal challenge.
        </p>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-card border border-border rounded-xl shadow-sm text-center relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded bg-accent/5 blur-3xl" />
        
        <div className="relative z-10 max-w-md mx-auto space-y-8">
          <div className="w-24 h-24 mx-auto bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-6 border border-primary/20 shadow-[0_0_15px_rgba(37,99,235,0.2)]">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-3 font-mono">Initiate Auto-Select?</h2>
            <p className="text-muted-foreground leading-relaxed text-sm font-mono">
              The AI will parse your current skill matrix and provision a problem engineered to induce Flow State.
            </p>
          </div>
          
          <button className="w-full sm:w-auto px-10 py-3 rounded bg-primary text-primary-foreground font-mono font-bold text-sm hover:bg-primary/90 transition-all hover:scale-[1.02] shadow-[0_0_15px_rgba(37,99,235,0.4)]">
            EXECUTE
          </button>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-bold text-muted-foreground mb-4 font-mono uppercase tracking-widest">Previous Execution</h3>
        <div className="flex items-center p-4 bg-secondary/30 border border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
          <div className="w-10 h-10 rounded bg-green-500/10 flex items-center justify-center text-green-500 mr-4 border border-green-500/20">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-foreground font-mono">Binary Search Implementation</h4>
            <p className="text-[10px] text-muted-foreground mt-1 font-mono uppercase tracking-wider">
              Solved: 48h ago | Difficulty: Med
            </p>
          </div>
          <button className="px-4 py-1.5 text-xs font-mono font-medium rounded border border-border bg-card hover:bg-secondary transition-colors">
            View Source
          </button>
        </div>
      </div>
    </div>
  )
}
