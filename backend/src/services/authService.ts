import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db";
import { env } from "../config/env";

export async function registerUser(name: string, email: string, password: string) {
  const hashed = await bcrypt.hash(password, 10);
  const result = await pool.query(
    "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, email",
    [name, email, hashed]
  );
  const user = result.rows[0];
  return issueToken(user.id, user.email);
}

export async function loginUser(email: string, password: string) {
  const result = await pool.query("SELECT id, email, password_hash FROM users WHERE email = $1", [
    email
  ]);
  const user = result.rows[0];
  if (!user) {
    throw new Error("Invalid credentials");
  }
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    throw new Error("Invalid credentials");
  }
  return issueToken(user.id, user.email);
}

function issueToken(userId: number, email: string) {
  const token = jwt.sign({ userId, email }, env.JWT_SECRET, { expiresIn: "7d" });
  return { token, user: { id: userId, email } };
}
