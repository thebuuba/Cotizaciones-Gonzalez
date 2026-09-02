import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './app/App'
import { SyncProvider } from './app/providers'
import { AuthGate } from './features/auth/AuthGate'
import { disableZoom } from './lib/disableZoom'
import { supabase } from './lib/supabase'
import { registerPwa } from './pwa/register'
import { PwaInstallProvider } from './pwa/PwaInstallProvider'
import './styles/tokens.css'
import './styles/global.css'

disableZoom()
registerPwa()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PwaInstallProvider>
      <AuthGate client={supabase}>
        <SyncProvider><App /></SyncProvider>
      </AuthGate>
    </PwaInstallProvider>
  </StrictMode>,
)
