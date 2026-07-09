import 'dotenv/config'

const nodeEnv = process.env.NODE_ENV || 'development'
const isProduction = nodeEnv === 'production'
const isDevelopment = nodeEnv === 'development'
const defaultDevJwtSecret = 'local-development-only-change-before-deploy'
const unsafeJwtSecrets = new Set([
  '',
  defaultDevJwtSecret,
  'change-this-before-production',
  'replace_with_a_strong_random_secret',
])

function parseList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function resolveJwtSecret() {
  const secret = process.env.JWT_SECRET || (isDevelopment ? defaultDevJwtSecret : '')
  if (isProduction && unsafeJwtSecrets.has(secret)) {
    throw new Error('JWT_SECRET must be configured with a strong value in production.')
  }
  if (!isProduction && secret === defaultDevJwtSecret) {
    console.warn('[config] Using development fallback JWT_SECRET. Set JWT_SECRET before deployment.')
  }
  return secret
}

function resolveCorsOrigins() {
  const origins = parseList(process.env.CORS_ORIGINS)
  if (isProduction && origins.length === 0) {
    throw new Error('CORS_ORIGINS must be configured in production.')
  }
  return origins
}

export const env = {
  nodeEnv,
  isProduction,
  isDevelopment,
  port: Number(process.env.PORT ?? 3001),
  uploadLimitMb: Number(process.env.UPLOAD_LIMIT_MB ?? 8),
  jsonLimit: process.env.JSON_LIMIT || `${Math.ceil(Number(process.env.UPLOAD_LIMIT_MB ?? 8) * 1.5)}mb`,
  backupRetention: Number(process.env.BACKUP_RETENTION ?? 50),
  contactRateLimitWindowMs: Number(process.env.CONTACT_RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000),
  contactRateLimitMax: Number(process.env.CONTACT_RATE_LIMIT_MAX ?? 5),
  jwtSecret: resolveJwtSecret(),
  corsOrigins: resolveCorsOrigins(),
  localAdminUsername: process.env.ADMIN_USERNAME || 'cl',
  localAdminPassword: process.env.ADMIN_PASSWORD || 'aacl520',
}
