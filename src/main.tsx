import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './app/App'
import { SyncProvider } from './app/providers'
import { AuthGate } from './features/auth/AuthGate'
import { supabase } from './lib/supabase'
import { registerPwa } from './pwa/register'
import './styles/tokens.css'
import './styles/global.css'

registerPwa()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthGate client={supabase}>
      <SyncProvider><App /></SyncProvider>
    </AuthGate>
  </StrictMode>,
)
