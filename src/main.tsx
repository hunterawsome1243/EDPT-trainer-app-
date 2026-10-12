import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createHashRouter, createMemoryRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import { routes } from './ui/routes'
import { registerPwa } from './pwa'

registerPwa()

// The artifact build runs inside a viewer that owns the URL, so routing stays in memory there.
const router = import.meta.env.VITE_ARTIFACT ? createMemoryRouter(routes) : createHashRouter(routes)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
