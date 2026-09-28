interface CategoryBadgeProps {
  name: string
  icon: string
  color: string
}

/** Category chip: the category color is only a dot — label text stays in the text token for legibility. */
export default function CategoryBadge({ name, icon, color }: CategoryBadgeProps) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-bg px-2 py-0.5 text-xs font-medium text-muted ring-1 ring-inset ring-border">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
      <span aria-hidden>{icon}</span>
      <span className="truncate">{name}</span>
    </span>
  )
}
