import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/ui/styles/global.css'
import { App } from './App'
import { setupAudioUnlock, setupAppLifecycle, lockLandscape, setupStatusBar } from '@/core/capacitor'

// Capacitor native setup (no-ops on web)
setupAudioUnlock()
setupAppLifecycle()
lockLandscape()
setupStatusBar()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
