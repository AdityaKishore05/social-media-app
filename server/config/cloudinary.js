import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import { logger } from "../utils/logger.js";

dotenv.config();

export const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  // Verify Cloudinary configuration
  logger.info("===== CLOUDINARY CONFIG CHECK =====");
  logger.info("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME || "MISSING");
  logger.info(
    "API Key:",
    process.env.CLOUDINARY_API_KEY ? "EXISTS" : "MISSING"
  );
  logger.info(
    "API Secret:",
    process.env.CLOUDINARY_API_SECRET ? "EXISTS" : "MISSING"
  );
  logger.info("===================================");
};
