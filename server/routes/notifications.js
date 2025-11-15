// routes/notifications.js
import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  getNotifications,
  markAllRead,
  acceptFriendRequest,
  declineFriendRequest,
} from "../controllers/notifications.js";

const router = express.Router();

router.get("/:userId", verifyToken, getNotifications);
router.patch("/mark-read/:userId", verifyToken, markAllRead);
router.post("/friend/accept/:userId", verifyToken, acceptFriendRequest);
router.post("/friend/decline/:userId", verifyToken, declineFriendRequest);

export default router;
