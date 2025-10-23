import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import postRoutes from "./routes/posts.js";
import { v2 as cloudinary } from "cloudinary";

/* CONFIGURATIONS */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();
const app = express();

// Add cache-busting middleware FIRST
app.use((req, res, next) => {
  // Disable caching for all API routes
  if (
    req.path.startsWith("/posts") ||
    req.path.startsWith("/users") ||
    req.path.startsWith("/auth")
  ) {
    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      Pragma: "no-cache",
      Expires: "0",
      "Last-Modified": new Date().toUTCString(),
      ETag: `"${Date.now()}-${Math.random()}"`,
    });
  }
  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));

// ENHANCED CORS configuration
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://getsocialnow.onrender.com",
      "https://getsocialnow.netlify.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
      "Cache-Control",
      "Pragma",
      "Expires",
    ],
  })
);

// Add preflight handling
app.options("*", cors());

app.use("/assets", express.static(path.join(__dirname, "public/assets")));

// CLOUDINARY CONFIGURATION - Must be after dotenv.config()
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Verify Cloudinary configuration
console.log("===== CLOUDINARY CONFIG CHECK =====");
console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME || "MISSING");
console.log("API Key:", process.env.CLOUDINARY_API_KEY ? "EXISTS" : "MISSING");
console.log(
  "API Secret:",
  process.env.CLOUDINARY_API_SECRET ? "EXISTS" : "MISSING"
);
console.log("===================================");

// MULTER CONFIGURATION - Use memory storage for Cloudinary uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per file
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("video/")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only image and video files are allowed!"), false);
    }
  },
});

/* ROUTES - Mount route handlers */
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
// Post routes - authentication handled inside the router
app.use("/posts", postRoutes);

// Add a health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    cloudinary: {
      configured: !!process.env.CLOUDINARY_CLOUD_NAME,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || "not set",
    },
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("=== SERVER ERROR ===");
  console.error("Error name:", error.name);
  console.error("Error message:", error.message);
  console.error("Error stack:", error.stack);
  console.error("===================");

  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "File too large. Maximum size is 50MB per file.",
      });
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        message: "Too many files. Maximum 10 files per post.",
      });
    }
    return res.status(400).json({
      message: "File upload error",
      error: error.message,
    });
  }

  res.status(error.status || 500).json({
    message: error.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && {
      stack: error.stack,
      name: error.name,
    }),
  });
});

// Handle 404s
app.use("*", (req, res) => {
  console.log("404 - Route not found:", req.method, req.originalUrl);
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl,
    method: req.method,
  });
});

/* DEBUG ROUTES (Optional - for development) */
if (process.env.NODE_ENV === "development") {
  app.get("/debug/users", async (req, res) => {
    try {
      const User = (await import("./models/User.js")).default;
      const users = await User.find().select(
        "firstName lastName picturePath email"
      );
      res.json({
        count: users.length,
        users: users,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/debug/posts", async (req, res) => {
    try {
      const Post = (await import("./models/Post.js")).default;
      const posts = await Post.find().select(
        "firstName lastName userPicturePath mediaItems description createdAt"
      );
      res.json({
        count: posts.length,
        posts: posts,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/debug/cloudinary", (req, res) => {
    res.json({
      configured: !!process.env.CLOUDINARY_CLOUD_NAME,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "not set",
      api_key: process.env.CLOUDINARY_API_KEY ? "set" : "not set",
      api_secret: process.env.CLOUDINARY_API_SECRET ? "set" : "not set",
    });
  });

  app.get("/debug/routes", (req, res) => {
    const routes = [];
    app._router.stack.forEach((middleware) => {
      if (middleware.route) {
        routes.push({
          path: middleware.route.path,
          methods: Object.keys(middleware.route.methods),
        });
      } else if (middleware.name === "router") {
        middleware.handle.stack.forEach((handler) => {
          if (handler.route) {
            routes.push({
              path: handler.route.path,
              methods: Object.keys(handler.route.methods),
            });
          }
        });
      }
    });
    res.json({ routes });
  });
}

/* MONGOOSE SETUP */
const PORT = process.env.PORT || 6001;
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(
        `✓ Cloudinary configured: ${!!process.env.CLOUDINARY_CLOUD_NAME}`
      );
    });
  })
  .catch((error) => {
    console.error("✗ MongoDB connection error:", error);
    process.exit(1);
  });

export default app;
