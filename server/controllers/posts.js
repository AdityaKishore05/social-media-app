import Post from "../models/Post.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

/* ===========================
   CREATE POST
=========================== */
export const createPost = async (req, res) => {
  try {
    const { userId, description } = req.body;
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const hasFiles = req.files && req.files.length > 0;
    if (!description?.trim() && !hasFiles) {
      return res.status(400).json({
        message: "Post must have either description or media",
      });
    }

    let mediaItems = [];

    if (hasFiles) {
      for (const file of req.files) {
        if (file.mimetype.startsWith("image/") && file.size > MAX_IMAGE_SIZE) {
          cloudinary.uploader.destroy(file.public_id);
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
    if (req.files) {
      req.files.forEach((file) => cloudinary.uploader.destroy(file.public_id));
    }
    res.status(500).json({ message: err.message });
  }
};

/* ===========================
   GET FEED POSTS
=========================== */
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

/* ===========================
   GET USER POSTS
=========================== */
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

/* ===========================
   LIKE POST
=========================== */
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

    const user = await User.findById(post.userId);
    const populatedPost = {
      ...post._doc,
      firstName: user.firstName,
      lastName: user.lastName,
      userPicturePath: user.picturePath,
      picturePath: post.picturePath || "",
      videoPath: post.videoPath || "",
    };

    res.status(200).json(populatedPost);
  } catch (err) {
    console.error("LIKE POST ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ===========================
   LIKE COMMENT
=========================== */
export const likeComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params; // ✅ must match your router
    const { userId } = req.body;

    console.log("🧩 likeComment hit:", { postId, commentId, userId }); // debug log

    // 1️⃣ Find post
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // 2️⃣ Find comment
    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // 3️⃣ Toggle like
    if (!comment.likes) comment.likes = new Map();
    const isLiked = comment.likes.get(userId);
    if (isLiked) {
      comment.likes.delete(userId);
    } else {
      comment.likes.set(userId, true);
    }

    // 4️⃣ Save the updated post
    await post.save();

    // 5️⃣ Fetch with user info (to send to frontend)
    const user = await User.findById(post.userId);
    const populatedPost = {
      ...post._doc,
      firstName: user.firstName,
      lastName: user.lastName,
      userPicturePath: user.picturePath,
      picturePath: post.picturePath || "",
      videoPath: post.videoPath || "",
    };

    console.log("✅ Comment like toggled successfully");
    res.status(200).json(populatedPost);
  } catch (err) {
    console.error("❌ LIKE COMMENT ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};



/* ===========================
   COMMENT ON POST
=========================== */
export const commentPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, commentText } = req.body;

    if (!commentText?.trim()) {
      return res.status(400).json({ message: "Comment text cannot be empty." });
    }

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
      likes: {}, // ✅ ensure likes field exists
    };

    post.comments.push(newComment);
    await post.save();

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

/* ===========================
   DELETE POST
=========================== */
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const profileUserId = req.query.userId;

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found." });

    if (post.userId !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this post." });
    }

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
