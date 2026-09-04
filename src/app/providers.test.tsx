import { afterEach, describe, expect, it, vi } from 'vitest'

import * as providers from './providers'

describe('automatic sync schedule', () => {
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

  it('syncs on focus and every visible online minute, then cleans up', async () => {
    vi.useFakeTimers()
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
    const run = vi.fn()
    const start = (providers as unknown as { startSyncSchedule?: (callback: () => void) => () => void }).startSyncSchedule

    expect(start).toBeTypeOf('function')
    const stop = start!(run)
    window.dispatchEvent(new Event('focus'))
    await vi.advanceTimersByTimeAsync(60_000)
    expect(run).toHaveBeenCalledTimes(2)

    stop()
    window.dispatchEvent(new Event('focus'))
    await vi.advanceTimersByTimeAsync(60_000)
    expect(run).toHaveBeenCalledTimes(2)
  })
})
