'use client'

import { AlertCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { Submission } from '@/app/[locale]/dashboard/problems/[id]/IDEClient'
import { SubmissionStatus } from '@/components/SubmissionStatus'

interface SubmissionsTabProps {
  currentSubmission: Partial<Submission> | null
}

export function SubmissionsTab({ currentSubmission }: SubmissionsTabProps) {
  const t = useTranslations('IDE')
  return (
    <div className="h-full flex flex-col font-mono text-sm text-foreground/80 overflow-y-auto p-4">
      {!currentSubmission ? (
        <div className="text-muted-foreground italic flex flex-col items-center justify-center h-full gap-2">
          <AlertCircle className="w-8 h-8 opacity-20" />
          <span>{t('noActiveSubmission')}</span>
        </div>
      ) : (
        <div className="space-y-6">
          <SubmissionStatus submissionId={currentSubmission.id || null} />

          {currentSubmission.status === 'ERROR' && !currentSubmission.id && (
            <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl text-red-500">
              {currentSubmission.verdict || t('internalError')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
