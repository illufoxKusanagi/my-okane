export const availableColors = [
  'blue',
  'emerald',
  'amber',
  'rose',
  'purple',
  'pink',
  'yellow',
  'cyan',
  'indigo',
  'slate'
] as const

export const availableIcons = [
  'i-lucide-folder',
  'i-lucide-utensils',
  'i-lucide-car',
  'i-lucide-lightbulb',
  'i-lucide-film',
  'i-lucide-shopping-bag',
  'i-lucide-wallet',
  'i-lucide-briefcase',
  'i-lucide-trending-up',
  'i-lucide-gift',
  'i-lucide-heart-pulse',
  'i-lucide-graduation-cap',
  'i-lucide-home',
  'i-lucide-plane',
  'i-lucide-circle-help'
] as const

export const colorHexMap: Record<string, string> = {
  amber: '#f59e0b',
  blue: '#3b82f6',
  yellow: '#eab308',
  purple: '#a855f7',
  pink: '#ec4899',
  slate: '#64748b',
  emerald: '#10b981',
  cyan: '#06b6d4',
  indigo: '#6366f1',
  rose: '#f43f5e'
}

export const colorClassMap: Record<string, string> = {
  amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20 dark:border-amber-900/30',
  blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20 dark:border-blue-900/30',
  yellow: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20 dark:border-yellow-900/30',
  purple: 'text-purple-500 bg-purple-500/10 border-purple-500/20 dark:border-purple-900/30',
  pink: 'text-pink-500 bg-pink-500/10 border-pink-500/20 dark:border-pink-900/30',
  slate: 'text-slate-500 bg-slate-500/10 border-slate-500/20 dark:border-slate-900/30',
  emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20 dark:border-emerald-900/30',
  cyan: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20 dark:border-cyan-900/30',
  indigo: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20 dark:border-indigo-900/30',
  rose: 'text-rose-500 bg-rose-500/10 border-rose-500/20 dark:border-rose-900/30'
}
