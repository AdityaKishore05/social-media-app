import createDOMPurify from "isomorphic-dompurify";
import { JSDOM } from "jsdom";

const { window } = new JSDOM("");
const DOMPurify = createDOMPurify(window);

export const sanitizeMongo = mongoSanitize();

export const sanitizeInput = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === "string") {
        req.body[key] = DOMPurify.sanitize(req.body[key], {
          ALLOWED_TAGS: [],
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