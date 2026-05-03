"use client"

import { useEffect, useState, useSyncExternalStore } from 'react'
import { ProblemsClient, Problem } from '../ProblemsClient'
import { motion } from 'framer-motion'
import { Flag } from 'lucide-react'

const subscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

export default function FlaggedProblemsPage() {
  const [flaggedProblems, setFlaggedProblems] = useState<Problem[]>([])
  const isMounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  useEffect(() => {
    const list = JSON.parse(localStorage.getItem('flagged_problems_list') || '[]')
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFlaggedProblems(list)
  }, [])

  if (!isMounted) {
    return null
  }

  if (flaggedProblems.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mb-6 text-muted-foreground/80 shadow-md dark:shadow-zinc-950/50">
          <Flag className="w-10 h-10" strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2 font-mono">No Flagged Problems</h2>
        <p className="text-muted-foreground max-w-md font-mono text-sm">
          Bookmark problems while solving them to see them here later.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-full p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col gap-10">
        <motion.header 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
          className="flex items-end justify-between"
        >
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Flag className="w-6 h-6 text-amber-500 dark:text-amber-400 fill-amber-500/10 dark:fill-amber-400/20" />
              <h1 className="text-3xl font-bold text-foreground font-mono tracking-tight">Flagged Problems</h1>
            </div>
            <p className="text-muted-foreground font-medium">
              {flaggedProblems.length} bookmarked problems
            </p>
          </div>
        </motion.header>

        <ProblemsClient problems={flaggedProblems} hideHeader={true} />
      </div>
    </div>
  )
}
