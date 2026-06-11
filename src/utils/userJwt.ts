import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const JWT_SECRET = process.env.JWT_SECRET!;

export interface UserJwtPayload {
  userId: string;
  type: "user";
}

export const generateUserToken = (userId: mongoose.Types.ObjectId): string | null => {
  try {
    return jwt.sign(
      { userId: String(userId), type: "user" } satisfies UserJwtPayload,
      JWT_SECRET,
      { expiresIn: "7d" }
    );
  } catch (error) {
    console.error("User JWT token generation error:", error);
    return null;
  }
};

export const verifyUserToken = (token: string): mongoose.Types.ObjectId | null => {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as UserJwtPayload;
    if (payload.type !== "user" || !payload.userId) return null;
    if (!mongoose.isValidObjectId(payload.userId)) return null;
    return new mongoose.Types.ObjectId(payload.userId);
  } catch (error) {
    console.error("User JWT verification error:", error);
    return null;
  }
};
