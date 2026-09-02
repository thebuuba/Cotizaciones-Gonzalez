import type { LucideIcon } from 'lucide-react'
import { useId, type ReactNode } from 'react'

export function EmptyState({ Icon, title, description, action }: {
  Icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}) {
  const headingId = useId()

  return <section className="empty-state" aria-labelledby={headingId}>
    <Icon aria-hidden="true" />
    <h2 id={headingId}>{title}</h2>
    <p>{description}</p>
    {action && <div className="empty-state__actions">{action}</div>}
  </section>
}
