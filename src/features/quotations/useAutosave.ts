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

  valueRef.current = value
  canSaveRef.current = canSave
  onSaveRef.current = onSave

  const flush = useCallback(async () => {
    if (!canSaveRef.current) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = undefined
    setStatus('saving')
    try {
      await onSaveRef.current(valueRef.current)
      setStatus('saved')
    } catch {
      setStatus('error')
    }
  }, [])

  const revision = suppliedRevision ?? value

  useEffect(() => {
    if (!canSave) return
    setStatus('pending')
    if (timerRef.current) clearTimeout(timerRef.current)
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

  return { status, flush }
}
