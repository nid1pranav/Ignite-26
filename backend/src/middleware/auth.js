import jwt from 'jsonwebtoken'

export const authenticateToken = async (c, next) => {
  const authHeader = c.req.header('authorization')
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return c.json({ error: 'Access token required' }, 401)
  }

  try {
    const decoded = jwt.verify(token, c.env.JWT_SECRET)
    const prisma = c.get('prisma')
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        student: true
      }
    })

    if (!user || !user.isActive) {
      return c.json({ error: 'User not found or inactive' }, 403)
    }

    c.set('user', user)
    await next()
  } catch (error) {
    return c.json({ error: 'Invalid or expired token' }, 403)
  }
}

export const requireRole = (roles) => {
  return async (c, next) => {
    const user = c.get('user')
    
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401)
    }

    if (!roles.includes(user.role)) {
      return c.json({ error: 'Insufficient permissions' }, 403)
    }

    await next()
  }
}

export const requireAdminOrBrigadeLead = requireRole(['ADMIN', 'BRIGADE_LEAD'])
export const requireAdmin = requireRole(['ADMIN'])