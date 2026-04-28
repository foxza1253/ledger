interface CategoryBadgeProps {
  name: string
  icon: string
  color: string
}

export default function CategoryBadge({ name, icon, color }: CategoryBadgeProps) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium"
      style={{ backgroundColor: `${color}15`, color }}
    >
      {icon} {name}
    </span>
  )
}
