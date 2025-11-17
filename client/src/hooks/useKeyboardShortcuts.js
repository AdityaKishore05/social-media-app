import { useEffect } from "react";

export const useKeyboardShortcuts = (shortcuts) => {
  useEffect(() => {
    const handleKeyPress = (e) => {
      const key = `${e.ctrlKey || e.metaKey ? "ctrl+" : ""}${
        e.shiftKey ? "shift+" : ""
      }${e.key.toLowerCase()}`;

      if (shortcuts[key]) {
        e.preventDefault();
        shortcuts[key]();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [shortcuts]);
};
