import cors from 'cors'
import express from 'express'
import { env } from '../config/env.js'

function isDevelopmentOrigin(origin) {
  return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(origin)
}

function isAllowedCorsOrigin(origin) {
  if (!origin) return true
  if (env.corsOrigins.includes(origin)) return true
  return env.isDevelopment && isDevelopmentOrigin(origin)
}

export function registerCoreMiddleware(app) {
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'SAMEORIGIN')
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    next()
  })
  app.use(cors({
    origin(origin, callback) {
      if (isAllowedCorsOrigin(origin)) {
        callback(null, true)
        return
      }
      const error = new Error('Not allowed by CORS')
      error.status = 403
      callback(error)
    },
  }))
  app.use(express.json({ limit: env.jsonLimit }))
}
