import express from "express";
import {
  getUser,
  getUserFriends,
  addRemoveFriend,
} from "../controllers/users.js";
import { verifyToken } from "../middleware/auth.js";
import {
  validateUpdateUser,
  validateUserId,
  validateSearchQuery,
} from "../middleware/validation.js";
import multer from "multer";
import User from "../models/User.js";
import { v2 as cloudinary } from "cloudinary";
import { logger } from "../utils/logger.js";

const router = express.Router();

// Configure multer to use memory storage
const storage = multer.memoryStorage();

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
    files: 10, // Max 10 files
  },
  fileFilter: (req, file, cb) => {
    // Accept images and videos
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

/* SEARCH */
router.get(
  "/search/:query",
  verifyToken,
  validateSearchQuery,
  async (req, res) => {
    try {
      const { query } = req.params;
      if (!query || query.trim().length < 2) {
        return res
          .status(400)
          .json({ message: "Search query must be at least 2 characters" });
      }

      const users = await User.find({
        $or: [
          { firstName: { $regex: query.trim(), $options: "i" } },
          { lastName: { $regex: query.trim(), $options: "i" } },
          { email: { $regex: query.trim(), $options: "i" } },
        ],
      })
        .select("firstName lastName picturePath email _id bio")
        .limit(20)
        .lean();

      res.status(200).json(users);
    } catch (err) {
      logger.error("SEARCH USERS ERROR:", err);
      res.status(500).json({ message: err.message });
    }
  }
);
/* READ */
router.get("/:id", verifyToken, validateUserId, getUser);
router.get("/:id/friends", verifyToken, validateUserId, getUserFriends);

/* UPDATE - CRITICAL: Put specific routes BEFORE dynamic routes */
// This must come BEFORE /:id/:friendId
router.patch(
  "/:id/update",
  verifyToken,
  validateUserId,
  validateUpdateUser,
  upload.single("picture"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { firstName, lastName, bio } = req.body;

      logger.info("===== UPDATE USER REQUEST =====");
      logger.info("User ID:", id);
      logger.info("Body:", { firstName, lastName, bio });
      logger.info("Has file:", !!req.file);

      // Find the user
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Build update object
      const updateData = {
        firstName: firstName?.trim() || user.firstName,
        lastName: lastName?.trim() || user.lastName,
        bio: bio?.trim() || "",
      };

      // Handle profile picture upload
      if (req.file) {
        try {
          logger.info("Uploading profile picture to Cloudinary...");
          logger.info("File info:", {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
          });

          const fileStr = `data:${
            req.file.mimetype
          };base64,${req.file.buffer.toString("base64")}`;

          const uploadResult = await cloudinary.uploader.upload(fileStr, {
            resource_type: "image",
            folder: "social-media-app/profiles",
            transformation: [
              { width: 500, height: 500, crop: "fill" },
              { quality: "auto" },
            ],
          });

          updateData.picturePath = uploadResult.secure_url;
          logger.info("✓ Profile picture uploaded:", uploadResult.secure_url);
        } catch (uploadError) {
          logger.error("Cloudinary upload error:", uploadError);
          return res.status(500).json({
            message: "Failed to upload profile picture",
            error: uploadError.message,
          });
        }
      }

      // Update user
      const updatedUser = await User.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      // Remove sensitive data
      const userResponse = {
        _id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        picturePath: updatedUser.picturePath,
        friends: updatedUser.friends,
        bio: updatedUser.bio,
      };

      logger.info("✓ User updated successfully");
      res.status(200).json(userResponse);
    } catch (error) {
      logger.error("UPDATE USER ERROR:", error);
      res.status(500).json({
        message: "Failed to update user profile",
        error: error.message,
      });
    }
  }
);

// This must come AFTER /:id/update
router.patch("/:id/:friendId", verifyToken, validateUserId, addRemoveFriend);

export default router;
