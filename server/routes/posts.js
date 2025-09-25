import express from "express";
import {
  getFeedPosts,
  getUserPosts,
  likePost,
  commentPost,
  deletePost,
  checkMediaHealth,
  backupCriticalPosts,
} from "../controllers/posts.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/* READ */
router.get("/", verifyToken, getFeedPosts);
router.get("/:userId/posts", verifyToken, getUserPosts);

/* UPDATE */
router.patch("/:id/like", verifyToken, likePost);
router.patch("/:id/comment", verifyToken, commentPost);

/* DELETE */
router.delete("/:id/delete", verifyToken, deletePost);

/* MAINTENANCE - Add these for debugging media issues */
router.get("/debug/media-health", verifyToken, checkMediaHealth);
router.get("/debug/backup", verifyToken, backupCriticalPosts);

export default router;
