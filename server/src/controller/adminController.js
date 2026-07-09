import { login } from '../service/authService.js'
import { fail, ok } from '../utils/response.js'

export async function adminLogin(req, res, next) {
  try {
    const { username, password } = req.body ?? {}
    const trimmedUsername = typeof username === 'string' ? username.trim() : ''
    const plainPassword = typeof password === 'string' ? password : ''

    if (!trimmedUsername || !plainPassword) return fail(res, 400, 'username and password are required')

    const session = await login(trimmedUsername, plainPassword)
    if (!session) return fail(res, 401, 'Invalid username or password')

    ok(res, session, '登录成功', session)
  } catch (error) {
    next(error)
  }
}
