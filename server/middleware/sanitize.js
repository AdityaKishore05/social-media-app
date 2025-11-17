import mongoSanitize from "express-mongo-sanitize";
import createDOMPurify from "isomorphic-dompurify";
import { logger } from "../utils/logger.js"; // or correct path


const DOMPurify = createDOMPurify();

// Sanitize MongoDB operator injection
export const sanitizeMongo = mongoSanitize({
    replaceWith: "_",
    onSanitize: ({ req, key }) => {
      logger.warn(`MongoDB injection attempt detected in ${key}`);
    },
  });

// Sanitize HTML/XSS
export const sanitizeInput = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === "string") {
        req.body[key] = DOMPurify.sanitize(req.body[key], {
          ALLOWED_TAGS: [], // Remove all HTML tags
          ALLOWED_ATTR: [],
        });
      }
    });
  }
  if (req.query) {
    Object.keys(req.query).forEach((key) => {
      if (typeof req.query[key] === "string") {
        req.query[key] = DOMPurify.sanitize(req.query[key], {
          ALLOWED_TAGS: [],
          ALLOWED_ATTR: [],
        });
      }
    });
  }
  if (req.params) {
    Object.keys(req.params).forEach((key) => {
      if (typeof req.params[key] === "string") {
        req.params[key] = DOMPurify.sanitize(req.params[key], {
          ALLOWED_TAGS: [],
          ALLOWED_ATTR: [],
        });
      }
    });
  }
  next();
};