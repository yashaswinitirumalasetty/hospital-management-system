import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('API Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error occurred.';

  res.status(statusCode).json({
    error: message,
    code: err.code || 'INTERNAL_ERROR',
  });
};
