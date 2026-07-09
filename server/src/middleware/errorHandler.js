import { env } from '../config/env.js'

function statusFromError(error) {
  if (error.name === 'MulterError') return 400
  const status = Number(error.status || error.statusCode || error.code)
  return status >= 400 && status < 600 ? status : 500
}

export function errorHandler(error, _req, res, _next) {
  const status = statusFromError(error)
  const isServerError = status >= 500
  const safeMessage = isServerError && env.isProduction
    ? 'Internal server error'
    : (error.message || 'Internal server error')

  if (env.isDevelopment || isServerError) {
    console.error(error)
  }

  const payload = {
    code: status,
    msg: safeMessage,
    error: safeMessage,
    success: false,
  }

  if (env.isDevelopment && error.stack) {
    payload.detail = error.stack
  }

  res.status(status).json(payload)
}
