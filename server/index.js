import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import postRoutes from "./routes/posts.js";
import { register } from "./controllers/auth.js";
import { createPost } from "./controllers/posts.js";
import { verifyToken } from "./middleware/auth.js";
import cloudinary from "cloudinary";

/* ... (other imports like User, Post models) ... */

/* CONFIGURATIONS */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();
const app = express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());
app.use("/assets", express.static(path.join(__dirname, "public/assets")));

// CLOUDINARY CONFIGURATION
cloudinary.v2.config();

// FILE STORAGE (use memory storage for Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({ storage });

/* ROUTES WITH FILES */
app.post("/auth/register", upload.single("picture"), register);
app.post("/posts", verifyToken, upload.single("media"), createPost);

/* ROUTES */
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/posts", postRoutes);

/* MONGOOSE SETUP */
const PORT = process.env.PORT || 6001;
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    app.listen(PORT, () => console.log(`Server Port: ${PORT}`));
    /* ADD DATA ONE TIME - KEEP COMMENTED OUT */
    // User.insertMany(users);
    // Post.insertMany(posts);
  })
  .catch((error) => console.log(`${error} did not connect`));

/* --- DEBUG ROUTES (NO CHANGES) --- */
app.get("/debug/users", async (req, res) => {
  try {
    const users = await User.find().select("firstName lastName picturePath");
    console.log("All users with picture paths:", users);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/debug/posts", async (req, res) => {
  try {
    const posts = await Post.find().select(
      "firstName lastName userPicturePath picturePath description"
    );
    console.log("All posts with picture paths:", posts);
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/debug/assets", (req, res) => {
  const fs = require("fs");
  const assetsPath = path.join(__dirname, "public/assets");

  fs.readdir(assetsPath, (err, files) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Cannot read assets directory", details: err.message });
    }

    console.log("Files in assets directory:", files);
    res.json({
      assetsPath: assetsPath,
      files: files,
    });
  });
});
