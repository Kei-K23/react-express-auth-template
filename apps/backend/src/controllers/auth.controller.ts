import {
  loginSchema,
  registerSchema,
} from "@react-express-auth-template/types";
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
      process.env.BACKEND_APP_JWT_KEY! || "secret_key",
      { expiresIn: "1d" }
    );

    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const login: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = loginSchema.parse(req.body);
    const existingUser = await prisma.user.findUnique({
      where: {
        email: body.email,
      },
    });

    if (!existingUser) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    const isVerifyPassword = await bcrypt.compare(
      body.password,
      existingUser.password
    );

    if (!isVerifyPassword) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    const token = jwt.sign(
      {
        userId: existingUser.id,
      },
      process.env.BACKEND_APP_JWT_KEY! || "secret_key",
      { expiresIn: "1d" }
    );

    res.status(201).json({
      user: {
        id: existingUser.id,
        username: existingUser.username,
        email: existingUser.email,
        createdAt: existingUser.createdAt,
        updatedAt: existingUser.updatedAt,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.userId,
      },
    });

    if (!user) {
      res.status(404).json({
        message: "User not found",
      });
      return;
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    next(error);
  }
};
