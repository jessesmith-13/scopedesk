import type { MiddlewareHandler } from 'hono'
import { requireAuth, type AuthContext } from '../auth.ts'

// This makes c.get("auth") properly typed everywhere
declare module 'hono' {
  interface ContextVariableMap {
    auth: AuthContext
  }
}

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  try {
    const authHeader = c.req.header('Authorization') ?? null
    const auth = await requireAuth(authHeader)

    // store for downstream handlers
    c.set('auth', auth)

    await next()
  } catch (err) {
    // requireAuth throws a Response on failure — return it directly
    if (err instanceof Response) return err

    console.error('authMiddleware error:', err)
    return c.json({ error: 'Unauthorized' }, 401)
  }
}
