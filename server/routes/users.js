import express from "express";
import {
  getUser,
  getUserFriends,
  addRemoveFriend,
} from "../controllers/users.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/* READ */
router.get("/:id", verifyToken, getUser);
router.get("/:id/friends", verifyToken, getUserFriends);

/* UPDATE */
router.patch("/:id/:friendId", verifyToken, addRemoveFriend);
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
