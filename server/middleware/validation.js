import { body, param, query, validationResult } from "express-validator";

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: "Validation failed",
      errors: errors.array() 
    });
  }
  next();
};

// Auth validation
export const validateRegister = [
  body("firstName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters"),
  body("lastName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters"),
  body("email")
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 5 })
    .withMessage("Password must be at least 5 characters"),
  handleValidationErrors,
];

export const validateLogin = [
  body("email")
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("password")
    .notEmpty()
    .withMessage("Password is required"),
  handleValidationErrors,
];

export const validateGoogleAuth = [
  body("credential")
    .notEmpty()
    .withMessage("Google credential token is required"),
  handleValidationErrors,
];

// User validation
export const validateUpdateUser = [
  body("firstName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters"),
  body("lastName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters"),
  body("bio")
    .optional()
    .trim()
    .isLength({ max: 150 })
    .withMessage("Bio must be less than 150 characters"),
  handleValidationErrors,
];

export const validateUserId = [
  param("id")
    .isMongoId()
    .withMessage("Invalid user ID format"),
  handleValidationErrors,
];

export const validateSearchQuery = [
  param("query")
    .trim()
    .isLength({ min: 2 })
    .withMessage("Search query must be at least 2 characters"),
  handleValidationErrors,
];

// Post validation
export const validateCreatePost = [
  body("userId")
    .isMongoId()
    .withMessage("Valid user ID is required"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage("Description must be less than 5000 characters"),
  handleValidationErrors,
];

export const validatePostId = [
  param("id")
    .isMongoId()
    .withMessage("Invalid post ID format"),
  handleValidationErrors,
];

export const validateComment = [
  body("userId")
    .isMongoId()
    .withMessage("Valid user ID is required"),
  body("commentText")
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage("Comment must be between 1 and 1000 characters"),
  handleValidationErrors,
];

export const validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  handleValidationErrors,
];