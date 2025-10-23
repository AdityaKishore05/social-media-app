import express from "express";
import {
  createPost,
  getFeedPosts,
  getUserPosts,
  likePost,
  commentPost,
  deletePost,
} from "../controllers/posts.js";
import multer from "multer";
import { verifyToken } from "../middleware/auth.js";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "@fluidjs/multer-cloudinary"; // NEW
const router = express.Router();

// ============================================
// MULTER CONFIGURATION (with Cloudinary)
// ============================================

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "social-media-app", // Folder name in Cloudinary
    resource_type: "auto", // Automatically detect image or video
    allowed_formats: ["jpg", "png", "jpeg", "mp4", "mov", "avi", "webp"],
  },
});

const upload = multer({
  storage, // Use Cloudinary storage
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB (Absolute max limit for videos)
    files: 20, // Max 20 files
  },
  fileFilter: (req, file, cb) => {
    // Redundant check, but good for fast-fail
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

/* CREATE */
router.post("/", verifyToken, upload.array("mediaFiles", 20), createPost);

/* READ */
router.get("/", verifyToken, getFeedPosts);
router.get("/:userId/posts", verifyToken, getUserPosts);

/* UPDATE */
router.patch("/:id/comment", verifyToken, commentPost);
router.patch("/:id/like", verifyToken, likePost);

/* DELETE */
router.delete("/:id/delete", verifyToken, deletePost);

// ============================================
// ERROR HANDLING FOR MULTER
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
    return res.status(400).json({
      message: error.message,
    });
  }

  // Handle other errors (like fileFilter)
  if (error) {
    return res.status(400).json({ message: error.message });
  }

  next(error);
});

export default router;
