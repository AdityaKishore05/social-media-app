import { Box } from "@mui/material";
import { styled } from "@mui/system";

const WidgetWrapper = styled(Box)(({ theme }) => ({
  padding: "1rem",
  borderRadius: "1rem",
  WebkitBackdropFilter: "blur(10px)", // Change this
  backdropFilter: "blur(10px)", // Change this - now it's in the style object, not a prop
  border: theme.palette.mode === "dark"
    ? "1px solid rgba(255, 255, 255, 0.1)"
    : "1px solid rgba(0, 0, 0, 0.05)",
  boxShadow: theme.palette.mode === "dark"
    ? "0 4px 12px rgba(0, 0, 0, 0.3)"
    : "0 4px 12px rgba(0, 0, 0, 0.08)",
  transition: "all 0.3s ease",
  
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: theme.palette.mode === "dark"
      ? "0 8px 20px rgba(0, 0, 0, 0.4)"
      : "0 8px 20px rgba(0, 0, 0, 0.12)",
  },
}));

export default WidgetWrapper;