import { rateLimit } from "express-rate-limit";

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300, // increased to avoid accidental blocking
  message: {
    status: 429,
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    status: 429,
    error: "Too many authentication attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Rate limiter for post creation
export const postLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 posts/minute
  message: {
    status: 429,
    error: "Too many posts created, slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
