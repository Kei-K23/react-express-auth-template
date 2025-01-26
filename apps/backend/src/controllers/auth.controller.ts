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
import queryString from "query-string";

// OAuth2 URLs
const googleAuthURL = "https://accounts.google.com/o/oauth2/v2/auth";
const googleTokenURL = "https://oauth2.googleapis.com/token";
const googleUserInfoURL = "https://www.googleapis.com/oauth2/v3/userinfo";

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

    const { accessToken, refreshToken } = await generateTokens(user.id);

    res.json({
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

export const googleOAuth: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const queryParams = queryString.stringify({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: process.env.REDIRECT_URI,
      response_type: "code",
      scope: "openid profile email",
      access_type: "offline",
      prompt: "consent",
    });

    res.redirect(`${googleAuthURL}?${queryParams}`);
  } catch (error) {
    next(error);
  }
};

export const googleOAuthCallback: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { code } = req.query;

  if (!code) {
    res.status(400).send("Authorization code not provided");
    return;
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch(googleTokenURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: JSON.stringify({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.REDIRECT_URI,
        grant_type: "authorization_code",
        code: code,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error("Failed to fetch access token");
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Fetch user profile data
    const userInfoResponse = await fetch(googleUserInfoURL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userInfoResponse.ok) {
      throw new Error("Failed to fetch access token");
    }

    const userInfoResponseData = await userInfoResponse.json();

    // Send user profile details to frontend
    res.redirect(
      `${process.env.FRONTEND_URL}/?name=${encodeURIComponent(
        userInfoResponseData.name
      )}&email=${userInfoResponseData.email}&picture=${encodeURIComponent(
        userInfoResponseData.picture
      )}`
    );
  } catch (error) {
    next(error);
  }
};
