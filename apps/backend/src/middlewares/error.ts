import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      message: "Validation error",
      errors: err.errors,
    });
    return;
  }

  console.error(err);
  res.status(500).json({
    message: "Internal server error",
  });
};
