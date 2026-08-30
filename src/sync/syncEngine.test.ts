import { describe, expect, it, vi } from 'vitest'

import type { OutboxOperation } from '../db/database'
import { SyncEngine, type CloudBackup } from './syncEngine'

const operation = (id = 'op-1'): OutboxOperation => ({
  id,
  entityType: 'quotation',
  entityId: 'quote-1',
  action: 'upsert',
  payload: { quotation: { id: 'quote-1' } },
  createdAt: '2026-08-30T12:00:00.000Z',
  nextAttemptAt: '2026-08-30T12:00:00.000Z',
  attempt: 0,
})

const backup: CloudBackup = {
  businessProfiles: [], clients: [], quotations: [], materialItems: [],
}

function harness(items: OutboxOperation[] = [operation()]) {
  const calls: string[] = []
  const outbox = {
    nextBatch: vi.fn().mockImplementation(async () => [...items]),
    pending: vi.fn().mockImplementation(async () => [...items]),
    markSucceeded: vi.fn().mockImplementation(async (id: string) => { calls.push(`success:${id}`); items.splice(items.findIndex((item) => item.id === id), 1) }),
    markFailed: vi.fn().mockImplementation(async () => { calls.push('failed') }),
  }
  const cloud = {
    push: vi.fn().mockImplementation(async () => { calls.push('push') }),
    pull: vi.fn().mockImplementation(async () => { calls.push('pull'); return backup }),
  }
  const local = { restore: vi.fn().mockImplementation(async () => { calls.push('restore') }) }
  const engine = new SyncEngine({ outbox, cloud, local, isOnline: () => true, now: () => new Date('2026-08-30T12:00:00.000Z') })
  return { calls, cloud, engine, local, outbox }
}

describe('SyncEngine', () => {
  it('pushes queued local changes before pulling and restoring the cloud graph', async () => {
    const { calls, engine, local, outbox } = harness()

    await engine.run()

    expect(calls).toEqual(['push', 'success:op-1', 'pull', 'restore'])
    expect(local.restore).toHaveBeenCalledWith(backup, new Set())
    expect(outbox.markSucceeded).toHaveBeenCalledWith('op-1')
    expect(engine.getState()).toBe('synced')
  })

  it('keeps a failed mutation queued with a delayed retry and does not pull over it', async () => {
    const { cloud, engine, outbox } = harness()
    cloud.push.mockRejectedValueOnce(new Error('sin red'))

    await engine.run()

    expect(outbox.markFailed).toHaveBeenCalledWith('op-1', 'sin red', '2026-08-30T12:00:02.000Z')
    expect(cloud.pull).not.toHaveBeenCalled()
    expect(engine.getState()).toBe('error')
  })

  it('coalesces overlapping runs into a single idempotent batch', async () => {
    const { cloud, engine } = harness()
    let release!: () => void
    cloud.push.mockImplementation(() => new Promise<void>((resolve) => { release = resolve }))

    const first = engine.run()
    const second = engine.run()
    await vi.waitFor(() => expect(cloud.push).toHaveBeenCalledTimes(1))
    release()
    await Promise.all([first, second])

    expect(cloud.push).toHaveBeenCalledTimes(1)
    expect(cloud.pull).toHaveBeenCalledTimes(1)
  })

  it('reports offline without touching the queue or cloud', async () => {
    const { cloud, outbox } = harness()
    const offline = new SyncEngine({ outbox, cloud, local: { restore: vi.fn() }, isOnline: () => false })

    await offline.run()

    expect(offline.getState()).toBe('offline')
    expect(outbox.nextBatch).not.toHaveBeenCalled()
    expect(cloud.push).not.toHaveBeenCalled()
  })

  it('protects queued entities from remote restore even when no retry is due yet', async () => {
    const { engine, local, outbox } = harness()
    outbox.nextBatch.mockResolvedValue([])

    await engine.run()

    expect(local.restore).toHaveBeenCalledWith(backup, new Set(['quotation:quote-1']))
    expect(engine.getState()).toBe('pending')
  })

  it('reports a pull failure without leaking an unhandled rejection', async () => {
    const { cloud, engine } = harness([])
    cloud.pull.mockRejectedValueOnce(new Error('servidor no disponible'))

    await expect(engine.run()).resolves.toBeUndefined()

    expect(engine.getState()).toBe('error')
  })
})
