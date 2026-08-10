import { apiRequest } from './api/client'

/** The push service wants the VAPID key as raw bytes, not base64url text. */
function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

/**
 * iOS Safari only grants push to a site running as an installed, standalone
 * app — a normal browser tab can ask for permission but it silently never
 * arrives. `display-mode: standalone` is how a running page tells the two
 * apart.
 */
export function isStandaloneApp() {
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
}

export function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null
  return navigator.serviceWorker.register('/sw.js')
}

export async function getCurrentSubscription() {
  if (!isPushSupported()) return null
  const reg = await navigator.serviceWorker.ready
  return reg.pushManager.getSubscription()
}

export async function subscribeToPush(token) {
  const reg = await navigator.serviceWorker.ready
  const { key } = await apiRequest('/push/vapid-public-key')
  if (!key) throw new Error('Notificările nu sunt configurate pe server încă.')

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Permisiunea pentru notificări a fost refuzată.')

  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(key),
  })

  const json = subscription.toJSON()
  await apiRequest('/push/subscribe', {
    method: 'POST',
    token,
    body: { endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth },
  })

  return subscription
}

export async function unsubscribeFromPush(token) {
  const subscription = await getCurrentSubscription()
  if (!subscription) return

  await subscription.unsubscribe()
  await apiRequest('/push/unsubscribe', {
    method: 'POST',
    token,
    body: { endpoint: subscription.endpoint },
  }).catch(() => {}) // The subscription is gone locally either way.
}
