import { act, fireEvent, render } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { useAutosave } from './useAutosave'

function Harness({ onSave }: { onSave: (value: string) => Promise<void> }) {
  const [value, setValue] = useState('inicio')
  useAutosave({ value, canSave: value !== 'inicio', onSave, delay: 400 })
  return <button onClick={() => setValue('cambio')}>Cambiar</button>
}

describe('useAutosave', () => {
  it('flushes pending valid work when the page becomes hidden', async () => {
    vi.useFakeTimers()
    const onSave = vi.fn().mockResolvedValue(undefined)
    const view = render(<Harness onSave={onSave} />)
    fireEvent.click(view.getByRole('button'))

    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' })
    await act(async () => document.dispatchEvent(new Event('visibilitychange')))

    expect(onSave).toHaveBeenCalledWith('cambio')
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
    vi.useRealTimers()
  })
})
