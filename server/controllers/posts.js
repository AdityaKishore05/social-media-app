import Post from "../models/Post.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

/* CREATE POST */
export const createPost = async (req, res) => {
  console.log("\n==========================================");
  console.log("CREATE POST REQUEST RECEIVED (CLOUDINARY)");
  console.log("==========================================");

  try {
    const { userId, description } = req.body;
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

    // === 1. VALIDATE INPUT ===
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const hasFiles = req.files && req.files.length > 0;
    if (!description?.trim() && !hasFiles) {
      return res.status(400).json({
        message: "Post must have either description or media",
      });
    }

    console.log("--- Validation Passed ---");
    let mediaItems = [];

    // === 2. PROCESS UPLOADED FILES ===
    if (hasFiles) {
      console.log(`Processing ${req.files.length} files from Cloudinary...`);

      // === Custom Validation: Check for images > 10MB ===
      for (const file of req.files) {
        if (
          file.mimetype.startsWith("image/") &&
          file.size > MAX_IMAGE_SIZE
        ) {
          // File is already on Cloudinary, we must delete it
          console.error(
            `ERROR: Image ${file.originalname} is ${
              file.size / 1024 / 1024
            }MB (max 10MB).`
          );
          
          // Asynchronously delete the oversized file from Cloudinary
          cloudinary.uploader.destroy(file.public_id, (err, result) => {
            if (err) console.error("Failed to delete oversized file:", err);
            else console.log("Oversized file deleted:", result);
          });

          // Return error to user
          return res.status(400).json({
            message: `Image '${file.originalname}' is too large. Maximum 10MB for images.`,
          });
        }
      }
      // === End Custom Validation ===

      // Map files to the format expected by the Post model
      mediaItems = req.files.map((file) => {
        console.log(` - File: ${file.originalname}, URL: ${file.path}`);
        return {
          url: file.path, // This is the secure_url from Cloudinary
          type: file.mimetype.startsWith("video/") ? "video" : "image",
          publicId: file.public_id, // Store this so we can delete it later
        };
      });

      console.log(`✓ All ${mediaItems.length} files processed.`);
    }

    // === 3. GET USER INFO ===
    console.log("\n--- Fetching User Information ---");
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    console.log("✓ User found:", user.firstName, user.lastName);

    // === 4. CREATE NEW POST ===
    console.log("\n--- Creating Post Document ---");
    const newPost = new Post({
      userId,
      firstName: user.firstName,
      lastName: user.lastName,
      description: description?.trim() || "",
      userPicturePath: user.picturePath,
      mediaItems: mediaItems, // Save the new media array
      likes: {},
      comments: [],
    });

    await newPost.save();
    console.log("✓ Post saved successfully!");

    // === 5. RETURN ALL POSTS (Refreshed feed) ===
    console.log("\n--- Fetching All Posts ---");
    const allPosts = await Post.find().sort({ createdAt: -1 });

    // Populate user info
    const populatedPosts = await Promise.all(
      allPosts.map(async (post) => {
        const postUser = await User.findById(post.userId);
        if (!postUser) return null;
        return {
          ...post._doc,
          firstName: postUser.firstName,
          lastName: postUser.lastName,
          userPicturePath: postUser.picturePath,
          picturePath: post.picturePath || "", // Keep for backward compatibility
          videoPath: post.videoPath || "", // Keep for backward compatibility
        };
      })
    );

    const validPosts = populatedPosts.filter((post) => post !== null);
    console.log("\n✓✓✓ POST CREATED SUCCESSFULLY ✓✓✓");
    console.log("==========================================\n");

    res.status(201).json(validPosts);

  } catch (err) {
    console.error("\n✗✗✗ CREATE POST ERROR ✗✗✗");
    console.error("Error:", err.message);
    
    // If files were uploaded before the error, try to delete them
    if (req.files && req.files.length > 0) {
      console.log("Rolling back Cloudinary uploads due to error...");
      for (const file of req.files) {
        cloudinary.uploader.destroy(file.public_id);
      }
    }
    
    res.status(500).json({
      message: "Internal server error occurred while creating post",
      error: err.message,
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

        // Return post with ALL fields (new and old format)
        return {
          ...post._doc,
          firstName: user.firstName,
          lastName: user.lastName,
          userPicturePath: user.picturePath,
          // Explicitly include old format fields
          picturePath: post.picturePath || "",
          videoPath: post.videoPath || "",
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

        // Return post with ALL fields (new and old format)
        return {
          ...post._doc,
          firstName: user.firstName,
          lastName: user.lastName,
          userPicturePath: user.picturePath,
          // Explicitly include old format fields
          picturePath: post.picturePath || "",
          videoPath: post.videoPath || "",
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
      // Include old format fields
      picturePath: updatedPost.picturePath || "",
      videoPath: updatedPost.videoPath || "",
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
      // Include old format fields
      picturePath: updatedPost.picturePath || "",
      videoPath: updatedPost.videoPath || "",
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
    const profileUserId = req.query.userId; // Get from query param

    console.log("DELETE POST REQUEST:", {
      postId: id,
      requestingUser: userId,
      profileUserId: profileUserId,
    });

    // Find and verify the post
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    // Check authorization
    if (post.userId !== userId) {
      return res.status(403).json({
        message: "You are not authorized to delete this post.",
      });
    }

    // Delete the post
    await Post.findByIdAndDelete(id);
    console.log("Post deleted:", id);

    // Set no-cache headers
    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      Pragma: "no-cache",
      Expires: "0",
    });

    // CRITICAL FIX: Return appropriate posts based on context
    let posts;
    if (profileUserId) {
      // Profile page - return only that user's posts
      console.log("Fetching posts for user:", profileUserId);
      posts = await Post.find({ userId: profileUserId }).sort({
        createdAt: -1,
      });
    } else {
      // Feed page - return all posts
      console.log("Fetching all posts");
      posts = await Post.find().sort({ createdAt: -1 });
    }

    // Populate user information
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

    const validPosts = populatedPosts.filter((post) => post !== null);

    console.log(`Returning ${validPosts.length} posts after delete`);
    res.status(200).json(validPosts);
  } catch (err) {
    console.error("DELETE POST ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};
