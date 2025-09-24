import Post from "../models/Post.js";
import User from "../models/User.js";

/* CREATE */
export const createPost = async (req, res) => {
  try {
    const { userId, description, picturePath } = req.body;
    const user = await User.findById(userId);
    
    const newPost = new Post({
      userId,
      firstName: user.firstName,
      lastName: user.lastName,
      location: user.location,
      description,
      userPicturePath: user.picturePath,
      picturePath,
      likes: {},
      comments: [],
    });
    await newPost.save();

    // After creating a new post, return the entire updated feed, fully populated.
    const posts = await Post.find().sort({ createdAt: -1 });

    const postsWithUserInfo = await Promise.all(
      posts.map(async (post) => {
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

    res.status(201).json(postsWithUserInfo);
  } catch (err) {
    res.status(409).json({ message: err.message });
  }
};

/* READ */
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
