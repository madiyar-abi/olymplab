import {
  Code2,
  Gavel,
  Bot,
  Route,
  Boxes,
  BarChart3,
  EyeOff,
  Target,
  Network,
  Languages,
  type LucideIcon,
} from 'lucide-react'

/* ── Accent palette ──────────────────────────────────────────────────────────
 * Class strings are written out in full so Tailwind's JIT can see them.
 * Identity: ink canvas + amber/gold primary (from the logo), cool hues support.
 */
export type Accent = 'amber' | 'blue' | 'violet' | 'emerald' | 'cyan' | 'sky'

export const accentStyles: Record<
  Accent,
  { icon: string; hoverBorder: string; glow: string; gradient: string }
> = {
  amber: {
    icon: 'text-amber-300 bg-amber-400/10 border-amber-400/20',
    hoverBorder: 'hover:border-amber-400/40',
    glow: 'hover:shadow-[0_0_50px_-12px_rgba(251,191,36,0.35)]',
    gradient: 'from-amber-500/10',
  },
  blue: {
    icon: 'text-blue-300 bg-blue-500/10 border-blue-500/20',
    hoverBorder: 'hover:border-blue-500/40',
    glow: 'hover:shadow-[0_0_50px_-12px_rgba(59,130,246,0.3)]',
    gradient: 'from-blue-500/10',
  },
  violet: {
    icon: 'text-violet-300 bg-violet-500/10 border-violet-500/20',
    hoverBorder: 'hover:border-violet-500/40',
    glow: 'hover:shadow-[0_0_50px_-12px_rgba(139,92,246,0.3)]',
    gradient: 'from-violet-500/10',
  },
  emerald: {
    icon: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
    hoverBorder: 'hover:border-emerald-500/40',
    glow: 'hover:shadow-[0_0_50px_-12px_rgba(16,185,129,0.3)]',
    gradient: 'from-emerald-500/10',
  },
  cyan: {
    icon: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/20',
    hoverBorder: 'hover:border-cyan-500/40',
    glow: 'hover:shadow-[0_0_50px_-12px_rgba(6,182,212,0.3)]',
    gradient: 'from-cyan-500/10',
  },
  sky: {
    icon: 'text-sky-300 bg-sky-500/10 border-sky-500/20',
    hoverBorder: 'hover:border-sky-500/40',
    glow: 'hover:shadow-[0_0_50px_-12px_rgba(14,165,233,0.3)]',
    gradient: 'from-sky-500/10',
  },
}

/* ── Primary feature cards ── (key matches messages Landing.features.<key>) */
export const featureCards: { key: string; icon: LucideIcon; accent: Accent; span?: string }[] = [
  { key: 'ide', icon: Code2, accent: 'amber', span: 'md:col-span-2' },
  { key: 'mentor', icon: Bot, accent: 'violet' },
  { key: 'judge', icon: Gavel, accent: 'blue' },
  { key: 'roadmap', icon: Route, accent: 'emerald' },
  { key: 'visualizers', icon: Boxes, accent: 'amber' },
  { key: 'analytics', icon: BarChart3, accent: 'sky', span: 'md:col-span-2' },
]

/* ── Compact "also included" cards ── (key → Landing.extras.<key>) */
export const extraCards: { key: string; icon: LucideIcon; accent: Accent }[] = [
  { key: 'spoiler', icon: EyeOff, accent: 'amber' },
  { key: 'adaptive', icon: Target, accent: 'blue' },
  { key: 'tools', icon: Network, accent: 'cyan' },
  { key: 'bilingual', icon: Languages, accent: 'emerald' },
]

/* ── Trust strip ── (key → Landing.trust.<key> / <key>Value) */
export const trustItems = ['languages', 'visualizers', 'judges', 'mentor', 'locales']

/* ── "How it works" steps ── (key → Landing.how.step{n}Title/Desc) */
export const steps = [1, 2, 3, 4]

/* ── Mentor bullet points ── */
export const mentorPoints = ['mentorPoint1', 'mentorPoint2', 'mentorPoint3']

/* ── Supported languages (editor + Codeforces submit) ── */
export const languages = ['C++', 'Python', 'Java', 'Rust', 'Go']

/* ── Algorithm visualizers that actually ship
 * (src/components/learning/visualizers). Names are kept universal. */
export const visualizers = [
  'Sorting',
  'Binary Search',
  'Two Pointers',
  'Sliding Window',
  'Prefix Sums',
  'Segment Tree',
  'DSU / Union–Find',
  'Heap',
  'BST',
  'Dijkstra',
  'Graph Traversal',
  'Max Flow',
  'Convex Hull',
  'Knapsack DP',
  'Sieve',
  'String Matching',
  'Bitwise',
  'GCD / Euclid',
]
