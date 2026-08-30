import { useCallback, useEffect, useRef, useState } from 'react'

type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

export function useAutosave<T>({ value, canSave, onSave, delay = 400, revision: suppliedRevision }: {
  value: T
  canSave: boolean
  onSave: (value: T) => Promise<void>
  delay?: number
  revision?: string
}) {
  const [status, setStatus] = useState<SaveStatus>('idle')
  const valueRef = useRef(value)
  const canSaveRef = useRef(canSave)
  const onSaveRef = useRef(onSave)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const revisionNumberRef = useRef(0)
  const savedRevisionRef = useRef(0)
  const inFlightRef = useRef<Promise<void> | undefined>(undefined)

  valueRef.current = value
  canSaveRef.current = canSave
  onSaveRef.current = onSave

  const flush = useCallback(async () => {
    if (!canSaveRef.current) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = undefined
    if (inFlightRef.current) return inFlightRef.current

    const saveLatest = async () => {
      try {
        while (canSaveRef.current && savedRevisionRef.current < revisionNumberRef.current) {
          const targetRevision = revisionNumberRef.current
          const targetValue = valueRef.current
          setStatus('saving')
          await onSaveRef.current(targetValue)
          savedRevisionRef.current = targetRevision
        }
        setStatus(canSaveRef.current ? 'saved' : 'idle')
      } catch {
        setStatus('error')
      }
    }
    inFlightRef.current = saveLatest()
    try {
      await inFlightRef.current
    } finally {
      inFlightRef.current = undefined
    }
  }, [])

  const revision = suppliedRevision ?? value

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = undefined
    if (!canSave) {
      if (!inFlightRef.current) setStatus('idle')
      return
    }
    revisionNumberRef.current += 1
    setStatus('pending')
    timerRef.current = setTimeout(() => { void flush() }, delay)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [canSave, delay, flush, revision])

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden' && timerRef.current) void flush()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [flush])

  useEffect(() => {
    return () => {
      if (timerRef.current || inFlightRef.current) void flush()
    }
  }, [flush])

  return { status, flush }
}
