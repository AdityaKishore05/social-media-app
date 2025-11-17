import express from "express";
import { login, googleAuth, register } from "../controllers/auth.js";
import {
  validateRegister,
  validateLogin,
  validateGoogleAuth,
} from "../middleware/validation.js";

const router = express.Router();

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.post("/google", validateGoogleAuth, googleAuth);
export default router;
