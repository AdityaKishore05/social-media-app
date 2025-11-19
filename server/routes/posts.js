import express from "express";
import {
  createPost,
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
  validateCreatePost,
  validatePostId,
  validateComment,
  validatePagination,
} from "../middleware/validation.js";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "@fluidjs/multer-cloudinary";
import { postLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// ============================================
// MULTER CONFIGURATION (Cloudinary)
// ============================================
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "social-media-app",
    resource_type: "auto",
    allowed_formats: ["jpg", "png", "jpeg", "mp4", "mov", "avi", "webp"],
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
    files: 20,
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("video/")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only images and videos are allowed"), false);
    }
  },
});

// ============================================
// ROUTES
// ============================================

// Apply to create route specifically
router.post(
  "/",
  verifyToken,
  postLimiter,
  upload.array("mediaFiles", 20), // ⬅ multer FIRST (so req.body exists)
  validateCreatePost, // ⬅ THEN validate body
  createPost
);

/* READ */
router.get("/", verifyToken, validatePagination, getFeedPosts);
router.get("/:id", getSinglePost);
router.get("/:userId/posts", verifyToken, validatePagination, getUserPosts);

/* UPDATE */
router.patch(
  "/:id/comment",
  verifyToken,
  validatePostId,
  validateComment,
  commentPost
);
router.patch(
  "/:postId/comment/:commentId/like",
  verifyToken,
  validatePostAndCommentId, // ⬅ FIXED
  likeComment
);

router.patch("/:id/like", verifyToken, validatePostId, likePost);
router.patch(
  "/:postId/comment/:commentId/delete",
  verifyToken,
  validatePostId,
  deleteComment
);

/* DELETE */
router.delete("/:id/delete", verifyToken, validatePostId, deletePost);

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
