"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'

type Submission = Database['public']['Tables']['submissions']['Row']

export interface LiveSubmission {
  status: string
  current_test: number | null
  verdict: string | null
  time_ms: number | null
  memory_kb: number | null
}

export function useSubmissionRealtime(submissionId: string | null) {
  const [submission, setSubmission] = useState<LiveSubmission | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!submissionId) return

    // 1. Fetch initial state
    const fetchInitialState = async () => {
      const { data, error: fetchError } = await (supabase
        .from('submissions')
        .select('status, test_case, verdict, time_ms, memory_kb')
        .eq('id', submissionId)
        .single() as unknown as Promise<{ data: Submission | null; error: { message: string } | null }>)

      if (fetchError) {
        console.error('Error fetching initial submission state:', fetchError)
        setError(new Error(fetchError.message))
      } else if (data) {
        setSubmission({
          status: data.status,
          current_test: data.test_case,
          verdict: data.verdict,
          time_ms: data.time_ms,
          memory_kb: data.memory_kb,
        })
      }
    }

    fetchInitialState()

    // 2. Subscribe to real-time updates
    const channel = supabase
      .channel(`submission-updates-${submissionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'submissions',
          filter: `id=eq.${submissionId}`,
        },
        (payload) => {
          const newData = payload.new as Submission
          setSubmission({
            status: newData.status,
            current_test: newData.test_case,
            verdict: newData.verdict,
            time_ms: newData.time_ms,
            memory_kb: newData.memory_kb,
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [submissionId, supabase])

  return { submission, error }
}
