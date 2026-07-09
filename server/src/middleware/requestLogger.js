const sensitiveQueryKeys = new Set(['token', 'authorization', 'password', 'dataurl', 'dataUrl'])

function sanitizeUrl(originalUrl) {
  try {
    const url = new URL(originalUrl, 'http://local')
    for (const key of Array.from(url.searchParams.keys())) {
      if (sensitiveQueryKeys.has(key)) {
        url.searchParams.set(key, '[redacted]')
      }
    }
    return `${url.pathname}${url.search}`
  } catch (_error) {
    return originalUrl.replace(/(token|authorization|password|dataUrl)=([^&]+)/gi, '$1=[redacted]')
  }
}

export function requestLogger(req, res, next) {
  const startedAt = process.hrtime.bigint()

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000
    console.log(`${req.method} ${sanitizeUrl(req.originalUrl || req.url)} ${res.statusCode} ${durationMs.toFixed(1)}ms`)
  })

  next()
}
