import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { BottomNav } from './BottomNav'
import { PageHeader } from './PageHeader'
import { StatusBadge } from './StatusBadge'
import { SyncBadge } from './SyncBadge'

describe('shared interface semantics', () => {
  it('groups the primary heading without adding a second banner landmark', () => {
    render(<PageHeader title="Clientes" subtitle="Contactos" />)

    expect(screen.getByRole('group')).toContainElement(screen.getByRole('heading', { level: 1, name: 'Clientes' }))
    expect(screen.queryByRole('banner')).not.toBeInTheDocument()
  })

  it('exposes bottom navigation as a list of destinations', () => {
    render(<MemoryRouter><BottomNav /></MemoryRouter>)

    const navigation = screen.getByRole('navigation', { name: 'Navegación principal' })
    expect(within(navigation).getAllByRole('listitem')).toHaveLength(4)
    expect(within(navigation).getAllByRole('link')).toHaveLength(4)
  })

  it('announces changing sync state without making static quotation badges live', () => {
    const { rerender } = render(<SyncBadge state="pending" />)
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')

    rerender(<StatusBadge status="draft" />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
