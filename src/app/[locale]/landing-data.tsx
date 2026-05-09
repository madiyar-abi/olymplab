import { Terminal, Bot, EyeOff, Map, BarChart3, CheckCircle2, Shield, Bug, Users, Sun, Zap, Code2, Trophy, Brain } from 'lucide-react'

export const stats = [
  { value: '500+', label: 'Curated Problems', icon: '📚' },
  { value: '< 50ms', label: 'Judge Latency', icon: '⚡' },
  { value: 'ICPC & IOI', label: 'Level Problems', icon: '🏆' },
  { value: 'AI-Powered', label: 'Mentor System', icon: '🤖' },
]

export const mainFeatures = [
  {
    icon: <Terminal className="w-8 h-8 text-blue-400" />,
    title: 'Distraction-Free IDE',
    desc: 'Monaco-powered editor with syntax highlighting, Vim mode, and multi-language support. C++, Python, Java, Rust — all in one tab.',
    span: 'md:col-span-2',
    accent: 'from-blue-500/[0.08] via-transparent',
    badge: 'Core',
    badgeColor: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  },
  {
    icon: <EyeOff className="w-8 h-8 text-violet-400" />,
    title: 'Spoiler Protection',
    desc: 'Hide tags and difficulties to simulate real Olympiad conditions.',
    span: '',
    accent: 'from-violet-500/[0.08] via-transparent',
    badge: 'Unique',
    badgeColor: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
  },
  {
    icon: <Map className="w-8 h-8 text-emerald-400" />,
    title: 'Structured Roadmap',
    desc: "Follow expertly crafted syllabi — from arrays to advanced DP and graphs.",
    span: '',
    accent: 'from-emerald-500/[0.08] via-transparent',
    badge: 'Guided',
    badgeColor: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  },
  {
    icon: <BarChart3 className="w-8 h-8 text-sky-400" />,
    title: 'Deep Analytics',
    desc: 'Track execution time, memory, and logic efficiency on every test case. Compare solutions and climb the ranks.',
    span: 'md:col-span-2',
    accent: 'from-sky-500/[0.08] via-transparent',
    badge: 'Insights',
    badgeColor: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
  },
]

export const bentoFeatures = [
  {
    icon: <Shield className="w-7 h-7 text-indigo-400" />,
    title: 'Anti-Cheat Engine',
    desc: 'Real-time monitoring ensures submission integrity. Every solution is fingerprinted and cross-validated.',
    span: 'md:col-span-2',
    accent: 'from-indigo-500/10',
    glow: 'group-hover:shadow-indigo-500/10',
  },
  {
    icon: <Bug className="w-7 h-7 text-cyan-400" />,
    title: 'Visual Debugger',
    desc: 'Step through your code line by line and trace execution paths without leaving the browser.',
    span: '',
    accent: 'from-cyan-500/10',
    glow: 'group-hover:shadow-cyan-500/10',
  },
  {
    icon: <Users className="w-7 h-7 text-emerald-400" />,
    title: 'Community Solutions',
    desc: 'After solving, unlock top community submissions and learn different algorithmic paradigms.',
    span: '',
    accent: 'from-emerald-500/10',
    glow: 'group-hover:shadow-emerald-500/10',
  },
  {
    icon: <Sun className="w-7 h-7 text-amber-400" />,
    title: 'Daily Challenges',
    desc: 'A fresh algorithmic challenge every day. Build consistency and track your weekly growth streak.',
    span: 'md:col-span-2',
    accent: 'from-amber-500/10',
    glow: 'group-hover:shadow-amber-500/10',
  },
]

export const testimonials = [
  {
    quote: "OlympLab is the first platform that actually feels like it was made for serious competitive training — not generic interview prep. The rigor is unmatched.",
    name: 'Artem K.',
    role: 'ICPC World Finalist',
    rating: 5,
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    quote: "The AI mentor helped me identify exactly where my DP intuition was breaking down. Went from 1800 to 2100 rating in two months.",
    name: 'Sara M.',
    role: 'Codeforces Master',
    rating: 5,
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    quote: "The spoiler protection and structured syllabi changed how I practice. I actually think before looking for patterns now.",
    name: 'Dmitri V.',
    role: 'IOI Bronze Medalist',
    rating: 5,
    gradient: 'from-emerald-500 to-teal-600',
  },
]

export const whyPoints = [
  {
    icon: <Zap className="w-5 h-5 text-yellow-400" />,
    title: 'Built by competitors, for competitors.',
    desc: 'Every pixel is designed to eliminate friction during intense coding sessions and simulate real contest pressure.',
    color: 'text-yellow-400 bg-yellow-400/10',
  },
  {
    icon: <Code2 className="w-5 h-5 text-blue-400" />,
    title: 'Strictly curated problem sets.',
    desc: 'Only high-signal problems from Codeforces, CSES, and ICPC that actually sharpen your skill — zero fluff.',
    color: 'text-blue-400 bg-blue-400/10',
  },
  {
    icon: <Brain className="w-5 h-5 text-violet-400" />,
    title: 'AI Mentor that teaches, not spoils.',
    desc: 'Gemini-powered hints that guide your thinking without revealing the solution. Real learning, not memorization.',
    color: 'text-violet-400 bg-violet-400/10',
  },
  {
    icon: <Trophy className="w-5 h-5 text-amber-400" />,
    title: 'Track your journey to Master.',
    desc: 'GitHub-style activity heatmap, submission history, and rank progression — all in one dashboard.',
    color: 'text-amber-400 bg-amber-400/10',
  },
]
