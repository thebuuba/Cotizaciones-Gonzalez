import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

type InstallMode = 'unavailable' | 'native' | 'ios' | 'installed'

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

interface PwaInstallContextValue {
  mode: InstallMode
  install: () => Promise<void>
}

const PwaInstallContext = createContext<PwaInstallContextValue>({ mode: 'unavailable', install: async () => undefined })

const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches
  || Boolean((navigator as Navigator & { standalone?: boolean }).standalone)

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent)
  || (/macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1)

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent>()
  const [mode, setMode] = useState<InstallMode>(() => isStandalone() ? 'installed' : isIos() ? 'ios' : 'unavailable')

  useEffect(() => {
    const capturePrompt = (event: Event) => {
      event.preventDefault()
      setPromptEvent(event as InstallPromptEvent)
      setMode('native')
    }
    const markInstalled = () => {
      setPromptEvent(undefined)
      setMode('installed')
    }
    window.addEventListener('beforeinstallprompt', capturePrompt)
    window.addEventListener('appinstalled', markInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', capturePrompt)
      window.removeEventListener('appinstalled', markInstalled)
    }
  }, [])

  const value = useMemo<PwaInstallContextValue>(() => ({
    mode,
    install: async () => {
      if (!promptEvent) return
      await promptEvent.prompt()
      const choice = await promptEvent.userChoice
      if (choice.outcome === 'accepted') {
        setPromptEvent(undefined)
        setMode('installed')
      }
    },
  }), [mode, promptEvent])

  return <PwaInstallContext.Provider value={value}>{children}</PwaInstallContext.Provider>
}

export const usePwaInstall = () => useContext(PwaInstallContext)
