import { useEffect, useRef } from 'react'

export function FormErrorSummary({ errors }: { errors: Record<string, string> }) {
  const messages = [...new Set(Object.values(errors).filter(Boolean))]
  const summaryRef = useRef<HTMLDivElement>(null)
  const messageKey = messages.join('\n')

  useEffect(() => {
    if (messageKey) summaryRef.current?.focus()
  }, [messageKey])

  if (messages.length === 0) return null

  return <div ref={summaryRef} className="form-error-summary" role="alert" aria-atomic="true" tabIndex={-1}>
    <strong>Revisa los campos indicados</strong>
    <ul>{messages.map((message) => <li key={message}>{message}</li>)}</ul>
  </div>
}
