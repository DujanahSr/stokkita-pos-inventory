import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const zodError = result.error as any;
      const errors = (zodError.issues || zodError.errors).map((err: any) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      res.status(400).json({
        message: "Data tidak valid",
        errors,
      });
      return;
    }
    // Override req.body with parsed data (which includes coerced types/defaults)
    req.body = result.data;
    next();
  };
};
