import { Request, Response, NextFunction } from "express";
import { loginSchema, registerSchema } from "../utils/validation";
import { loginUser, registerUser } from "../services/authService";

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = registerSchema.parse(req.body);
    const result = await registerUser(payload.name, payload.email, payload.password);
    res.json(result);
  } catch (error) {
    next(error as Error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = loginSchema.parse(req.body);
    const result = await loginUser(payload.email, payload.password);
    res.json(result);
  } catch (error) {
    next(error as Error);
  }
}

export async function profile(req: Request, res: Response) {
  res.json({ user: req.user });
}
