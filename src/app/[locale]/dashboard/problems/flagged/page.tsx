"use client"

import { useEffect, useState, useSyncExternalStore } from 'react'
import { ProblemsClient, Problem } from '../ProblemsClient'
import { motion } from 'framer-motion'
import { Flag, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { EmptyState } from '@/components/ui/EmptyState'
import { useTranslations } from 'next-intl'

const subscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

export default function FlaggedProblemsPage() {
  const t = useTranslations('Flagged')
  const [flaggedProblems, setFlaggedProblems] = useState<Problem[]>([])
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set())
  const [userId, setUserId] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState(true)
  const isMounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const supabase = createClient()

  useEffect(() => {
    async function loadBookmarks() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setIsLoading(false)
          return
        }
        setUserId(user.id)

        // 1. Fetch cloud bookmarks from Supabase
        const { data: bookmarks } = await supabase
          .from('user_bookmarks')
          .select('problem_id')
          .eq('user_id', user.id)

        const ids = (bookmarks || []).map((b) => b.problem_id)

        // 2. Check and migrate legacy localStorage bookmarks if any exist
        try {
          const localList: Problem[] = JSON.parse(localStorage.getItem('flagged_problems_list') || '[]')
          if (localList.length > 0) {
            const localIds = localList.map(p => p.id)
            for (const pid of localIds) {
              if (!ids.includes(pid)) {
                await supabase.from('user_bookmarks').insert({ user_id: user.id, problem_id: pid })
                ids.push(pid)
              }
            }
            localStorage.removeItem('flagged_problems_list')
          }
        } catch (e) {
          console.warn('Could not migrate local bookmarks:', e)
        }

        if (ids.length === 0) {
          setFlaggedProblems([])
          setBookmarkedIds(new Set())
          setIsLoading(false)
          return
        }

        setBookmarkedIds(new Set(ids))

        // 3. Fetch full problem details for bookmarked IDs
        const { data: problemsData } = await supabase
          .from('problems')
          .select('id, title, difficulty, rating, requirements, tags')
          .in('id', ids)

        const mapped: Problem[] = (problemsData || []).map((p) => ({
          id: p.id,
          title: p.title,
          difficulty: p.difficulty,
          rating: p.rating,
          requirements: p.requirements,
          tags: Array.isArray(p.tags) && p.tags.length > 0 ? p.tags : [],
        }))

        setFlaggedProblems(mapped)
      } catch (err) {
        console.error('Error loading bookmarked problems:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadBookmarks()
  }, [supabase])

  if (!isMounted || isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
      </div>
    )
  }

  if (flaggedProblems.length === 0) {
    return (
      <div className="min-h-full p-8 max-w-7xl mx-auto w-full">
        <EmptyState 
          title={t('emptyTitle')}
          description={t('emptyDesc')}
          icon={Flag}
          ctaText={t('browse')}
          ctaHref="/dashboard/problems"
        />
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
              <Flag className="w-6 h-6 text-amber-500 fill-amber-500/20" />
              <h1 className="text-3xl font-bold text-foreground font-mono tracking-tight">{t('title')}</h1>
            </div>
            <p className="text-muted-foreground font-medium">
              {t('count', { count: flaggedProblems.length })}
            </p>
          </div>
        </motion.header>

        <ProblemsClient 
          problems={flaggedProblems} 
          hideHeader={true} 
          userId={userId} 
          initialBookmarkedIds={bookmarkedIds}
        />
      </div>
    </div>
  )
}
