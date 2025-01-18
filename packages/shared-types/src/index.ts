import { z } from "zod";

// Schemas
export const userSchema = z.object({
  id: z.string().uuid(),
  username: z
    .string({ required_error: "Username is required" })
    .trim()
    .min(3, "Username should be at least 3 character"),
  email: z.string({ required_error: "Email is required" }).email().trim(),
  password: z
    .string({ required_error: "Password is required" })
    .min(6, "Password must be at least 6 characters long")
    .max(18, "Password should not exceed 18 characters"),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

const userWithoutPasswordSchema = userSchema.omit({ password: true });

export const registerSchema = z.object({
  username: z
    .string({ required_error: "Username is required" })
    .trim()
    .min(3, "Username should be at least 3 character"),
  email: z.string({ required_error: "Email is required" }).email().trim(),
  password: z
    .string({ required_error: "Password is required" })
    .min(6, "Password must be at least 6 characters long")
    .max(18, "Password should not exceed 18 characters"),
});

export const loginSchema = z.object({
  email: z.string({ required_error: "Email is required" }).email().trim(),
  password: z
    .string({ required_error: "Password is required" })
    .min(6, "Password must be at least 6 characters long")
    .max(18, "Password should not exceed 18 characters"),
});

export const authResponseSchema = z.object({
  user: userWithoutPasswordSchema,
  token: z.string(),
});

// Types
export type UserWithoutPasswordField = z.infer<
  typeof userWithoutPasswordSchema
>;
export type User = z.infer<typeof userSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
