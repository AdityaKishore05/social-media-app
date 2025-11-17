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
import { logger } from "./utils/logger.js";
import { apiLimiter, authLimiter, postLimiter } from "./middleware/rateLimiter.js";
import { sanitizeMongo, sanitizeInput } from "./middleware/sanitize.js";

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

// Lines 43-80: Body parsers, helmet, CORS FIRST, then rate limiters
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(helmet());
// Helmet configuration - adjust for OAuth
app.use(
  helmet({
    crossOriginOpenerPolicy: false, // Allow OAuth popups
    crossOriginEmbedderPolicy: false, // Allow embedding
  })
);
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));

// CORS - MUST BE BEFORE RATE LIMITERS
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://getsocialnow.onrender.com",
  "https://getsocialnow.netlify.app",
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
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
  exposedHeaders: ["Authorization"],
};

app.use(cors(corsOptions));

// Preflight handler - MUST use same CORS config
app.options("*", cors(corsOptions));

// THEN rate limiters
app.use("/api", apiLimiter);
app.use("/auth", authLimiter);
app.use("/posts", postLimiter);

// THEN sanitization
app.use(sanitizeMongo);
app.use(sanitizeInput);

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
logger.info("===== CLOUDINARY CONFIG CHECK =====");
logger.info("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME || "MISSING");
logger.info("API Key:", process.env.CLOUDINARY_API_KEY ? "EXISTS" : "MISSING");
logger.info(
  "API Secret:",
  process.env.CLOUDINARY_API_SECRET ? "EXISTS" : "MISSING"
);
logger.info("===================================");

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
  logger.error("=== SERVER ERROR ===");
  logger.error("Error name:", error.name);
  logger.error("Error message:", error.message);
  logger.error("Error stack:", error.stack);
  logger.error("===================");

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
  logger.info("404 - Route not found:", req.method, req.originalUrl);
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
      logger.info(`✓ Server running on port ${PORT}`);
      logger.info(`✓ Environment: ${process.env.NODE_ENV || "development"}`);
      logger.info(
        `✓ Cloudinary configured: ${!!process.env.CLOUDINARY_CLOUD_NAME}`
      );
    });
  })
  .catch((error) => {
    logger.error("✗ MongoDB connection error:", error);
    process.exit(1);
  });

export default app;
