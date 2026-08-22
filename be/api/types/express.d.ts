import 'express';

declare global {
  namespace Express {
    interface Request {
      user?: any; // We'll improve this later, but for now `any` prevents the TS error on req.user
    }
  }
}
