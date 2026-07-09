import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { findAdminUser } from '../model/adminModel.js'

export async function login(username, password) {
  const user = await findAdminUser(username, password)
  if (!user) return null
  return {
    token: jwt.sign(user, env.jwtSecret, { expiresIn: '24h' }),
    expiresIn: '24h',
  }
}
