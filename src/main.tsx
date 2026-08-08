import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'

const root = document.getElementById('root')
if (!root) throw new Error('#root not found in index.html')

createRoot(root).render(
  <StrictMode>
    {/* HashRouter: no server rewrite rules needed to host the built site. */}
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
