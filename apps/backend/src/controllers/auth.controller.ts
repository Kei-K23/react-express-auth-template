import {
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  userUpdateSchema,
} from "@react-express-auth-template/types";
import { NextFunction, Request, RequestHandler, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/db";
import jwt from "jsonwebtoken";
import {
  ACCESS_TOKEN_EXPIRES_IN,
  generateTokens,
  verifyRefreshToken,
} from "../lib/jwt";

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

    const { accessToken, refreshToken } = await generateTokens(user.id);

    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      accessToken,
      refreshToken,
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
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const isVerifyPassword = await bcrypt.compare(
      body.password,
      existingUser.password
    );

    if (!isVerifyPassword) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const { accessToken, refreshToken } = await generateTokens(existingUser.id);

    res.status(200).json({
      user: {
        id: existingUser.id,
        username: existingUser.username,
        email: existingUser.email,
        createdAt: existingUser.createdAt,
        updatedAt: existingUser.updatedAt,
      },
      accessToken,
      refreshToken,
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

export const updateMe = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username, email } = userUpdateSchema.parse(req.body);
    const user = await prisma.user.update({
      where: {
        id: req.user.userId,
      },
      data: {
        username,
        email,
      },
    });

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

export const deleteMe = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await prisma.user.delete({
      where: {
        id: req.user.userId,
      },
    });

    res.json({
      message: "Successfully deleted the account",
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refreshToken } = refreshTokenSchema.parse(req.body);

    if (!refreshToken) {
      res.status(401).json({ message: "Refresh token is required" });
      return;
    }

    const { userId } = await verifyRefreshToken(refreshToken);

    if (!userId) {
      res.status(401).json({ message: "Invalid refresh token" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const token = jwt.sign(
      {
        userId: user.id,
      },
      process.env.BACKEND_APP_JWT_KEY! || "secret_key",
      { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
    );

    res.status(200).json({
      accessToken: token,
    });
  } catch (error) {
    next(error);
  }
};

export const logout: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refreshToken } = refreshTokenSchema.parse(req.body);

    if (!refreshToken) {
      res.status(401).json({ message: "Refresh token is required" });
      return;
    }

    const { userId } = await verifyRefreshToken(refreshToken);

    if (!userId) {
      res.status(401).json({ message: "Invalid refresh token" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    await prisma.refreshToken.update({
      where: { token: refreshToken },
      data: {
        revokedAt: new Date(),
      },
    });

    res.status(200).json({
      message: "Successfully logout",
    });
  } catch (error) {
    next(error);
  }
};
