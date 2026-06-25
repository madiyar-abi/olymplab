"use client"

import { useEffect, useState, useSyncExternalStore } from 'react'
import { ProblemsClient, Problem } from '../ProblemsClient'
import { motion } from 'framer-motion'
import { Flag, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

import { EmptyState } from '@/components/ui/EmptyState'

const subscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

export default function FlaggedProblemsPage() {
  const [flaggedProblems, setFlaggedProblems] = useState<Problem[]>([])
  const [userId, setUserId] = useState<string | undefined>()
  const isMounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const supabase = createClient()

  useEffect(() => {
    const list = JSON.parse(localStorage.getItem('flagged_problems_list') || '[]')
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFlaggedProblems(list)

    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
    }
    fetchUser()
  }, [supabase])

  if (!isMounted) {
    return null
  }

  if (flaggedProblems.length === 0) {
    return (
      <EmptyState 
        title="No Flagged Problems Yet"
        description="Problems you bookmark for later review will appear here. Start exploring the catalog to find your next challenge."
        ctaText="Browse Problem Catalog"
        ctaHref="/dashboard/problems"
      />
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

        <ProblemsClient problems={flaggedProblems} hideHeader={true} userId={userId} />
      </div>
    </div>
  )
}
