import * as scrypt from "scrypt";
import { create, verify, getNumericDate } from "djwt";
import { User } from "../models/user.ts";

const JWT_KEY = await crypto.subtle.generateKey(
  { name: "HMAC", hash: "SHA-512" },
  true,
  ["sign", "verify"],
);

export class AuthService {
  async hashPassword(password: string): Promise<string> {
    return await scrypt.hash(password);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await scrypt.verify(password, hash);
  }

  async generateToken(user: User): Promise<string> {
    const jwt = await create(
      { alg: "HS512", typ: "JWT" },
      {
        id: user.id,
        username: user.username,
        exp: getNumericDate(60 * 60 * 24), // 24 hours
      },
      JWT_KEY,
    );
    return jwt;
  }

  async verifyToken(token: string): Promise<{ id: string; username: string } | null> {
    try {
      const payload = await verify(token, JWT_KEY);
      return payload as unknown as { id: string; username: string };
    } catch {
      return null;
    }
  }
}

export const authService = new AuthService();
