import Post from "../models/Post.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

/* CREATE */
export const createPost = async (req, res) => {
  try {
    const { userId, description, mediaType } = req.body;
    let mediaPath = null;
    let uploadResult = null; // FIXED: Declare at the top level

    console.log("Creating post:", { userId, hasFile: !!req.file, mediaType });

    // Handle file upload
    if (req.file) {
      try {
        console.log("Starting Cloudinary upload...");

        // Check if Cloudinary is configured
        if (!process.env.CLOUDINARY_API_KEY) {
          throw new Error("Cloudinary API key not configured");
        }

        const fileStr = `data:${
          req.file.mimetype
        };base64,${req.file.buffer.toString("base64")}`;

        // Upload to Cloudinary
        uploadResult = await cloudinary.uploader.upload(fileStr, {
          resource_type: mediaType === "video" ? "video" : "image",
          folder: "social-media-app",
        });

        mediaPath = uploadResult.secure_url;
        console.log("Cloudinary upload successful:", mediaPath);
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({
          message: "Failed to upload media to cloud storage",
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
        message: "User not found.",
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

    // Set media path based on type
    if (mediaPath) {
      if (mediaType === "image") {
        newPost.picturePath = mediaPath;
      } else if (mediaType === "video") {
        newPost.videoPath = mediaPath;
      }
    }

    await newPost.save();
    console.log("Post created successfully:", newPost._id);

    // Add no-cache headers
    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      Pragma: "no-cache",
      Expires: "0",
    });

    // Return all posts
    const allPosts = await Post.find().sort({ createdAt: -1 });
    const populatedPosts = await Promise.all(
      allPosts.map(async (post) => {
        const postUser = await User.findById(post.userId);
        if (!postUser) return null;

        return {
          ...post._doc,
          firstName: postUser.firstName,
          lastName: postUser.lastName,
          location: postUser.location,
          userPicturePath: postUser.picturePath,
        };
      })
    );

    const validPosts = populatedPosts.filter((post) => post !== null);
    res.status(201).json(validPosts);
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

// Backend: Add to controllers/posts.js - Media Health Check System

// Add this function to monitor and fix media URLs
export const checkMediaHealth = async (req, res) => {
  try {
    console.log('Starting media health check...');
    
    const posts = await Post.find({}).limit(100).sort({ createdAt: -1 });
    const healthReport = {
      totalPosts: posts.length,
      postsWithMedia: 0,
      workingMedia: 0,
      brokenMedia: 0,
      fixedMedia: 0,
      issues: []
    };

    for (const post of posts) {
      if (post.picturePath || post.videoPath) {
        healthReport.postsWithMedia++;
        
        const mediaUrl = post.picturePath || post.videoPath;
        
        // Check if it's a Cloudinary URL
        if (mediaUrl.startsWith('https://res.cloudinary.com')) {
          try {
            // Test if the media exists
            const response = await fetch(mediaUrl, { method: 'HEAD' });
            if (response.ok) {
              healthReport.workingMedia++;
            } else {
              healthReport.brokenMedia++;
              healthReport.issues.push({
                postId: post._id,
                userId: post.userId,
                mediaUrl,
                error: `HTTP ${response.status}`
              });
            }
          } catch (error) {
            healthReport.brokenMedia++;
            healthReport.issues.push({
              postId: post._id,
              userId: post.userId,
              mediaUrl,
              error: error.message
            });
          }
        } else {
          // Old local URLs - these need to be flagged
          healthReport.issues.push({
            postId: post._id,
            userId: post.userId,
            mediaUrl,
            error: 'Non-Cloudinary URL detected'
          });
        }
      }
    }

    console.log('Media health check completed:', healthReport);
    res.json(healthReport);
  } catch (error) {
    console.error('Media health check failed:', error);
    res.status(500).json({ error: error.message });
  }
};

// Add this function to backup critical posts
export const backupCriticalPosts = async (req, res) => {
  try {
    const posts = await Post.find({})
      .select('_id userId description picturePath videoPath mediaMetadata createdAt')
      .sort({ createdAt: -1 });

    const backup = {
      timestamp: new Date().toISOString(),
      totalPosts: posts.length,
      posts: posts.map(post => ({
        id: post._id,
        userId: post.userId,
        description: post.description,
        hasImage: !!post.picturePath,
        hasVideo: !!post.videoPath,
        mediaUrl: post.picturePath || post.videoPath,
        metadata: post.mediaMetadata,
        created: post.createdAt
      }))
    };

    // In production, save this to a backup service
    console.log(`Backup created with ${backup.totalPosts} posts`);
    res.json(backup);
  } catch (error) {
    console.error('Backup failed:', error);
    res.status(500).json({ error: error.message });
  }
};

// Enhanced create post with better persistence
export const createPostEnhanced = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { userId, description, mediaType } = req.body;
    let mediaPath = null;
    let uploadResult = null;

    console.log('Creating post with enhanced persistence:', {
      userId,
      hasDescription: !!description,
      hasFile: !!req.file,
      mediaType
    });

    // Handle file upload with extensive error handling
    if (req.file) {
      try {
        console.log('Processing file upload:', {
          originalname: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype
        });

        const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        
        // Upload to Cloudinary with optimized settings
        uploadResult = await cloudinary.v2.uploader.upload(fileStr, {
          resource_type: mediaType === 'video' ? 'video' : 'image',
          folder: 'social-media-app',
          // Add unique identifier to prevent overwrites
          public_id: `${userId}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          // Optimize for web delivery
          quality: 'auto:good',
          fetch_format: 'auto',
          // Add backup URL generation
          backup: true,
          // Ensure long-term storage
          invalidate: true,
        });
        
        mediaPath = uploadResult.secure_url;
        
        console.log('Media uploaded successfully:', {
          url: mediaPath,
          public_id: uploadResult.public_id,
          bytes: uploadResult.bytes,
          format: uploadResult.format
        });

        // Verify upload immediately
        const verifyResponse = await fetch(mediaPath, { method: 'HEAD' });
        if (!verifyResponse.ok) {
          throw new Error(`Upload verification failed: ${verifyResponse.status}`);
        }
        
      } catch (uploadError) {
        console.error('Critical upload error:', uploadError);
        await session.abortTransaction();
        return res.status(500).json({ 
          message: "Failed to upload and verify media", 
          error: uploadError.message,
          retryable: true
        });
      }
    }

    // Validate user exists
    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ message: "User not found" });
    }

    // Create post with enhanced metadata
    const newPost = new Post({
      userId,
      firstName: user.firstName,
      lastName: user.lastName,
      location: user.location,
      description: description?.trim() || '',
      userPicturePath: user.picturePath,
      picturePath: mediaType === 'image' ? mediaPath : '',
      videoPath: mediaType === 'video' ? mediaPath : '',
      likes: {},
      comments: [],
      mediaMetadata: uploadResult ? {
        cloudinaryPublicId: uploadResult.public_id,
        originalFileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedAt: new Date(),
        backupUrls: uploadResult.backup ? [uploadResult.backup] : [],
        verified: true
      } : undefined
    });

    // Save with transaction
    await newPost.save({ session });
    await session.commitTransaction();

    console.log('Post created successfully with ID:', newPost._id);

    // Set cache headers
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    // Return updated posts
    const allPosts = await Post.find().sort({ createdAt: -1 });
    const populatedPosts = await Promise.all(
      allPosts.map(async (post) => {
        const postUser = await User.findById(post.userId);
        if (!postUser) return null;
        
        return {
          ...post._doc,
          firstName: postUser.firstName,
          lastName: postUser.lastName,
          location: postUser.location,
          userPicturePath: postUser.picturePath,
        };
      })
    );

    const validPosts = populatedPosts.filter(post => post !== null);
    res.status(201).json(validPosts);

  } catch (error) {
    await session.abortTransaction();
    console.error('Enhanced post creation failed:', error);
    res.status(500).json({
      message: "Post creation failed",
      error: error.message,
      retryable: true
    });
  } finally {
    session.endSession();
  }
};

// Frontend: Enhanced error handling for posts
export const usePostsWithPersistence = (userId, isProfile = false) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchPostsWithRetry = useCallback(async (attempt = 1) => {
    try {
      setError(null);
      
      const endpoint = isProfile 
        ? `https://getsocialnow.onrender.com/posts/${userId}/posts`
        : `https://getsocialnow.onrender.com/posts`;

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Validate posts have required fields
      const validPosts = data.filter(post => 
        post._id && post.userId && (post.description || post.picturePath || post.videoPath)
      );

      console.log(`Loaded ${validPosts.length} valid posts (attempt ${attempt})`);
      setPosts(validPosts);
      setRetryCount(0);
      
    } catch (err) {
      console.error(`Post fetch attempt ${attempt} failed:`, err);
      
      if (attempt < 3) {
        console.log(`Retrying in ${attempt * 1000}ms...`);
        setTimeout(() => fetchPostsWithRetry(attempt + 1), attempt * 1000);
      } else {
        setError(err.message);
        setRetryCount(attempt);
      }
    } finally {
      if (attempt === 1) setLoading(false);
    }
  }, [userId, isProfile]);

  useEffect(() => {
    fetchPostsWithRetry();
  }, [fetchPostsWithRetry]);

  return {
    posts,
    loading,
    error,
    retryCount,
    refetch: () => fetchPostsWithRetry()
  };
};