import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export function requestLogger(req: Request, _res: Response, next: NextFunction): void {
  const requestId = uuidv4().slice(0, 8);
  (req as any).requestId = requestId;
  
  const start = Date.now();
  
  _res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[FoodVerify] ${req.method} ${req.path} ${_res.statusCode} ${duration}ms [${requestId}]`
    );
  });

  next();
}
