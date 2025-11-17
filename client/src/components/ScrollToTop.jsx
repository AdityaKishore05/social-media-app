import { Fab } from "@mui/material";
import { KeyboardArrowUp } from "@mui/icons-material";
import { useState, useEffect } from "react";
import { useTheme } from "@mui/material";

export const ScrollToTop = () => {
  const [visible, setVisible] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    const toggleVisibility = () => {
      setVisible(window.pageYOffset > 300);
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return visible ? (
    <Fab
      onClick={scrollToTop}
      sx={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 1000,
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.background.alt,
        "&:hover": {
          backgroundColor: theme.palette.primary.dark,
        },
      }}
      size="small"
      aria-label="scroll to top"
    >
      <KeyboardArrowUp />
    </Fab>
  ) : null;
};