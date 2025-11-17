import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { OAuth2Client } from "google-auth-library";
import { logger } from "../utils/logger.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Register function
export const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, picturePath } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 5) {
      return res
        .status(400)
        .json({ message: "Password must be at least 5 characters" });
    }

    if (firstName.length < 2 || firstName.length > 50) {
      return res
        .status(400)
        .json({ message: "First name must be between 2 and 50 characters" });
    }

    if (lastName.length < 2 || lastName.length > 50) {
      return res
        .status(400)
        .json({ message: "Last name must be between 2 and 50 characters" });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password: passwordHash,
      picturePath: picturePath || "",
      friends: [],
      bio: "",
      emailVerified: false,
    });

    const savedUser = await newUser.save();
    const token = jwt.sign({ id: savedUser._id }, process.env.JWT_SECRET);

    const userResponse = {
      _id: savedUser._id,
      firstName: savedUser.firstName,
      lastName: savedUser.lastName,
      email: savedUser.email,
      picturePath: savedUser.picturePath,
      friends: savedUser.friends,
      bio: savedUser.bio,
    };

    res.status(201).json({ token, user: userResponse });
  } catch (err) {
    logger.error("REGISTER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// Existing login function - keep it
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(400).json({ message: "User does not exist." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    const userResponse = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      picturePath: user.picturePath,
      friends: user.friends,
      bio: user.bio,
    };

    res.status(200).json({ token, user: userResponse });
  } catch (err) {
    logger.error("LOGIN ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// NEW: Google OAuth Login/Register
export const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;

    logger.info("===== GOOGLE AUTH REQUEST =====");
    logger.info("Verifying Google token...");

    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    logger.info("Google user data:", {
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    });

    const {
      email,
      given_name: firstName,
      family_name: lastName,
      picture: googlePicture,
      sub: googleId,
      email_verified: emailVerified,
    } = payload;

    if (!emailVerified) {
      return res.status(400).json({
        message: "Email not verified by Google",
      });
    }

    // Check if user exists
    let user = await User.findOne({ email });
    let isNewUser = false;

    if (!user) {
      // Create new user
      logger.info("Creating new user from Google data...");
      isNewUser = true;

      user = new User({
        firstName: firstName || "User",
        lastName: lastName || "",
        email,
        password: await bcrypt.hash(googleId + process.env.JWT_SECRET, 10),
        picturePath: googlePicture || "",
        friends: [],
        bio: "",
        googleId,
        emailVerified: true,
      });

      await user.save();
      logger.info("✓ New user created:", user._id);
    } else {
      logger.info("✓ Existing user found:", user._id);

      // Update Google data if needed
      let hasUpdates = false;

      if (!user.googleId) {
        user.googleId = googleId;
        hasUpdates = true;
      }

      if (!user.emailVerified) {
        user.emailVerified = true;
        hasUpdates = true;
      }

      // Update profile picture if it's a Google picture or empty
      if (
        !user.picturePath ||
        user.picturePath.includes("googleusercontent.com")
      ) {
        user.picturePath = googlePicture;
        hasUpdates = true;
      }

      if (hasUpdates) {
        await user.save();
        logger.info("✓ User data updated");
      }
    }

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    // Prepare response
    const userResponse = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      picturePath: user.picturePath,
      friends: user.friends,
      bio: user.bio,
      emailVerified: user.emailVerified,
    };

    logger.info("===== AUTH SUCCESS =====");

    res.status(200).json({
      user: userResponse,
      token,
      message: isNewUser ? "Account created successfully" : "Login successful",
    });
  } catch (error) {
    logger.error("===== GOOGLE AUTH ERROR =====");
    logger.error("Error:", error.message);
    logger.error("Stack:", error.stack);

    res.status(500).json({
      message: "Google authentication failed",
      error: error.message,
    });
  }
};
