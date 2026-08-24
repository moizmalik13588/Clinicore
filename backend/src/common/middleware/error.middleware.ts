import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/app.error';
import { env } from '../../config/env';

// ─── Main Error Handler ───────────────────────────────────────────────────────
export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {

  // 1. Operational AppErrors (NotFound, Unauthorized, Conflict, etc.)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
      ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    });
    return;
  }

  // 2. Zod Validation Errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.flatten().fieldErrors,
    });
    return;
  }

  // 3. JWT Errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: 'Invalid token',
      code: 'INVALID_TOKEN',
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: 'Token expired',
      code: 'TOKEN_EXPIRED',
    });
    return;
  }

  // 4. Prisma Errors
  if (err.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as any;

    // Unique constraint violation
    if (prismaErr.code === 'P2002') {
      const field = prismaErr.meta?.target?.[0] || 'field';
      res.status(409).json({
        success: false,
        error: `${field} already exists`,
        code: 'DUPLICATE_ENTRY',
      });
      return;
    }

    // Record not found
    if (prismaErr.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: 'Record not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    // Foreign key constraint
    if (prismaErr.code === 'P2003') {
      res.status(400).json({
        success: false,
        error: 'Referenced record does not exist',
        code: 'FOREIGN_KEY_ERROR',
      });
      return;
    }

    // Column does not exist (schema out of sync)
    if (prismaErr.code === 'P2022') {
      console.error('[Prisma] Schema out of sync — run prisma migrate:', prismaErr.message);
      res.status(500).json({
        success: false,
        error: 'Database schema error — contact support',
        code: 'SCHEMA_ERROR',
      });
      return;
    }
  }

  // 5. Prisma Connection Error
  if (err.constructor.name === 'PrismaClientInitializationError') {
    console.error('[Prisma] Connection failed:', err.message);
    res.status(503).json({
      success: false,
      error: 'Database connection failed',
      code: 'DB_CONNECTION_ERROR',
    });
    return;
  }

  // 6. Unknown / Programming Errors
  console.error('[Unhandled Error]', {
    name: err.name,
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    error: env.NODE_ENV === 'development'
      ? err.message
      : 'Internal server error',
    code: 'INTERNAL_ERROR',
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

// ─── 404 Handler ─────────────────────────────────────────────────────────────
export function notFoundMiddleware(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
    code: 'ROUTE_NOT_FOUND',
  });
}