import type { OutboxOperation } from '../db/database'
import type { SyncState } from '../domain/types'

export interface CloudRecord<T = unknown> {
  id: string
  payload: T
  updatedAt: string
  deletedAt?: string
  version: number
}

export interface CloudMaterialRecord<T = unknown> extends CloudRecord<T> {
  quotationId: string
}

export interface CloudBackup {
  businessProfiles: CloudRecord[]
  clients: CloudRecord[]
  quotations: CloudRecord[]
  materialItems: CloudMaterialRecord[]
}

interface OutboxPort {
  nextBatch(limit: number): Promise<OutboxOperation[]>
  pending(limit: number): Promise<OutboxOperation[]>
  markSucceeded(id: string): Promise<void>
  markFailed(id: string, error: string, nextAttemptAt: string): Promise<void>
}

interface CloudPort {
  push(operation: OutboxOperation): Promise<void>
  pull(): Promise<CloudBackup>
}

interface LocalRestorePort {
  restore(backup: CloudBackup, protectedEntities: Set<string>): Promise<void>
}

export class SyncEngine {
  private state: SyncState = 'pending'
  private running?: Promise<void>
  private readonly listeners = new Set<(state: SyncState) => void>()

  constructor(private readonly dependencies: {
    outbox: OutboxPort
    cloud: CloudPort
    local: LocalRestorePort
    isOnline?: () => boolean
    now?: () => Date
  }) {}

  getState(): SyncState { return this.state }

  subscribe(listener: (state: SyncState) => void): () => void {
    this.listeners.add(listener)
    listener(this.state)
    return () => this.listeners.delete(listener)
  }

  private setState(state: SyncState) {
    this.state = state
    this.listeners.forEach((listener) => listener(state))
  }

  run(): Promise<void> {
    if (this.running) return this.running
    const isOnline = this.dependencies.isOnline ?? (() => navigator.onLine)
    if (!isOnline()) {
      this.setState('offline')
      return Promise.resolve()
    }
    this.running = this.synchronize().finally(() => { this.running = undefined })
    return this.running
  }

  private async synchronize(): Promise<void> {
    const { cloud, local, outbox } = this.dependencies
    const now = this.dependencies.now ?? (() => new Date())
    this.setState('pending')
    const batch = await outbox.nextBatch(50)
    for (const item of batch) {
      try {
        await cloud.push(item)
        await outbox.markSucceeded(item.id)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        const retryDelay = Math.min(60_000, 2 ** (item.attempt + 1) * 1_000)
        await outbox.markFailed(item.id, message, new Date(now().getTime() + retryDelay).toISOString())
        this.setState('error')
        return
      }
    }

    const remote = await cloud.pull()
    const pending = await outbox.pending(1_000)
    const protectedEntities = new Set(pending.map((item) => `${item.entityType}:${item.entityId}`))
    await local.restore(remote, protectedEntities)
    this.setState(pending.length ? 'pending' : 'synced')
  }
}
