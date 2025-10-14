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

const router = express.Router();

// ============================================
// MULTER CONFIGURATION
// ============================================
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per file
    files: 20, // Max 20 files
  },
  fileFilter: (req, file, cb) => {
    // Accept images and videos only
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


/* READ */
router.get("/:userId/posts", verifyToken, getUserPosts);
router.post("/", verifyToken, upload.array("mediaFiles", 20), createPost);
router.get("/", verifyToken, getFeedPosts);
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
        message:
          "File too large. Maximum size is 50MB for videos and 10MB for images.",
      });
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        message: "Too many files. Maximum 10 files per post.",
      });
    }
    return res.status(400).json({
      message: error.message,
    });
  }
  next(error);
});

export default router;
