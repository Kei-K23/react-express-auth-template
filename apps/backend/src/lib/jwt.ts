import jwt from "jsonwebtoken";
import { prisma } from "./db";

export const ACCESS_TOKEN_EXPIRES_IN = "15m";
export const REFRESH_TOKEN_EXPIRES_IN = 30 * 24 * 60 * 60;

export const generateTokens = async (userId: string) => {
  const accessToken = jwt.sign(
    {
      userId,
    },
    process.env.BACKEND_APP_JWT_KEY! || "secret_key",
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );

  const refreshToken = crypto.randomUUID().toString();
  const expiredAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN * 1000);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId,
      expiredAt,
    },
  });

  return { accessToken, refreshToken };
};

export const verifyRefreshToken = async (token: string) => {
  const refreshToken = await prisma.refreshToken.findUnique({
    where: {
      token,
    },
  });

  if (!refreshToken) {
    throw new Error("Invalid refresh token");
  }

  if (refreshToken.revokedAt) {
    throw new Error("Refresh token has been revoked");
  }

  if (refreshToken.expiredAt < new Date()) {
    throw new Error("Refresh token has expired");
  }

  return { userId: refreshToken.userId };
};
