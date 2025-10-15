import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
    res.status(500).json({ error: err.message });
  }
};

// NEW: Google OAuth Login/Register
export const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;

    console.log("===== GOOGLE AUTH REQUEST =====");
    console.log("Verifying Google token...");

    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    console.log("Google user data:", {
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
      console.log("Creating new user from Google data...");
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
      console.log("✓ New user created:", user._id);
    } else {
      console.log("✓ Existing user found:", user._id);

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
        console.log("✓ User data updated");
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

    console.log("===== AUTH SUCCESS =====");

    res.status(200).json({
      user: userResponse,
      token,
      message: isNewUser ? "Account created successfully" : "Login successful",
    });
  } catch (error) {
    console.error("===== GOOGLE AUTH ERROR =====");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);

    res.status(500).json({
      message: "Google authentication failed",
      error: error.message,
    });
  }
};
