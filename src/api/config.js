/**
 * Single source of truth for where the API lives.
 *
 * VITE_API_URL is baked in at build time and includes the /api suffix, e.g.
 * https://tripsplit.example.com/api. SignalR hubs and a few direct fetches sit
 * outside /api, so the bare origin is derived from it here rather than being
 * rebuilt at each call site.
 */
const configured = import.meta.env.VITE_API_URL?.replace(/\/+$/, '')

if (!configured && import.meta.env.PROD) {
  // Fails loudly at boot instead of silently calling localhost in production.
  throw new Error('VITE_API_URL is not set. Build the frontend with it defined.')
}

export const API_BASE = configured || 'https://localhost:7213/api'
export const API_ORIGIN = API_BASE.replace(/\/api$/, '')
