import User from "../models/User.js";
import { logger } from "../utils/logger.js";

/* READ */
export const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const getUserFriends = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("friends").lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Batch fetch all friends
    const friends = await User.find({ _id: { $in: user.friends } })
      .select("_id firstName lastName picturePath")
      .lean();

    res.status(200).json(friends);
  } catch (err) {
    logger.error("GET USER FRIENDS ERROR:", err);
    res.status(404).json({ message: err.message });
  }
};

/* UPDATE */
export const addRemoveFriend = async (req, res) => {
  try {
    const { id, friendId } = req.params;

    // Find both users
    const user = await User.findById(id);
    const friend = await User.findById(friendId);

    if (!user || !friend) {
      return res.status(404).json({ message: "User or friend not found" });
    }

    const isAlreadyFriend = user.friends.includes(friendId);

    if (isAlreadyFriend) {
      // Remove friend - use updateOne to avoid validation issues
      await User.updateOne({ _id: id }, { $pull: { friends: friendId } });
      await User.updateOne({ _id: friendId }, { $pull: { friends: id } });
    } else {
      // Add friend - use updateOne to avoid validation issues
      await User.updateOne({ _id: id }, { $addToSet: { friends: friendId } });
      await User.updateOne({ _id: friendId }, { $addToSet: { friends: id } });
    }

    // Get updated user with populated friends
    const updatedUser = await User.findById(id).select("friends").lean();
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const friends = await User.find({ _id: { $in: updatedUser.friends } })
      .select("_id firstName lastName picturePath")
      .lean();
    // Lines 74-75 - CORRECT
    res.status(200).json(friends);
  } catch (err) {
    logger.error("Error in addRemoveFriend:", err);
    res.status(500).json({ message: err.message });
  }
};
