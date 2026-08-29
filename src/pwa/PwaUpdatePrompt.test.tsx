import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { PwaUpdatePrompt } from './PwaUpdatePrompt'

describe('PwaUpdatePrompt', () => {
  it('prevents a reload while quotation changes are dirty', () => {
    render(<PwaUpdatePrompt dirty needsRefresh onRefresh={vi.fn()} onDismiss={vi.fn()} />)

    expect(screen.getByRole('status')).toHaveTextContent('Guardaremos tus cambios antes de actualizar.')
    expect(screen.getByRole('button', { name: 'Actualizar' })).toBeDisabled()
  })

  it('lets the user install a ready update from the visible prompt', async () => {
    const user = userEvent.setup()
    const onRefresh = vi.fn()
    render(<PwaUpdatePrompt dirty={false} needsRefresh onRefresh={onRefresh} onDismiss={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Actualizar' }))
    expect(onRefresh).toHaveBeenCalledOnce()
  })
})
