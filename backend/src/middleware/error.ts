import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export function errorHandler(error: Error, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    return res.status(400).json({ message: "Invalid request", details: error.flatten() });
  }
  const status = error.message === "Unauthorized" ? 401 : 500;
  return res.status(status).json({ message: error.message });
}
