import { Activity } from 'lucide-react'

export default function ProgressPage() {
  const skills = [
    { name: 'Logic', value: 75, color: 'bg-blue-500' },
    { name: 'Mathematics', value: 60, color: 'bg-indigo-500' },
    { name: 'C++ Programming', value: 85, color: 'bg-violet-500' },
    { name: 'Algorithms', value: 45, color: 'bg-fuchsia-500' },
    { name: 'Graph Theory', value: 30, color: 'bg-rose-500' }
  ]

  const activities = [
    { text: "Solved 'Binary Search Implementation'", time: '2h ago', type: 'solve' },
    { text: "Initiated 'Graph Theory' Module", time: '5h ago', type: 'learn' },
    { text: "Achieved Global Rank: 1200", time: 'Yesterday', type: 'achievement' },
    { text: "Solved 'Two Sum Optimization'", time: 'Yesterday', type: 'solve' },
    { text: "Execution Streak: 5 Days", time: '2 days ago', type: 'streak' },
  ]

  return (
    <div className="min-h-full p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
      <header className="border-b border-border pb-6">
        <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2 font-mono flex items-center gap-3">
          <Activity className="w-8 h-8 text-primary" />
          Performance Analytics
        </h1>
        <p className="text-muted-foreground font-mono text-sm">
          Track mathematical proficiency and algorithmic mastery.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Skills Overview */}
        <section className="rounded-xl border border-border bg-card p-6 md:p-8 transition-all duration-500 ease-out hover:-translate-y-1 shadow-sm hover:shadow-md">
          <h2 className="text-lg font-bold text-foreground mb-6 flex items-center font-mono uppercase tracking-widest">
            <span className="text-primary mr-3 text-lg">■</span>
            Skill Mastery
          </h2>
          
          <div className="space-y-6">
            {skills.map(skill => (
              <div key={skill.name} className="space-y-2">
                <div className="flex justify-between text-sm font-semibold font-mono">
                  <span className="text-foreground">{skill.name}</span>
                  <span className="text-muted-foreground">{skill.value}.0</span>
                </div>
                <div className="h-1.5 w-full bg-secondary overflow-hidden border border-border/50">
                  <div 
                    className={`h-full transition-all duration-1000 ease-out ${skill.color}`}
                    style={{ width: `${skill.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="rounded-xl border border-border bg-card p-6 md:p-8 transition-all duration-500 ease-out hover:-translate-y-1 shadow-sm hover:shadow-md">
          <h2 className="text-lg font-bold text-foreground mb-6 flex items-center font-mono uppercase tracking-widest">
            <span className="text-primary mr-3 text-lg">▶</span>
            Execution Log
          </h2>
          
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-px before:bg-border">
            {activities.map((activity, index) => (
              <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded border border-border bg-background text-muted-foreground shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 shadow-sm">
                  <div className={`w-2 h-2 rounded-sm ${
                    activity.type === 'solve' ? 'bg-green-500 shadow-sm' :
                    activity.type === 'achievement' ? 'bg-yellow-500 shadow-sm' :
                    activity.type === 'streak' ? 'bg-accent shadow-sm' :
                    'bg-primary shadow-sm'
                  }`} />
                </div>
                
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-lg border border-border bg-secondary/30 group-hover:bg-secondary/80 transition-colors shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground font-mono">{activity.text}</span>
                    <span className="text-xs text-muted-foreground mt-1 font-mono opacity-80">[{activity.time}]</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      </div>
    </div>
  )
}
