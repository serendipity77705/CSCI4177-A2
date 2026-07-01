import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "./db.js";
import "dotenv/config";

const router = express.Router();
export function auth(req, res, next) {
  const header = req.headers.authorization; // "Bearer <token>"
  const token = header && header.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET); // { id, role }
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const [[user]] = await pool.query(
    "SELECT * FROM users WHERE email = ?",
    [email]
  );

  if (!user) return res.status(404).json({ error: "User not found" });

  const ok = await bcrypt.compare(password, user.passwordHashed);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign(
    { id: user.id, role: user.userRole },
    process.env.JWT_SECRET
  );

  res.json({ token });
});

export default router;