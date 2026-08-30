import { act, fireEvent, render } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { useAutosave } from './useAutosave'

function Harness({ onSave }: { onSave: (value: string) => Promise<void> }) {
  const [value, setValue] = useState('inicio')
  const { status } = useAutosave({ value, canSave: value !== 'inicio', onSave, delay: 400 })
  return <><button onClick={() => setValue('cambio')}>Cambiar</button><button onClick={() => setValue('más reciente')}>Cambiar otra vez</button><output>{status}</output></>
}

describe('useAutosave', () => {
  it('flushes pending valid work when the page becomes hidden', async () => {
    vi.useFakeTimers()
    const onSave = vi.fn().mockResolvedValue(undefined)
    const view = render(<Harness onSave={onSave} />)
    fireEvent.click(view.getByRole('button', { name: 'Cambiar' }))

    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' })
    await act(async () => document.dispatchEvent(new Event('visibilitychange')))

    expect(onSave).toHaveBeenCalledWith('cambio')
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
    vi.useRealTimers()
  })

  it('does not report saved or lose a newer revision while an older save is running', async () => {
    vi.useFakeTimers()
    const resolvers: Array<() => void> = []
    const onSave = vi.fn(() => new Promise<void>((resolve) => resolvers.push(resolve)))
    const view = render(<Harness onSave={onSave} />)

    fireEvent.click(view.getByRole('button', { name: 'Cambiar' }))
    await act(async () => vi.advanceTimersByTime(400))
    expect(onSave).toHaveBeenLastCalledWith('cambio')

    fireEvent.click(view.getByRole('button', { name: 'Cambiar otra vez' }))
    await act(async () => vi.advanceTimersByTime(400))
    await act(async () => resolvers.shift()?.())

    expect(onSave).toHaveBeenLastCalledWith('más reciente')
    expect(view.getByText('saving')).toBeInTheDocument()

    await act(async () => resolvers.shift()?.())
    expect(view.getByText('saved')).toBeInTheDocument()
    vi.useRealTimers()
  })
})
