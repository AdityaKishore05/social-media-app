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
          type: String, // Cloudinary public ID for deletion
        },
      },
    ],
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
    // Soft delete flag
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    collection: "posts",
  }
);

// Add compound indexes for better query performance
postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ isDeleted: 1, createdAt: -1 });

// Pre-find middleware to exclude soft-deleted posts
postSchema.pre(/^find/, function (next) {
  // Don't return deleted posts unless explicitly requested
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

// FIXED: Validation to ensure at least description or media is present
postSchema.pre("save", function (next) {
  // Skip validation for updates
  if (!this.isNew) {
    return next();
  }

  // For new posts, require either description or media
  const hasDescription = this.description && this.description.trim().length > 0;
  const hasMedia = this.mediaItems && this.mediaItems.length > 0;

  if (!hasDescription && !hasMedia) {
    const error = new Error("Post must have either description or media");
    return next(error);
  }

  next();
});

// Add a method to get full post with user info
postSchema.methods.toJSONWithUser = async function () {
  const User = mongoose.model("User");
  const user = await User.findById(this.userId);

  return {
    ...this.toObject(),
    firstName: user?.firstName || this.firstName,
    lastName: user?.lastName || this.lastName,
    userPicturePath: user?.picturePath || this.userPicturePath,
  };
};

// Virtual for comment count
postSchema.virtual("commentCount").get(function () {
  return this.comments ? this.comments.length : 0;
});

// Virtual for like count
postSchema.virtual("likeCount").get(function () {
  return this.likes ? this.likes.size : 0;
});

// Ensure virtuals are included in JSON
postSchema.set("toJSON", { virtuals: true });
postSchema.set("toObject", { virtuals: true });

const Post = mongoose.model("Post", postSchema);

export default Post;
