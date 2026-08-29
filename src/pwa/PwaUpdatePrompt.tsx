interface PwaUpdatePromptProps {
  dirty: boolean
  needsRefresh: boolean
  onRefresh: () => void
  onDismiss: () => void
}

export function PwaUpdatePrompt({ dirty, needsRefresh, onRefresh, onDismiss }: PwaUpdatePromptProps) {
  if (!needsRefresh) return null

  return (
    <section className="update-prompt" role="status" aria-live="polite">
      <p>{dirty ? 'Guardaremos tus cambios antes de actualizar.' : 'Hay una actualización disponible.'}</p>
      <div className="update-prompt__actions">
        <button type="button" className="button button--quiet" onClick={onDismiss}>Después</button>
        <button type="button" className="button button--primary" onClick={onRefresh} disabled={dirty}>Actualizar</button>
      </div>
    </section>
  )
}
