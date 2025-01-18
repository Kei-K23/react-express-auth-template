import { registerSchema } from "@react-express-auth-template/types";
import { NextFunction, Request, RequestHandler, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/db";
import jwt from "jsonwebtoken";

export const register: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = registerSchema.parse(req.body);
    const existingUser = await prisma.user.findUnique({
      where: {
        email: body.email,
      },
    });

    if (existingUser) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const user = await prisma.user.create({
      data: {
        ...body,
        password: hashedPassword,
      },
    });

    const token = jwt.sign(
      {
        userId: user.id,
      },
      process.env.BACKEND_APP_JWT_KEY!,
      { expiresIn: "1d" }
    );

    res.status(201).json({
      user,
      token,
    });
  } catch (error) {
    next(error);
  }
};
