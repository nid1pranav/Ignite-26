export const errorHandler = (err, c) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: c.req.url,
    method: c.req.method
  })

  // Prisma errors
  if (err.code === 'P2002') {
    return c.json({
      error: 'Duplicate entry',
      message: 'A record with this information already exists'
    }, 400)
  }

  if (err.code === 'P2025') {
    return c.json({
      error: 'Record not found',
      message: 'The requested record was not found'
    }, 404)
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return c.json({
      error: 'Validation failed',
      message: err.message
    }, 400)
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return c.json({
      error: 'Invalid token',
      message: 'Please login again'
    }, 401)
  }

  if (err.name === 'TokenExpiredError') {
    return c.json({
      error: 'Token expired',
      message: 'Please login again'
    }, 401)
  }

  // Default error
  const statusCode = err.statusCode || 500
  const message = c.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message

  return c.json({
    error: 'Server error',
    message: message,
    ...(c.env.NODE_ENV === 'development' && { stack: err.stack })
  }, statusCode)
}