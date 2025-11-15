// models/Notification.js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  toUserId: { type: String, required: true }, // who receives the notif
  fromUserId: { type: String, required: true }, // who triggered it
  type: {
    type: String,
    enum: [
      "like",
      "comment",
      "friend_request",
      "friend_accept",
      "new_post",
      "like_comment",
    ],
    required: true,
  },
  postId: { type: String, default: null },
  commentId: { type: String, default: null },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Notification", notificationSchema);
