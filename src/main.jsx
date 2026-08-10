import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './i18n/index.js'
import App from './App.jsx'
import { store } from './app/store.js'
import { registerServiceWorker } from './push.js'

// Registered unconditionally at boot, not on first subscribe — the push
// subscription itself still needs an explicit opt-in from Profile, but the
// worker has to already be there for that call to have anything to attach to.
registerServiceWorker()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>,
)
