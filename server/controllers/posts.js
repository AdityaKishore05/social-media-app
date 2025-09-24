import Post from "../models/Post.js";
import User from "../models/User.js";

/* CREATE */
export const createPost = async (req, res) => {
  try {
    const { userId, description, mediaType } = req.body;

    // Check if a file was uploaded by multer
    const mediaPath = req.file ? req.file.filename : null;

    // Validation: Ensure the post is not completely empty
    if (!description && !mediaPath) {
      return res
        .status(400)
        .json({ message: "Post must include a description or media." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found. Cannot create post." });
    }

    const newPost = new Post({
      userId,
      firstName: user.firstName,
      lastName: user.lastName,
      location: user.location,
      description,
      userPicturePath: user.picturePath,
      likes: {},
      comments: [],
    });

    // Conditionally set picturePath or videoPath based on mediaType
    if (mediaPath) {
      if (mediaType === "image") {
        newPost.picturePath = mediaPath;
      } else if (mediaType === "video") {
        newPost.videoPath = mediaPath;
      }
    }

    await newPost.save();

    // After creating, return the entire, fully populated feed
    const allPosts = await Post.find().sort({ createdAt: -1 });
    const populatedPosts = await Promise.all(
      allPosts.map(async (post) => {
        const postUser = await User.findById(post.userId);
        return {
          ...post._doc,
          userPicturePath: postUser.picturePath,
        };
      })
    );

    res.status(201).json(populatedPosts);
  } catch (err) {
    console.error("--- CREATE POST CRASHED ---", err);
    res.status(500).json({
      message: "An internal server error occurred.",
      error: err.message,
    });
  }
};

/*READ*/
export const getFeedPosts = async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });

    // ✅ FIX: Populate each post with the author's current user information.
    const postsWithUserInfo = await Promise.all(
      posts.map(async (post) => {
        const user = await User.findById(post.userId);
        return {
          ...post._doc, // Original post data
          firstName: user.firstName,
          lastName: user.lastName,
          location: user.location,
          userPicturePath: user.picturePath, // Always get the latest user picture
        };
      })
    );

    res.status(200).json(postsWithUserInfo);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};
export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const posts = await Post.find({ userId }).sort({ createdAt: -1 });

    // ✅ FIX: Populate each post with the author's current user information.
    const postsWithUserInfo = await Promise.all(
      posts.map(async (post) => {
        const user = await User.findById(post.userId); // or findById(userId) since it's the same user
        return {
          ...post._doc,
          firstName: user.firstName,
          lastName: user.lastName,
          location: user.location,
          userPicturePath: user.picturePath,
        };
      })
    );

    res.status(200).json(postsWithUserInfo);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

/* UPDATE */
export const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const post = await Post.findById(id);
    const isLiked = post.likes.get(userId);

    if (isLiked) {
      post.likes.delete(userId);
    } else {
      post.likes.set(userId, true);
    }

    const updatedPostRaw = await Post.findByIdAndUpdate(
      id,
      { likes: post.likes },
      { new: true }
    );

    // ✅ FIX: Return the fully populated post object, not just the raw data.
    const user = await User.findById(updatedPostRaw.userId);
    const updatedPostPopulated = {
      ...updatedPostRaw._doc,
      firstName: user.firstName,
      lastName: user.lastName,
      location: user.location,
      userPicturePath: user.picturePath,
    };

    res.status(200).json(updatedPostPopulated);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, commentText } = req.body;

    if (!commentText) {
      return res.status(400).json({ message: "Comment text cannot be empty." });
    }

    const post = await Post.findById(id);
    const user = await User.findById(userId);
    if (!post || !user)
      return res.status(404).json({ message: "Post or user not found." });

    // FIX: Create a comment OBJECT, not just a string
    const newComment = {
      userId,
      firstName: user.firstName,
      lastName: user.lastName,
      userPicturePath: user.picturePath,
      commentText,
    };

    post.comments.push(newComment);
    const updatedPost = await post.save();

    // Repopulate with user info to send back a consistent object
    const populatedPost = {
      ...updatedPost._doc,
      userPicturePath: user.picturePath,
    };

    res.status(200).json(populatedPost);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* DELETE */
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found." });

    if (post.userId !== userId) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this post." });
    }

    await Post.findByIdAndDelete(id);

    // FIX: Return the fully populated list of posts after deletion
    const allPosts = await Post.find().sort({ createdAt: -1 });
    const populatedPosts = await Promise.all(
      allPosts.map(async (p) => {
        const postUser = await User.findById(p.userId);
        return {
          ...p._doc,
          userPicturePath: postUser.picturePath,
        };
      })
    );

    res.status(200).json(populatedPosts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
