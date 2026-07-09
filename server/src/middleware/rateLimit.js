const stores = new Map()

export function rateLimit({ bucket, limit, windowMs, message }) {
  return (req, res, next) => {
    const forwardedFor = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()
    const ip = forwardedFor || req.socket.remoteAddress || req.ip || 'unknown'
    const key = `${bucket}:${ip}`
    const now = Date.now()
    const record = stores.get(key)

    if (!record || now > record.resetAt) {
      stores.set(key, { count: 1, resetAt: now + windowMs })
      next()
      return
    }

    record.count += 1
    if (record.count > limit) {
      res.status(429).json({ code: 429, msg: message, error: message, success: false })
      return
    }
    next()
  }
}
