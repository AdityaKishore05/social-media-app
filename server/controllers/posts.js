import Post from "../models/Post.js";
import User from "../models/User.js";
import cloudinary from "cloudinary";
import mongoose from "mongoose";

/* CREATE */
export const createPost = async (req, res) => {
  try {
    const { userId, description, mediaType } = req.body;
    let mediaPath = null;

    console.log(
      "Creating post - userId:",
      userId,
      "mediaType:",
      mediaType,
      "hasFile:",
      !!req.file
    );

    // FIXED: Handle Cloudinary upload if file exists
    if (req.file) {
      try {
        // Convert buffer to base64
        const fileStr = `data:${
          req.file.mimetype
        };base64,${req.file.buffer.toString("base64")}`;

        // Upload to Cloudinary
        const uploadResult = await cloudinary.v2.uploader.upload(fileStr, {
          resource_type: mediaType === "video" ? "video" : "image",
          folder: "social-media-app",
        });

        mediaPath = uploadResult.secure_url;
        console.log("Media uploaded to Cloudinary:", mediaPath);
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({
          message: "Failed to upload media",
          error: uploadError.message,
        });
      }
    }

    // Validation
    if (!description?.trim() && !mediaPath) {
      return res.status(400).json({
        message: "Post must include a description or media.",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found. Cannot create post.",
      });
    }

    const newPost = new Post({
      userId,
      firstName: user.firstName,
      lastName: user.lastName,
      location: user.location,
      description: description?.trim() || "",
      userPicturePath: user.picturePath,
      likes: {},
      comments: [],
    });

    // FIXED: Set media path based on type
    if (mediaPath) {
      if (mediaType === "image") {
        newPost.picturePath = mediaPath;
      } else if (mediaType === "video") {
        newPost.videoPath = mediaPath;
      }
    }

    await newPost.save();
    console.log("Post created successfully:", newPost._id);

    // FIXED: Add no-cache headers
    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      Pragma: "no-cache",
      Expires: "0",
    });

    // Return all posts with proper user info
    const allPosts = await Post.find().sort({ createdAt: -1 });
    const populatedPosts = await Promise.all(
      allPosts.map(async (post) => {
        const postUser = await User.findById(post.userId);
        return {
          ...post._doc,
          firstName: postUser.firstName,
          lastName: postUser.lastName,
          location: postUser.location,
          userPicturePath: postUser.picturePath,
        };
      })
    );

    res.status(201).json(populatedPosts);
  } catch (err) {
    console.error("CREATE POST ERROR:", err);
    res.status(500).json({
      message: "An internal server error occurred.",
      error: err.message,
    });
  }
};

/* READ */
export const getFeedPosts = async (req, res) => {
  try {
    console.log("Fetching all feed posts");

    // FIXED: Add no-cache headers
    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      Pragma: "no-cache",
      Expires: "0",
      "Last-Modified": new Date().toUTCString(),
    });

    const posts = await Post.find().sort({ createdAt: -1 });

    // FIXED: Populate each post with current user information
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
          location: user.location,
          userPicturePath: user.picturePath,
        };
      })
    );

    // Filter out null posts (where user was not found)
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

    // FIXED: Add no-cache headers
    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      Pragma: "no-cache",
      Expires: "0",
      "Last-Modified": new Date().toUTCString(),
    });

    const posts = await Post.find({ userId }).sort({ createdAt: -1 });

    // FIXED: Populate each post with current user information
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
          location: user.location,
          userPicturePath: user.picturePath,
        };
      })
    );

    // Filter out null posts
    const validPosts = postsWithUserInfo.filter((post) => post !== null);

    console.log(`Sending ${validPosts.length} user posts for ${userId}`);
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

    console.log("Liking post:", id, "by user:", userId);

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

    // FIXED: Add no-cache headers
    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      Pragma: "no-cache",
      Expires: "0",
    });

    // FIXED: Return populated post with user info
    const user = await User.findById(updatedPost.userId);
    const populatedPost = {
      ...updatedPost._doc,
      firstName: user.firstName,
      lastName: user.lastName,
      location: user.location,
      userPicturePath: user.picturePath,
    };

    console.log("Like updated successfully for post:", id);
    res.status(200).json(populatedPost);
  } catch (err) {
    console.error("LIKE POST ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// FIXED: Renamed from addComment to match your route
export const commentPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, commentText } = req.body;

    console.log("Adding comment to post:", id, "by user:", userId);

    if (!commentText?.trim()) {
      return res.status(400).json({ message: "Comment text cannot be empty." });
    }

    const post = await Post.findById(id);
    const user = await User.findById(userId);

    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // FIXED: Create proper comment object with _id
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

    // FIXED: Add no-cache headers
    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      Pragma: "no-cache",
      Expires: "0",
    });

    // FIXED: Return populated post with user info
    const postUser = await User.findById(updatedPost.userId);
    const populatedPost = {
      ...updatedPost._doc,
      firstName: postUser.firstName,
      lastName: postUser.lastName,
      location: postUser.location,
      userPicturePath: postUser.picturePath,
    };

    console.log("Comment added successfully to post:", id);
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

    console.log("Deleting post:", id, "by user:", userId);

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

    // FIXED: Add no-cache headers
    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      Pragma: "no-cache",
      Expires: "0",
    });

    // FIXED: Return updated posts list with proper user info
    const allPosts = await Post.find().sort({ createdAt: -1 });
    const populatedPosts = await Promise.all(
      allPosts.map(async (p) => {
        const postUser = await User.findById(p.userId);
        if (!postUser) return null;

        return {
          ...p._doc,
          firstName: postUser.firstName,
          lastName: postUser.lastName,
          location: postUser.location,
          userPicturePath: postUser.picturePath,
        };
      })
    );

    // Filter out null posts
    const validPosts = populatedPosts.filter((post) => post !== null);

    console.log("Post deleted successfully:", id);
    res.status(200).json(validPosts);
  } catch (err) {
    console.error("DELETE POST ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};
