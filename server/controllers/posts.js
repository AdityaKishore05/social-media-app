import Post from "../models/Post.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

/* CREATE POST WITH COMPREHENSIVE DEBUGGING */
export const createPost = async (req, res) => {
  console.log("\n==========================================");
  console.log("CREATE POST REQUEST RECEIVED");
  console.log("==========================================");

  try {
    // Log everything about the request
    console.log("Request Method:", req.method);
    console.log("Request URL:", req.url);
    console.log("Request Headers:", JSON.stringify(req.headers, null, 2));
    console.log("\n--- Request Body ---");
    console.log("Body keys:", Object.keys(req.body));
    console.log("Body:", JSON.stringify(req.body, null, 2));

    console.log("\n--- Files Information ---");
    console.log("req.files exists:", !!req.files);
    console.log("req.files type:", typeof req.files);
    console.log("req.files is array:", Array.isArray(req.files));
    console.log("Files count:", req.files ? req.files.length : 0);

    if (req.files && req.files.length > 0) {
      console.log("\nDetailed file info:");
      req.files.forEach((file, index) => {
        console.log(`File ${index + 1}:`, {
          fieldname: file.fieldname,
          originalname: file.originalname,
          encoding: file.encoding,
          mimetype: file.mimetype,
          size: file.size,
          hasBuffer: !!file.buffer,
          bufferLength: file.buffer ? file.buffer.length : 0,
        });
      });
    }

    const { userId, description, mediaType } = req.body;
    console.log("\n--- Extracted Data ---");
    console.log("userId:", userId);
    console.log("description:", description);
    console.log("mediaType:", mediaType);

    // Validate required fields
    if (!userId) {
      console.error("ERROR: User ID is missing");
      return res.status(400).json({
        message: "User ID is required",
        receivedBody: req.body,
      });
    }

    if (!description?.trim() && (!req.files || req.files.length === 0)) {
      console.error("ERROR: No content provided");
      return res.status(400).json({
        message: "Post must have either description or media",
        hasDescription: !!description?.trim(),
        hasFiles: !!(req.files && req.files.length > 0),
      });
    }

    console.log("\n--- Validation Passed ---");
    let mediaItems = [];

    // Process uploaded files
    if (req.files && req.files.length > 0) {
      console.log(
        `\n--- Starting Media Upload (${req.files.length} files) ---`
      );

      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        console.log(`\nProcessing file ${i + 1}/${req.files.length}:`);
        console.log("  - Name:", file.originalname);
        console.log("  - Type:", file.mimetype);
        console.log("  - Size:", `${(file.size / 1024).toFixed(2)} KB`);

        // Check if buffer exists
        if (!file.buffer) {
          console.error(`ERROR: Buffer missing for file ${file.originalname}`);
          throw new Error(`File buffer is missing for ${file.originalname}`);
        }

        console.log("  - Buffer length:", file.buffer.length);

        try {
          const isVideo = file.mimetype.startsWith("video/");
          console.log("  - Is video:", isVideo);

          // Convert buffer to base64
          console.log("  - Converting to base64...");
          const base64String = file.buffer.toString("base64");
          console.log("  - Base64 length:", base64String.length);

          const fileStr = `data:${file.mimetype};base64,${base64String}`;
          console.log("  - Data URL created, length:", fileStr.length);

          // Check Cloudinary configuration
          console.log("\n  - Cloudinary config check:");
          console.log(
            "    Cloud name:",
            cloudinary.config().cloud_name || "NOT SET"
          );
          console.log(
            "    API key:",
            cloudinary.config().api_key ? "SET" : "NOT SET"
          );
          console.log(
            "    API secret:",
            cloudinary.config().api_secret ? "SET" : "NOT SET"
          );

          // Upload to Cloudinary
          console.log("  - Starting Cloudinary upload...");
          const uploadResult = await cloudinary.uploader.upload(fileStr, {
            resource_type: isVideo ? "video" : "image",
            folder: "social-media-app",
            timeout: 60000,
          });

          console.log("  ✓ Upload successful!");
          console.log("    URL:", uploadResult.secure_url);
          console.log("    Public ID:", uploadResult.public_id);

          mediaItems.push({
            url: uploadResult.secure_url,
            type: isVideo ? "video" : "image",
            publicId: uploadResult.public_id,
          });
        } catch (uploadError) {
          console.error(`\n✗ CLOUDINARY UPLOAD ERROR for file ${i + 1}:`);
          console.error("Error name:", uploadError.name);
          console.error("Error message:", uploadError.message);
          console.error("Error stack:", uploadError.stack);

          return res.status(500).json({
            message: "Failed to upload media to cloud storage",
            error: uploadError.message,
            fileName: file.originalname,
            fileIndex: i + 1,
            details: uploadError.stack,
          });
        }
      }

      console.log(`\n✓ All ${mediaItems.length} files uploaded successfully`);
    }

    // Get user information
    console.log("\n--- Fetching User Information ---");
    console.log("Looking up user ID:", userId);

    const user = await User.findById(userId);

    if (!user) {
      console.error("ERROR: User not found for ID:", userId);
      return res.status(404).json({
        message: "User not found",
        userId: userId,
      });
    }

    console.log("✓ User found:", user.firstName, user.lastName);

    // Create new post
    console.log("\n--- Creating Post Document ---");
    const postData = {
      userId,
      firstName: user.firstName,
      lastName: user.lastName,
      description: description?.trim() || "",
      userPicturePath: user.picturePath,
      mediaItems: mediaItems,
      likes: {},
      comments: [],
    };

    console.log("Post data:", JSON.stringify(postData, null, 2));

    const newPost = new Post(postData);

    console.log("Saving post to database...");
    await newPost.save();
    console.log("✓ Post saved successfully!");
    console.log("  Post ID:", newPost._id);
    console.log("  Created at:", newPost.createdAt);

    // Set no-cache headers
    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      Pragma: "no-cache",
      Expires: "0",
    });

    // Fetch all posts
    console.log("\n--- Fetching All Posts ---");
    const allPosts = await Post.find().sort({ createdAt: -1 });
    console.log("Total posts found:", allPosts.length);

    // Populate user information
    console.log("Populating user information for all posts...");
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

    const validPosts = populatedPosts.filter((post) => post !== null);
    console.log("Valid posts to return:", validPosts.length);

    console.log("\n✓✓✓ POST CREATED SUCCESSFULLY ✓✓✓");
    console.log("==========================================\n");

    return res.status(201).json(validPosts);
  } catch (err) {
    console.error("\n✗✗✗ CREATE POST ERROR ✗✗✗");
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    console.error("Error stack:", err.stack);
    console.error("==========================================\n");

    return res.status(500).json({
      message: "Internal server error occurred while creating post",
      error: err.message,
      errorName: err.name,
      ...(process.env.NODE_ENV === "development" && {
        stack: err.stack,
        requestBody: req.body,
        fileCount: req.files ? req.files.length : 0,
      }),
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
