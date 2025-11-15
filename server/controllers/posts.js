// controllers/posts.js
import Post from "../models/Post.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

/**
 * Utility: emit notification to online sockets (if any)
 * NOTE: req.app must have "io" and "onlineUsers"
 */
const emitNotification = (req, note) => {
  try {
    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");
    if (!io || !onlineUsers) return;
    const sockets = onlineUsers.get(note.toUserId);
    if (sockets) {
      for (const sid of sockets) {
        io.to(sid).emit("notification", note);
      }
    }
  } catch (err) {
    console.error("emitNotification error", err);
  }
};

/* CREATE POST */
export const createPost = async (req, res) => {
  try {
    const { userId, description } = req.body;
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

    if (!userId)
      return res.status(400).json({ message: "User ID is required" });

    const hasFiles = req.files && req.files.length > 0;
    if (!description?.trim() && !hasFiles) {
      return res
        .status(400)
        .json({ message: "Post must have either description or media" });
    }

    let mediaItems = [];
    if (hasFiles) {
      for (const file of req.files) {
        if (file.mimetype.startsWith("image/") && file.size > MAX_IMAGE_SIZE) {
          // delete from cloudinary if already uploaded
          if (file.public_id) cloudinary.uploader.destroy(file.public_id);
          return res
            .status(400)
            .json({
              message: `Image '${file.originalname}' exceeds 10MB limit.`,
            });
        }
      }
      mediaItems = req.files.map((file) => ({
        url: file.path,
        type: file.mimetype.startsWith("video/") ? "video" : "image",
        publicId: file.public_id,
      }));
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const newPost = new Post({
      userId,
      firstName: user.firstName,
      lastName: user.lastName,
      description: description?.trim() || "",
      userPicturePath: user.picturePath,
      mediaItems,
      likes: {},
      comments: [],
    });

    await newPost.save();

    // Notify followers of new post
    const followers = user.followers || [];
    const notificationsToCreate = followers
      .filter((f) => f !== userId)
      .map((followerId) => ({
        toUserId: followerId,
        fromUserId: userId,
        type: "new_post",
        postId: newPost._id,
      }));
    if (notificationsToCreate.length > 0) {
      const created = await Notification.insertMany(notificationsToCreate);
      // emit to followers who are online
      created.forEach((note) => emitNotification(req, note));
    }

    // Return feed (populated)
    const posts = await Post.find().sort({ createdAt: -1 });
    const populatedPosts = await Promise.all(
      posts.map(async (post) => {
        const postUser = await User.findById(post.userId);
        if (!postUser) return null;
        return {
          ...post._doc,
          firstName: postUser.firstName,
          lastName: postUser.lastName,
          userPicturePath: postUser.picturePath,
          picturePath: post.picturePath || "",
          videoPath: post.videoPath || "",
        };
      })
    );

    res.status(201).json(populatedPosts.filter(Boolean));
  } catch (err) {
    console.error("CREATE POST ERROR:", err);
    if (req.files)
      req.files.forEach(
        (f) => f.public_id && cloudinary.uploader.destroy(f.public_id)
      );
    res.status(500).json({ message: err.message });
  }
};

/* GET FEED POSTS */
export const getFeedPosts = async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    const postsWithUser = await Promise.all(
      posts.map(async (post) => {
        const user = await User.findById(post.userId);
        if (!user) return null;
        return {
          ...post._doc,
          firstName: user.firstName,
          lastName: user.lastName,
          userPicturePath: user.picturePath,
          picturePath: post.picturePath || "",
          videoPath: post.videoPath || "",
        };
      })
    );
    res.status(200).json(postsWithUser.filter(Boolean));
  } catch (err) {
    console.error("GET FEED POSTS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

/* GET USER POSTS */
export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const posts = await Post.find({ userId }).sort({ createdAt: -1 });
    const postsWithUser = await Promise.all(
      posts.map(async (post) => {
        const user = await User.findById(post.userId);
        if (!user) return null;
        return {
          ...post._doc,
          firstName: user.firstName,
          lastName: user.lastName,
          userPicturePath: user.picturePath,
          picturePath: post.picturePath || "",
          videoPath: post.videoPath || "",
        };
      })
    );
    res.status(200).json(postsWithUser.filter(Boolean));
  } catch (err) {
    console.error("GET USER POSTS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

/* LIKE POST */
export const likePost = async (req, res) => {
  try {
    const { id } = req.params; // post id
    const { userId } = req.body;
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const isLiked = post.likes.get(userId);
    if (isLiked) post.likes.delete(userId);
    else post.likes.set(userId, true);

    await post.save();

    // create notification only when newly liked and not liking own post
    if (!isLiked && post.userId !== userId) {
      const note = await Notification.create({
        toUserId: post.userId,
        fromUserId: userId,
        type: "like",
        postId: post._id,
      });
      emitNotification(req, note);
    }

    const postOwner = await User.findById(post.userId);
    const populatedPost = {
      ...post._doc,
      firstName: postOwner.firstName,
      lastName: postOwner.lastName,
      userPicturePath: postOwner.picturePath,
      picturePath: post.picturePath || "",
      videoPath: post.videoPath || "",
    };

    res.status(200).json(populatedPost);
  } catch (err) {
    console.error("LIKE POST ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

/* LIKE COMMENT */
export const likeComment = async (req, res) => {
  try {
    // router should be: router.patch("/:postId/comment/:commentId/like", ...)
    const { postId, commentId } = req.params;
    const { userId } = req.body;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // ensure comment.likes is a Map-like
    if (!comment.likes) comment.likes = new Map();
    const isLiked = comment.likes.get(userId);
    if (isLiked) comment.likes.delete(userId);
    else comment.likes.set(userId, true);

    await post.save();

    if (!isLiked && comment.userId && comment.userId !== userId) {
      const note = await Notification.create({
        toUserId: comment.userId,
        fromUserId: userId,
        type: "like_comment",
        postId: post._id,
        commentId,
      });
      emitNotification(req, note);
    }

    const postOwner = await User.findById(post.userId);
    const populatedPost = {
      ...post._doc,
      firstName: postOwner.firstName,
      lastName: postOwner.lastName,
      userPicturePath: postOwner.picturePath,
      picturePath: post.picturePath || "",
      videoPath: post.videoPath || "",
    };

    res.status(200).json(populatedPost);
  } catch (err) {
    console.error("LIKE COMMENT ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

/* COMMENT POST */
export const commentPost = async (req, res) => {
  try {
    const { id } = req.params; // post id
    const { userId, commentText } = req.body;

    if (!commentText?.trim())
      return res.status(400).json({ message: "Comment text cannot be empty." });

    const post = await Post.findById(id);
    const user = await User.findById(userId);
    if (!post) return res.status(404).json({ message: "Post not found." });
    if (!user) return res.status(404).json({ message: "User not found." });

    const newComment = {
      _id: new mongoose.Types.ObjectId(),
      userId,
      firstName: user.firstName,
      lastName: user.lastName,
      userPicturePath: user.picturePath,
      commentText: commentText.trim(),
      createdAt: new Date(),
      likes: {},
    };

    post.comments.push(newComment);
    await post.save();

    if (post.userId !== userId) {
      const note = await Notification.create({
        toUserId: post.userId,
        fromUserId: userId,
        type: "comment",
        postId: post._id,
      });
      emitNotification(req, note);
    }

    const postUser = await User.findById(post.userId);
    const populatedPost = {
      ...post._doc,
      firstName: postUser.firstName,
      lastName: postUser.lastName,
      userPicturePath: postUser.picturePath,
      picturePath: post.picturePath || "",
      videoPath: post.videoPath || "",
    };

    res.status(200).json(populatedPost);
  } catch (err) {
    console.error("COMMENT POST ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

/* DELETE POST */
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const profileUserId = req.query.userId;

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found." });
    if (post.userId !== userId)
      return res
        .status(403)
        .json({ message: "Not authorized to delete this post." });

    await Post.findByIdAndDelete(id);

    const posts = profileUserId
      ? await Post.find({ userId: profileUserId }).sort({ createdAt: -1 })
      : await Post.find().sort({ createdAt: -1 });

    const populatedPosts = await Promise.all(
      posts.map(async (p) => {
        const postUser = await User.findById(p.userId);
        if (!postUser) return null;
        return {
          ...p._doc,
          firstName: postUser.firstName,
          lastName: postUser.lastName,
          userPicturePath: postUser.picturePath,
          picturePath: p.picturePath || "",
          videoPath: p.videoPath || "",
        };
      })
    );

    res.status(200).json(populatedPosts.filter(Boolean));
  } catch (err) {
    console.error("DELETE POST ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

/* GET NOTIFICATIONS (helpful helper if you want to include here) */
export const getNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const notes = await Notification.find({ toUserId: userId })
      .sort({ createdAt: -1 })
      .lean();
    // optionally enrich with fromUserName/fromUserPicture
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
