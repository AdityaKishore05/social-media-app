import express from "express";
import {
  getFeedPosts,
  getUserPosts,
  likePost,
  commentPost,
  deletePost,
  likeComment,
  deleteComment,
  getSinglePost
} from "../controllers/posts.js";
import multer from "multer";
import { verifyToken } from "../middleware/auth.js";
import {

  validateComment,
  validatePagination,
} from "../middleware/validation.js";

const router = express.Router();


// ============================================
// ROUTES
// ============================================

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
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "File too large. Maximum size is 50MB for videos.",
      });
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        message: "Too many files. Maximum 20 files per post.",
      });
    }
    return res.status(400).json({ message: error.message });
  }

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  next(error);
});

export default router;
