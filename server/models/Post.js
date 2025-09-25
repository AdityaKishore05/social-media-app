import mongoose from "mongoose";

const postSchema = mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true, // Add index for faster queries
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
    description: {
      type: String,
      default: "",
    },
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
    // Add fields to track media metadata
    mediaMetadata: {
      cloudinaryPublicId: String, // Store Cloudinary public_id for management
      originalFileName: String, // Store original filename
      fileSize: Number, // Store file size
      mimeType: String, // Store MIME type
    },
    // Add field to prevent accidental deletion
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt
    // Add schema options for better performance
    collection: "posts",
  }
);

// Add indexes for better query performance
postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ isDeleted: 1, createdAt: -1 });

// Add a pre-find middleware to exclude deleted posts by default
postSchema.pre(/^find/, function () {
  // Don't return deleted posts unless explicitly requested
  if (!this.getQuery().includeDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
});

// Add instance method to soft delete
postSchema.methods.softDelete = function () {
  this.isDeleted = true;
  return this.save();
};

// Add static method to find with deleted posts
postSchema.statics.findWithDeleted = function (query = {}) {
  return this.find({ ...query, includeDeleted: true });
};

// Add validation to ensure at least description or media is present
postSchema.pre("save", function (next) {
  if (!this.description && !this.picturePath && !this.videoPath) {
    const error = new Error(
      "Post must have either description, image, or video"
    );
    return next(error);
  }
  next();
});

const Post = mongoose.model("Post", postSchema);

export default Post;
