import express from "express";
import {
  getFeedPosts,
  getUserPosts,
  likePost,
  commentPost, // FIXED: Use commentPost instead of addComment
  deletePost,
} from "../controllers/posts.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/* READ */
router.get("/", verifyToken, getFeedPosts);
router.get("/:userId/posts", verifyToken, getUserPosts);

/* UPDATE */
router.patch("/:id/like", verifyToken, likePost);
router.patch("/:id/comment", verifyToken, commentPost); // FIXED: Use commentPost

/* DELETE */
router.delete("/:id/delete", verifyToken, deletePost);

export default router;
