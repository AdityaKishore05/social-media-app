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

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

/* READ */
router.get("/:id", verifyToken, getUser);
router.get("/:id/friends", verifyToken, getUserFriends);

/* UPDATE */
router.patch("/:id/:friendId", verifyToken, addRemoveFriend);

// Update user profile - define directly in routes
router.patch(
  "/:id/update",
  verifyToken,
  upload.single("picture"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        firstName,
        lastName,
        location,
        occupation,
        twitter,
        linkedin,
        instagram,
      } = req.body;

      console.log("Updating user:", id);
      console.log("Request body:", req.body);
      console.log("Has file:", !!req.file);

      // Find the user first
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Build update object
      const updateData = {
        firstName: firstName || user.firstName,
        lastName: lastName || user.lastName,
        location: location || user.location,
        occupation: occupation || user.occupation,
        socialLinks: {
          twitter: twitter || "",
          linkedin: linkedin || "",
          instagram: instagram || "",
        },
      };

      // Handle profile picture upload to Cloudinary if provided
      if (req.file) {
        try {
          console.log("Uploading new profile picture to Cloudinary...");

          const fileStr = `data:${
            req.file.mimetype
          };base64,${req.file.buffer.toString("base64")}`;

          const uploadResult = await cloudinary.uploader.upload(fileStr, {
            resource_type: "image",
            folder: "social-media-app/profiles",
          });

          updateData.picturePath = uploadResult.secure_url;
          console.log("Profile picture uploaded:", uploadResult.secure_url);
        } catch (uploadError) {
          console.error("Error uploading profile picture:", uploadError);
          return res.status(500).json({
            message: "Failed to upload profile picture",
            error: uploadError.message,
          });
        }
      }

      // Update user
      const updatedUser = await User.findByIdAndUpdate(id, updateData, {
        new: true,
      });

      console.log("User updated successfully");
      res.status(200).json(updatedUser);
    } catch (error) {
      console.error("UPDATE USER ERROR:", error);
      res.status(500).json({
        message: "Failed to update user profile",
        error: error.message,
      });
    }
  }
);

export default router;
