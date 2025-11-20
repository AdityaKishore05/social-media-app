import express from "express";
import {
  getFeedPosts,
  getUserPosts,
  likePost,
  commentPost,
  deletePost,
  likeComment,
  deleteComment,
  getSinglePost,
  createPost,
} from "../controllers/posts.js";
import { upload } from "../middleware/multer.js";
import { verifyToken } from "../middleware/auth.js";
import {

  validateComment,
  validatePagination,
} from "../middleware/validation.js";

const router = express.Router();


// ============================================
// ROUTES
// ============================================

/* CREATE */
router.post("/", verifyToken, upload.array("picture"), createPost);

/* READ */
router.get("/", verifyToken, validatePagination, getFeedPosts);
router.get("/:id", verifyToken, getSinglePost);
router.get("/:userId/posts", verifyToken, validatePagination, getUserPosts);

/* UPDATE */
router.patch(
  "/:id/comment",
  verifyToken,
  validateComment,
  commentPost
);
router.patch(
  "/:postId/comment/:commentId/like",
  verifyToken,
  likeComment
);

router.patch("/:id/like", verifyToken, likePost);
router.patch(
  "/:postId/comment/:commentId/delete",
  verifyToken,
  deleteComment
);

/* DELETE */
router.delete("/:id/delete", verifyToken, deletePost);

// ============================================
// MULTER ERROR HANDLER
// ============================================


export default router;
