const isDevelopment = process.env.NODE_ENV === "development";

export const logger = {
  info: (...args) => {
    if (isDevelopment) {
      console.log("[INFO]", ...args);
    }
  },
  error: (...args) => {
    console.error("[ERROR]", ...args);
  },
  warn: (...args) => {
    if (isDevelopment) {
      console.warn("[WARN]", ...args);
    }
  },
  debug: (...args) => {
    if (isDevelopment) {
      console.debug("[DEBUG]", ...args);
    }
  },
};