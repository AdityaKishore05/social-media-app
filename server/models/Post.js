// ============================================
// 1. UPDATE Post Model Schema (models/Post.js)
// ============================================
// ADD these fields back to your Post schema:

import mongoose from "mongoose";

const postSchema = mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    // NEW FORMAT (multiple media)
    mediaItems: [
      {
        url: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          enum: ["image", "video"],
          required: true,
        },
        publicId: {
          type: String,
        },
      },
    ],
    // OLD FORMAT (single media) - Keep for backward compatibility
    picturePath: {
      type: String,
      default: "",
    },
    videoPath: {
      type: String,
      default: "",
    },
    userPicturePath: {
      type: String,
      default: "",
    },
    likes: {
      type: Map,
      of: Boolean,
      default: {},
    },
    comments: [
      {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          default: () => new mongoose.Types.ObjectId(),
        },
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
        userPicturePath: {
          type: String,
          default: "",
        },
        commentText: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "posts",
  }
);

// Add compound indexes
postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ isDeleted: 1, createdAt: -1 });

// Pre-find middleware to exclude soft-deleted posts
postSchema.pre(/^find/, function (next) {
  if (!this.getQuery().includeDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

// Instance method for soft delete
postSchema.methods.softDelete = function () {
  this.isDeleted = true;
  return this.save();
};

// Static method to find including deleted posts
postSchema.statics.findWithDeleted = function (query = {}) {
  return this.find({ ...query, includeDeleted: true });
};

// UPDATED: Validation - allow either old or new format
postSchema.pre("save", function (next) {
  if (!this.isNew) {
    return next();
  }

  const hasDescription = this.description && this.description.trim().length > 0;
  const hasNewMedia = this.mediaItems && this.mediaItems.length > 0;
  const hasOldMedia = this.picturePath || this.videoPath;

  if (!hasDescription && !hasNewMedia && !hasOldMedia) {
    const error = new Error("Post must have either description or media");
    return next(error);
  }

  next();
});

const Post = mongoose.model("Post", postSchema);

export default Post;
