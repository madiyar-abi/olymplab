'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [step, setStep] = useState(1)
  const [subject, setSubject] = useState('')
  const [level, setLevel] = useState('')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id)
      } else {
        router.push('/login')
      }
    })
  }, [router, supabase])

  const handleFinish = async () => {
    if (!userId) return;
    setLoading(true)

    // Initialize mock skills based on subject and level for the MVP
    const initialSkills = subject === 'C++ Programming' 
      ? { logic: level === 'Beginner' ? 10 : level === 'Intermediate' ? 30 : 60, coding: level === 'Beginner' ? 15 : level === 'Intermediate' ? 40 : 70 }
      : { math: level === 'Beginner' ? 15 : level === 'Intermediate' ? 40 : 70, logic: level === 'Beginner' ? 10 : level === 'Intermediate' ? 30 : 50 };

    const { error } = await (supabase
      .from('profiles') as any)
      .update({
        primary_subject: subject,
        experience_level: level,
        skills: initialSkills
      })
      .eq('id', userId)

    if (error) {
      console.error('Error saving onboarding data:', error)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-card border border-border rounded-xl p-8 md:p-12 shadow-xl relative overflow-hidden transition-all duration-500">
        
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-secondary">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out" 
            style={{ width: `${(step / 3) * 100}%` }} 
          />
        </div>

        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-extrabold text-foreground mb-4 text-center font-mono">Select Core Discipline</h1>
            <p className="text-muted-foreground text-center mb-10">
              This calibrates the AI to construct your optimized algorithmic path.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['C++ Programming', 'Mathematics'].map((s) => (
                <button
                  key={s}
                  onClick={() => { setSubject(s); setStep(2); }}
                  className="p-8 rounded-xl border-2 border-border bg-secondary/30 hover:border-primary hover:bg-primary/5 text-xl font-bold text-foreground transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-extrabold text-foreground mb-4 text-center font-mono">Assess Proficiency</h1>
            <p className="text-muted-foreground text-center mb-10">
              Discipline: <span className="font-semibold text-primary">{subject}</span>
            </p>
            <div className="flex flex-col gap-4">
              {['Beginner', 'Intermediate', 'Pro'].map((l) => (
                <button
                  key={l}
                  onClick={() => { setLevel(l); setStep(3); }}
                  className="p-6 rounded-xl border-2 border-border bg-secondary/30 hover:border-primary hover:bg-primary/5 text-lg font-bold text-foreground transition-all"
                >
                  {l}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setStep(1)} 
              className="mt-8 text-sm text-muted-foreground hover:text-foreground mx-auto block"
            >
              ← Back
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-extrabold text-foreground mb-4 text-center font-mono">Calibration Protocol</h1>
            <p className="text-muted-foreground text-center mb-8">
              Execute the following test to configure baseline difficulty.
            </p>
            
            <div className="space-y-6">
              <div className="p-6 rounded-xl border border-border bg-card shadow-sm">
                <h3 className="font-bold text-foreground mb-4">
                  {subject === 'C++ Programming' ? 'Which data type is used to store integers in C++?' : 'What is the square root of 144?'}
                </h3>
                <div className="space-y-2">
                  {['A', 'B', 'C'].map((opt, i) => (
                    <label key={i} className="flex items-center p-3 rounded-lg border border-border hover:bg-secondary/50 cursor-pointer transition-colors">
                      <input type="radio" name="q1" className="mr-3 w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">
                        {subject === 'C++ Programming' 
                          ? ['int', 'float', 'string'][i] 
                          : ['12', '14', '10'][i]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-xl border border-border bg-card shadow-sm">
                <h3 className="font-bold text-foreground mb-4">
                  {subject === 'C++ Programming' ? 'Which loop checks the condition before execution?' : 'What is the factorial of 5 (5!)?'}
                </h3>
                <div className="space-y-2">
                  {['A', 'B', 'C'].map((opt, i) => (
                    <label key={i} className="flex items-center p-3 rounded-lg border border-border hover:bg-secondary/50 cursor-pointer transition-colors">
                      <input type="radio" name="q2" className="mr-3 w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">
                        {subject === 'C++ Programming' 
                          ? ['while', 'for', 'do-while'][i] 
                          : ['120', '25', '15'][i]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-between items-center">
              <button 
                onClick={() => setStep(2)} 
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ← Back
              </button>
              <button 
                onClick={handleFinish}
                disabled={loading}
                className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                {loading ? 'Configuring...' : 'Finalize Calibration'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
