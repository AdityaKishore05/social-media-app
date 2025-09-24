import Post from "../models/Post.js";
import User from "../models/User.js";
import cloudinary from "cloudinary";


// 1. CREATE A REUSABLE HELPER FUNCTION
const getPopulatedPosts = async () => {
  const posts = await Post.find().sort({ createdAt: -1 });

  const populatedPosts = await Promise.all(
    posts.map(async (post) => {
      const user = await User.findById(post.userId);
      return {
        ...post._doc,
        firstName: user.firstName,
        lastName: user.lastName,
        location: user.location,
        userPicturePath: user.picturePath,
      };
    })
  );
  return populatedPosts;
};

/* CREATE */
export const createPost = async (req, res) => {
  try {
    const { userId, description, mediaType } = req.body;
    const mediaPath = req.file ? req.file.filename : null;

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

    if (req.file) {
      const result = await cloudinary.v2.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString(
          "base64"
        )}`,
        {
          resource_type: mediaType === "video" ? "video" : "image", // Tell Cloudinary if it's a video
          folder: "social_media_app/posts",
        }
      );

      if (mediaType === "image") {
        newPost.picturePath = result.secure_url;
      } else if (mediaType === "video") {
        newPost.videoPath = result.secure_url;
      }
    }

    await newPost.save();
    const allPosts = await getPopulatedPosts();
    res.status(201).json(allPosts);
  } catch (err) {
    res.status(409).json({ message: err.message });
  }
};

/* READ */
export const getFeedPosts = async (req, res) => {
  try {
    // 2. USE THE HELPER FUNCTION
    const allPosts = await getPopulatedPosts();
    res.status(200).json(allPosts);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const getUserPosts = async (req, res) => {
  /* ... (Your existing code is good) ... */
};

/* UPDATE */
export const likePost = async (req, res) => {
  /* ... (Your existing code is good) ... */
};
export const addComment = async (req, res) => {
  /* ... (Your existing code is good) ... */
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

    // 2. USE THE HELPER FUNCTION
    const allPosts = await getPopulatedPosts();
    res.status(200).json(allPosts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
