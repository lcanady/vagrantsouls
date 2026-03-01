import { Hono } from "hono";
import { authService } from "../services/AuthService.ts";
import { Repository } from "../repository.ts";
import { User } from "../models/user.ts";

const authRoutes = new Hono<{ Variables: { repository: Repository } }>();

// This is a bit of a hack since we don't have a singleton repository directly accessible here easily 
// unless we pass it via middleware or context.
// src/main.ts should ideally inject it.

authRoutes.post("/register", async (c) => {
  const { username, password } = await c.req.json();
  const repo = c.get("repository");

  if (!repo) return c.json({ error: "Repository not found" }, 500);

  const existingUser = await repo.getUserByUsername(username);
  if (existingUser) {
    return c.json({ error: "Username already exists" }, 400);
  }

  const passwordHash = await authService.hashPassword(password);
  const user: User = {
    id: crypto.randomUUID(),
    username,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  await repo.saveUser(user);
  const token = await authService.generateToken(user);

  return c.json({ token, user: { id: user.id, username: user.username } });
});

authRoutes.post("/login", async (c) => {
  const { username, password } = await c.req.json();
  const repo = c.get("repository");

  if (!repo) return c.json({ error: "Repository not found" }, 500);

  const user = await repo.getUserByUsername(username);
  if (!user) {
    return c.json({ error: "Invalid username or password" }, 401);
  }

  const isValid = await authService.verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return c.json({ error: "Invalid username or password" }, 401);
  }

  const token = await authService.generateToken(user);
  return c.json({ token, user: { id: user.id, username: user.username } });
});

export default authRoutes;
