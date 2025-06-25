import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { type SessionUser, type AuthTokenPayload } from "@/lib/types";

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "f0c1e5f5a9f85c1a2f2d96d3e51ecf3d3d3bb1cfe4789a514c53a0e5a8f74a42";

// Generate JWT token
export const generateToken = (user: SessionUser): string => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: "7d" } // Token expires in 7 days
  );
};

// Verify JWT token
export const verifyToken = (token: string): AuthTokenPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
    return decoded;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
};

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

// Verify password
export const verifyPassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

// Extract user from token in request headers
export const getUserFromRequest = (
  authHeader?: string
): AuthTokenPayload | null => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  return verifyToken(token);
};
