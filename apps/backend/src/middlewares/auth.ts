import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user: {
        userId: string;
      };
    }
  }
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const accessToken = req.headers.authorization?.split(" ")[1];

  if (!accessToken) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  try {
    const decoded = jwt.verify(
      accessToken,
      process.env.BACKEND_APP_JWT_KEY! || "secret_key"
    ) as {
      userId: string;
    };

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};
