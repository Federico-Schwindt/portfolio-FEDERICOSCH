/**
 * Security headers on everything the server renders (the API and the app's data). Static pages get theirs from the
 * host; these are the ones that matter for the session cookie and the JSON responses.
 */
import { defineMiddleware } from 'astro:middleware'

export const onRequest = defineMiddleware(async (_ctx, next) => {
  const res = await next()
  const h = res.headers
  h.set('X-Content-Type-Options', 'nosniff')
  h.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  h.set('X-Frame-Options', 'DENY')
  h.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')
  if (!h.has('Cache-Control')) h.set('Cache-Control', 'no-store')
  return res
})
