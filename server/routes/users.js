import express from "express";
import {
  getUser,
  getUserFriends,
  addRemoveFriend,
  updateUser,
} from "../controllers/users.js";
import { verifyToken } from "../middleware/auth.js";
import multer from "multer";

const router = express.Router();

// FIXED: Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

/* READ */
router.get("/:id", verifyToken, getUser);
router.get("/:id/friends", verifyToken, getUserFriends);

/* UPDATE */
router.patch("/:id/:friendId", verifyToken, addRemoveFriend);
router.patch("/:id/update", verifyToken, upload.single("picture"), updateUser);
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

      const updateData = {
        firstName,
        lastName,
        location,
        occupation,
        socialLinks: {
          twitter: twitter || "",
          linkedin: linkedin || "",
          instagram: instagram || "",
        },
      };

      // If new picture uploaded
      if (req.file) {
        updateData.picturePath = req.file.filename;
      }

      const updatedUser = await User.findByIdAndUpdate(id, updateData, {
        new: true,
      });
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);
export default router;
