import express from "express";
import {
  getUser,
  getUserFriends,
  addRemoveFriend,
} from "../controllers/users.js";
import { verifyToken } from "../middleware/auth.js";
import multer from "multer";
import User from "../models/User.js";
import { v2 as cloudinary } from "cloudinary";

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

/* READ */
router.get("/:id", verifyToken, getUser);
router.get("/:id/friends", verifyToken, getUserFriends);

/* UPDATE - CRITICAL: Put specific routes BEFORE dynamic routes */
// This must come BEFORE /:id/:friendId
router.patch(
  "/:id/update",
  verifyToken,
  upload.single("picture"), // This should accept "picture" not "media"
  async (req, res) => {
    try {
      const { id } = req.params;
      const { firstName, lastName, bio } = req.body;

      console.log("===== UPDATE USER REQUEST =====");
      console.log("User ID:", id);
      console.log("Body:", { firstName, lastName, bio });
      console.log("Has file:", !!req.file);

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
          console.log("Uploading profile picture to Cloudinary...");
          console.log("File info:", {
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
          console.log("✓ Profile picture uploaded:", uploadResult.secure_url);
        } catch (uploadError) {
          console.error("Cloudinary upload error:", uploadError);
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

      console.log("✓ User updated successfully");
      res.status(200).json(userResponse);
    } catch (error) {
      console.error("UPDATE USER ERROR:", error);
      res.status(500).json({
        message: "Failed to update user profile",
        error: error.message,
      });
    }
  }
);

// This must come AFTER /:id/update
router.patch("/:id/:friendId", verifyToken, addRemoveFriend);

export default router;
