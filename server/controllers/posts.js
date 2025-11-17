// controllers/posts.js
import Post from "../models/Post.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import { logger } from "../utils/logger.js";

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
          return res.status(400).json({
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

    // Line 45 - FIXED
    const user = await User.findById(userId)
      .select("firstName lastName picturePath")
      .lean();
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

    // Return feed (populated) - FIXED VERSION
    const query = { isDeleted: { $ne: true } };
    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    // Batch fetch all unique user IDs
    const userIds = [...new Set(posts.map((p) => p.userId))];
    const users = await User.find({ _id: { $in: userIds } })
      .select("firstName lastName picturePath")
      .lean();

    // Create a map for O(1) lookup
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const populatedPosts = posts
      .map((post) => {
        const postUser = userMap.get(post.userId);
        if (!postUser) return null;
        return {
          ...post,
          firstName: postUser.firstName,
          lastName: postUser.lastName,
          userPicturePath: postUser.picturePath,
          picturePath: post.picturePath || "",
          videoPath: post.videoPath || "",
        };
      })
      .filter(Boolean);

    res.status(201).json(populatedPosts);
  } catch (err) {
    logger.error("CREATE POST ERROR:", err);
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { isDeleted: { $ne: true } };
    const totalPosts = await Post.countDocuments(query);

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Batch fetch all unique user IDs
    const userIds = [...new Set(posts.map((p) => p.userId))];
    const users = await User.find({ _id: { $in: userIds } })
      .select("firstName lastName picturePath")
      .lean();

    // Create a map for O(1) lookup
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    // Map posts with user data
    const postsWithUser = posts
      .map((post) => {
        const user = userMap.get(post.userId);
        if (!user) return null;
        return {
          ...post,
          firstName: user.firstName,
          lastName: user.lastName,
          userPicturePath: user.picturePath,
          picturePath: post.picturePath || "",
          videoPath: post.videoPath || "",
        };
      })
      .filter(Boolean);

    res.status(200).json({
      posts: postsWithUser,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
      totalPosts,
    });
  } catch (err) {
    logger.error("GET FEED POSTS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

/* GET USER POSTS */
export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { userId, isDeleted: { $ne: true } };
    const totalPosts = await Post.countDocuments(query);

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Fetch user data once
    const user = await User.findById(userId)
      .select("firstName lastName picturePath")
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const postsWithUser = posts.map((post) => ({
      ...post,
      firstName: user.firstName,
      lastName: user.lastName,
      userPicturePath: user.picturePath,
      picturePath: post.picturePath || "",
      videoPath: post.videoPath || "",
    }));

    res.status(200).json({
      posts: postsWithUser,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
      totalPosts,
    });
  } catch (err) {
    logger.error("GET USER POSTS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

/* LIKE POST */
export const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const isLiked = post.likes.get(userId);
    if (isLiked) post.likes.delete(userId);
    else post.likes.set(userId, true);

    await post.save();

    const postOwner = await User.findById(post.userId)
      .select("firstName lastName picturePath")
      .lean();

    if (!postOwner) {
      return res.status(404).json({ message: "Post owner not found" });
    }

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
    logger.error("LIKE POST ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

/* LIKE COMMENT */
export const likeComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { userId } = req.body;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (!comment.likes) comment.likes = new Map();
    const isLiked = comment.likes.get(userId);
    if (isLiked) comment.likes.delete(userId);
    else comment.likes.set(userId, true);

    await post.save();

    const postOwner = await User.findById(post.userId)
      .select("firstName lastName picturePath")
      .lean();

    if (!postOwner) {
      return res.status(404).json({ message: "Post owner not found" });
    }

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
    logger.error("LIKE COMMENT ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

/* COMMENT POST */
export const commentPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, commentText } = req.body;

    if (!commentText?.trim())
      return res.status(400).json({ message: "Comment text cannot be empty." });

    const post = await Post.findById(id);
    const user = await User.findById(userId)
      .select("firstName lastName picturePath")
      .lean();

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
      likes: new Map(),
    };

    post.comments.push(newComment);
    await post.save();

    const postUser = await User.findById(post.userId)
      .select("firstName lastName picturePath")
      .lean();

    if (!postUser) {
      return res.status(404).json({ message: "Post owner not found" });
    }

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
    logger.error("COMMENT POST ERROR:", err);
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

    // Use soft delete instead of hard delete
    await post.softDelete();

    // Get updated posts list
    const query = profileUserId
      ? { userId: profileUserId, isDeleted: { $ne: true } }
      : { isDeleted: { $ne: true } };

    const posts = await Post.find(query).sort({ createdAt: -1 }).lean();

    // Batch fetch users for better performance
    const userIds = [...new Set(posts.map((p) => p.userId))];
    const users = await User.find({ _id: { $in: userIds } })
      .select("firstName lastName picturePath")
      .lean();

    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const populatedPosts = posts
      .map((p) => {
        const postUser = userMap.get(p.userId);
        if (!postUser) return null;
        return {
          ...p,
          firstName: postUser.firstName,
          lastName: postUser.lastName,
          userPicturePath: postUser.picturePath,
          picturePath: p.picturePath || "",
          videoPath: p.videoPath || "",
        };
      })
      .filter(Boolean);

    res.status(200).json(populatedPosts);
  } catch (err) {
    logger.error("DELETE POST ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ===========================
   DELETE COMMENT
=========================== */
export const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { userId } = req.body;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // Only post owner OR comment owner can delete
    if (post.userId !== userId && comment.userId !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this comment" });
    }

    // Remove comment
    post.comments = post.comments.filter(
      (c) => c._id.toString() !== commentId.toString()
    );

    await post.save();

    // Line 414 - FIXED
    const postUser = await User.findById(post.userId)
      .select("firstName lastName picturePath")
      .lean();

    if (!postUser) {
      return res.status(404).json({ message: "Post owner not found" });
    }

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
    logger.error("DELETE COMMENT ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};
