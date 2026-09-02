export function disableZoom(): void {
  const preventDefault = (event: Event) => event.preventDefault()

  document.addEventListener('gesturestart', preventDefault, { passive: false })
  document.addEventListener('gesturechange', preventDefault, { passive: false })
  document.addEventListener('gestureend', preventDefault, { passive: false })

  document.addEventListener('touchmove', (event) => {
    if (event.touches.length > 1) event.preventDefault()
  }, { passive: false })

  window.addEventListener('wheel', (event) => {
    if (event.ctrlKey || event.metaKey) event.preventDefault()
  }, { passive: false })

  window.addEventListener('keydown', (event) => {
    if (!(event.ctrlKey || event.metaKey)) return
    if (['+', '=', '-', '_', '0'].includes(event.key)) event.preventDefault()
  })
}
