import mongoose from "mongoose";

// We will also update the comments to the object schema we discussed
const commentSchema = mongoose.Schema(
  {
    userId: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    userPicturePath: { type: String },
    commentText: { type: String, required: true },
  },
  { timestamps: true }
);

const postSchema = mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    location: String,
    description: String,
    picturePath: String,
    videoPath: String, // ✅ ADD THIS LINE
    userPicturePath: String,
    likes: {
      type: Map,
      of: Boolean,
    },
    comments: {
      type: [commentSchema], // ✅ UPDATED TO OBJECT SCHEMA
      default: [],
    },
  },
  { timestamps: true }
);

const Post = mongoose.model("Post", postSchema);

export default Post;
