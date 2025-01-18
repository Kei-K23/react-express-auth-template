import { NextFunction, Request, Response } from "express";

export const register = (req: Request, res: Response, next: NextFunction) => {
  try {
  } catch (error) {
    next(error);
  }
};
