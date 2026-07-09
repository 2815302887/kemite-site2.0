import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { fail } from '../utils/response.js'

export function requireAdminAuth(req, res, next) {
  const authHeader = req.get('authorization') ?? ''
  const [scheme, headerToken] = authHeader.split(' ')
  const token = scheme === 'Bearer' ? headerToken : (typeof req.query.token === 'string' ? req.query.token : '')

  if (!token) return fail(res, 401, 'Unauthorized')

  try {
    req.admin = jwt.verify(token, env.jwtSecret)
    next()
  } catch (_error) {
    fail(res, 401, 'Invalid or expired token')
  }
}
