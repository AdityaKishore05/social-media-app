// controllers/notifications.js
import Notification from "../models/Notification.js";
import User from "../models/User.js";

// Get notifications for a user (latest first)
export const getNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const notes = await Notification.find({ toUserId: userId })
      .sort({ createdAt: -1 })
      .lean();

    // Enrich with fromUser info for frontend convenience
    const enriched = await Promise.all(
      notes.map(async (n) => {
        const fromUser = await User.findById(n.fromUserId).select(
          "firstName lastName picturePath"
        );
        return {
          ...n,
          fromUserName: fromUser
            ? `${fromUser.firstName} ${fromUser.lastName}`
            : "Unknown",
          fromUserPicture: fromUser ? fromUser.picturePath : "",
        };
      })
    );

    res.status(200).json(enriched);
  } catch (err) {
    console.error("GET NOTIFICATIONS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// Mark all notifications as read for a user
export const markAllRead = async (req, res) => {
  try {
    const { userId } = req.params;
    await Notification.updateMany(
      { toUserId: userId },
      { $set: { isRead: true } }
    );
    res.status(200).json({ message: "Marked all as read" });
  } catch (err) {
    console.error("MARK READ ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// Accept friend request action (example)
export const acceptFriendRequest = async (req, res) => {
  try {
    const { userId } = req.params; // the recipient who accepts
    const { requesterId } = req.body; // the one who requested
    // your friend-accept logic here: add to friends lists etc.
    // (example) notify the requester that their request was accepted:
    await Notification.create({
      toUserId: requesterId,
      fromUserId: userId,
      type: "friend_accept",
    });

    // return OK
    res.status(200).json({ message: "Friend request accepted" });
  } catch (err) {
    console.error("ACCEPT FRIEND ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// Decline/delete friend request (just remove request and optionally notify)
export const declineFriendRequest = async (req, res) => {
  try {
    const { userId } = req.params; // the recipient who declines
    const { requesterId } = req.body;
    // remove request logic...
    res.status(200).json({ message: "Friend request declined" });
  } catch (err) {
    console.error("DECLINE FRIEND ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};
