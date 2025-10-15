import express from "express";
import { login, googleAuth } from "../controllers/auth.js";

const router = express.Router();

router.post("/login", login);
router.post("/google", googleAuth); // NEW: Google OAuth route

export default router;