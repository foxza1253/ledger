import { cn } from '@/lib/cn'
import type { Category } from '@/common/type/interface'

export default function CategoryIcon({ category, size = 'md' }: { category?: Category; size?: 'sm' | 'md' | 'lg' }) {
  const color = category?.color ?? '#94a3b8'
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-xl ring-1 ring-inset',
        size === 'sm' && 'h-8 w-8 text-base',
        size === 'md' && 'h-11 w-11 text-xl',
        size === 'lg' && 'h-12 w-12 text-2xl',
      )}
      style={{ backgroundColor: `${color}1a`, ['--tw-ring-color' as string]: `${color}33` }}
      aria-hidden
    >
      {category?.icon ?? '💰'}
    </span>
  )
}
