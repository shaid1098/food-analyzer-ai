import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Never expose internal error details or API keys
  console.error(`[FoodVerify] Error: ${err.message}`);

  const statusCode = (err as any).statusCode || 500;
  
  res.status(statusCode).json({
    status: 'ERROR',
    message: statusCode === 500
      ? 'An internal server error occurred.'
      : err.message,
  });
}
