import Post from "../models/Post.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

/* CREATE */
export const createPost = async (req, res) => {
  try {
    console.log("=== CREATE POST REQUEST ===");
    console.log("Body:", req.body);
    console.log("Files:", req.files ? req.files.length : 0);

    const { userId, description, mediaType } = req.body;

    // Validate required fields
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    if (!description?.trim() && (!req.files || req.files.length === 0)) {
      return res.status(400).json({
        message: "Post must have either description or media",
      });
    }

    let mediaItems = [];

    // Process uploaded files
    if (req.files && req.files.length > 0) {
      console.log(`Processing ${req.files.length} media files...`);

      try {
        for (let i = 0; i < req.files.length; i++) {
          const file = req.files[i];
          console.log(`Uploading file ${i + 1}:`, {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            hasBuffer: !!file.buffer,
          });

          // Check if buffer exists
          if (!file.buffer) {
            throw new Error(`File buffer is missing for ${file.originalname}`);
          }

          const isVideo = file.mimetype.startsWith("video/");

          // Convert buffer to base64
          const fileStr = `data:${file.mimetype};base64,${file.buffer.toString(
            "base64"
          )}`;

          // Upload to Cloudinary
          const uploadResult = await cloudinary.uploader.upload(fileStr, {
            resource_type: isVideo ? "video" : "image",
            folder: "social-media-app",
            timeout: 60000, // 60 second timeout
          });

          console.log(
            `File ${i + 1} uploaded successfully:`,
            uploadResult.secure_url
          );

          mediaItems.push({
            url: uploadResult.secure_url,
            type: isVideo ? "video" : "image",
            publicId: uploadResult.public_id, // Store for potential deletion later
          });
        }
        console.log(`All ${mediaItems.length} files uploaded successfully`);
      } catch (uploadError) {
        console.error("CLOUDINARY UPLOAD ERROR:", uploadError);
        return res.status(500).json({
          message: "Failed to upload media to cloud storage",
          error: uploadError.message,
          details: uploadError.stack,
        });
      }
    }

    // Get user information
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("Creating post for user:", user.firstName, user.lastName);

    // Create new post
    const newPost = new Post({
      userId,
      firstName: user.firstName,
      lastName: user.lastName,
      description: description?.trim() || "",
      userPicturePath: user.picturePath,
      mediaItems: mediaItems,
      likes: {},
      comments: [],
    });

    await newPost.save();
    console.log("Post created successfully:", newPost._id);

    // Set no-cache headers
    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      Pragma: "no-cache",
      Expires: "0",
    });

    // Fetch all posts sorted by newest first
    const allPosts = await Post.find().sort({ createdAt: -1 });

    // Populate user information for each post
    const populatedPosts = await Promise.all(
      allPosts.map(async (post) => {
        try {
          const postUser = await User.findById(post.userId);
          if (!postUser) {
            console.warn(`User not found for post ${post._id}`);
            return null;
          }

          return {
            ...post._doc,
            firstName: postUser.firstName,
            lastName: postUser.lastName,
            userPicturePath: postUser.picturePath,
          };
        } catch (err) {
          console.error(`Error populating post ${post._id}:`, err);
          return null;
        }
      })
    );

    // Filter out any null posts
    const validPosts = populatedPosts.filter((post) => post !== null);

    console.log(`Returning ${validPosts.length} posts`);
    res.status(201).json(validPosts);
  } catch (err) {
    console.error("CREATE POST ERROR:", err);
    console.error("Error stack:", err.stack);

    res.status(500).json({
      message: "Internal server error occurred while creating post",
      error: err.message,
      // Only include stack trace in development
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }
};

/* READ */
export const getFeedPosts = async (req, res) => {
  try {
    console.log("Fetching all feed posts");

    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      Pragma: "no-cache",
      Expires: "0",
      "Last-Modified": new Date().toUTCString(),
    });

    const posts = await Post.find().sort({ createdAt: -1 });
    const postsWithUserInfo = await Promise.all(
      posts.map(async (post) => {
        const user = await User.findById(post.userId);
        if (!user) {
          console.warn(`User not found for post ${post._id}`);
          return null;
        }

        return {
          ...post._doc,
          firstName: user.firstName,
          lastName: user.lastName,
          userPicturePath: user.picturePath,
        };
      })
    );

    const validPosts = postsWithUserInfo.filter((post) => post !== null);
    console.log(`Sending ${validPosts.length} posts to frontend`);
    res.status(200).json(validPosts);
  } catch (err) {
    console.error("GET FEED POSTS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("Fetching posts for user:", userId);

    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      Pragma: "no-cache",
      Expires: "0",
      "Last-Modified": new Date().toUTCString(),
    });

    const posts = await Post.find({ userId }).sort({ createdAt: -1 });
    const postsWithUserInfo = await Promise.all(
      posts.map(async (post) => {
        const user = await User.findById(post.userId);
        if (!user) return null;

        return {
          ...post._doc,
          firstName: user.firstName,
          lastName: user.lastName,
          userPicturePath: user.picturePath,
        };
      })
    );

    const validPosts = postsWithUserInfo.filter((post) => post !== null);
    console.log(`Sending ${validPosts.length} user posts`);
    res.status(200).json(validPosts);
  } catch (err) {
    console.error("GET USER POSTS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

/* UPDATE */
export const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const isLiked = post.likes.get(userId);
    if (isLiked) {
      post.likes.delete(userId);
    } else {
      post.likes.set(userId, true);
    }

    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { likes: post.likes },
      { new: true }
    );

    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      Pragma: "no-cache",
      Expires: "0",
    });

    const user = await User.findById(updatedPost.userId);
    const populatedPost = {
      ...updatedPost._doc,
      firstName: user.firstName,
      lastName: user.lastName,
      userPicturePath: user.picturePath,
    };

    res.status(200).json(populatedPost);
  } catch (err) {
    console.error("LIKE POST ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

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
    };

    post.comments.push(newComment);
    const updatedPost = await post.save();

    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      Pragma: "no-cache",
      Expires: "0",
    });

    const postUser = await User.findById(updatedPost.userId);
    const populatedPost = {
      ...updatedPost._doc,
      firstName: postUser.firstName,
      lastName: postUser.lastName,
      userPicturePath: postUser.picturePath,
    };

    res.status(200).json(populatedPost);
  } catch (err) {
    console.error("COMMENT POST ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

/* DELETE */
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    if (post.userId !== userId) {
      return res.status(403).json({
        message: "You are not authorized to delete this post.",
      });
    }

    await Post.findByIdAndDelete(id);

    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      Pragma: "no-cache",
      Expires: "0",
    });

    const allPosts = await Post.find().sort({ createdAt: -1 });
    const populatedPosts = await Promise.all(
      allPosts.map(async (p) => {
        const postUser = await User.findById(p.userId);
        if (!postUser) return null;

        return {
          ...p._doc,
          firstName: postUser.firstName,
          lastName: postUser.lastName,
          userPicturePath: postUser.picturePath,
        };
      })
    );

    const validPosts = populatedPosts.filter((post) => post !== null);
    res.status(200).json(validPosts);
  } catch (err) {
    console.error("DELETE POST ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};
