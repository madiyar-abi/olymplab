export enum Verdict {
  AC = 'AC',
  WA = 'WA',
  TLE = 'TLE',
  MLE = 'MLE',
  RE = 'RE',
  PE = 'PE',
  CE = 'CE',
  FAILED = 'FAILED',
  TESTING = 'TESTING',
  SKIPPED = 'SKIPPED',
  CHALLENGED = 'CHALLENGED',
  PARTIAL = 'PARTIAL',
}

export const VERDICT_METADATA: Record<
  Verdict,
  { label: string; description: string; color: string; bg: string; border: string }
> = {
  [Verdict.AC]: {
    label: 'Accepted',
    description: 'Solution is correct and passed all tests.',
    color: 'text-emerald-500 dark:text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  [Verdict.WA]: {
    label: 'Wrong Answer',
    description: 'Solution produced incorrect output for some test case.',
    color: 'text-red-500 dark:text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
  },
  [Verdict.TLE]: {
    label: 'Time Limit Exceeded',
    description: 'Solution exceeded the allowed execution time.',
    color: 'text-amber-500 dark:text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  [Verdict.MLE]: {
    label: 'Memory Limit Exceeded',
    description: 'Solution exceeded the allowed memory limit.',
    color: 'text-orange-500 dark:text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
  },
  [Verdict.RE]: {
    label: 'Runtime Error',
    description: 'Solution crashed during execution (e.g., segfault, division by zero).',
    color: 'text-purple-500 dark:text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
  },
  [Verdict.CE]: {
    label: 'Compilation Error',
    description: 'Solution failed to compile.',
    color: 'text-zinc-500 dark:text-zinc-400',
    bg: 'bg-zinc-500/10',
    border: 'border-zinc-500/20',
  },
  [Verdict.PE]: {
    label: 'Presentation Error',
    description: 'Output format is slightly incorrect (e.g., extra spaces or newlines).',
    color: 'text-slate-500 dark:text-slate-400',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/20',
  },
  [Verdict.FAILED]: {
    label: 'Failed',
    description: 'System failure or internal error during testing.',
    color: 'text-rose-500 dark:text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
  },
  [Verdict.TESTING]: {
    label: 'Testing',
    description: 'Solution is currently being evaluated.',
    color: 'text-blue-500 dark:text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  [Verdict.SKIPPED]: {
    label: 'Skipped',
    description: 'Testing of this solution was skipped.',
    color: 'text-gray-500 dark:text-gray-400',
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/20',
  },
  [Verdict.CHALLENGED]: {
    label: 'Challenged',
    description: 'Solution was hacked/challenged by another user.',
    color: 'text-fuchsia-500 dark:text-fuchsia-400',
    bg: 'bg-fuchsia-500/10',
    border: 'border-fuchsia-500/20',
  },
  [Verdict.PARTIAL]: {
    label: 'Partial',
    description: 'Solution passed some tests but not all (partial points).',
    color: 'text-cyan-500 dark:text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
  },
}

export function mapRawVerdict(raw: string | null): Verdict {
  if (!raw) return Verdict.TESTING
  const upper = raw.toUpperCase().trim()
  
  if (upper.includes('ACCEPTED') || upper === 'OK' || upper === 'CORRECT') return Verdict.AC
  if (upper.includes('WRONG ANSWER') || upper === 'WA' || upper.includes('INCORRECT')) return Verdict.WA
  if (upper.includes('TIME LIMIT') || upper === 'TLE' || upper.includes('TIMEOUT')) return Verdict.TLE
  if (upper.includes('MEMORY LIMIT') || upper === 'MLE') return Verdict.MLE
  if (upper.includes('RUNTIME ERROR') || upper === 'RE' || upper.includes('CRASHED')) return Verdict.RE
  if (upper.includes('PRESENTATION ERROR') || upper === 'PE') return Verdict.PE
  if (upper.includes('COMPILE ERROR') || upper.includes('COMPILATION ERROR') || upper === 'CE') return Verdict.CE
  if (upper.includes('TESTING') || upper.includes('RUNNING') || upper.includes('PENDING') || upper === 'READY') return Verdict.TESTING
  if (upper.includes('FAILED') || upper.includes('INTERNAL ERROR')) return Verdict.FAILED
  if (upper.includes('CHALLENGED') || upper.includes('HACKED')) return Verdict.CHALLENGED
  if (upper.includes('SKIPPED')) return Verdict.SKIPPED
  if (upper.includes('PARTIAL')) return Verdict.PARTIAL
  
  return Verdict.FAILED
}

