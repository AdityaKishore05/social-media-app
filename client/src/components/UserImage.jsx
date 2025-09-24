import { Box, Typography, useTheme } from "@mui/material";
import { useState, useEffect } from "react";

// Add disableLoadingEffect prop, defaulting to false
const UserImage = ({ image, size = "60px", userName = "", disableLoadingEffect = false }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { palette } = useTheme();

  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [image]);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "";

  const stringToColor = (string) => {
    let hash = 0;
    for (let i = 0; i < string.length; i += 1) {
      hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = "#";
    for (let i = 0; i < 3; i += 1) {
      const value = (hash >> (i * 8)) & 0xff;
      color += `00${value.toString(16)}`.slice(-2);
    }
    return color;
  };

  return (
    <Box width={size} height={size}>
      {imageError || !image ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            backgroundColor: stringToColor(userName),
            borderRadius: "50%",
            color: palette.background.default,
            fontSize: `calc(${size} / 2.5)`,
            fontWeight: "500",
          }}
        >
          {initials}
        </Box>
      ) : (
        <img
          style={{
            objectFit: "cover",
            borderRadius: "50%",
            // MODIFIED: Apply opacity based on disableLoadingEffect
            opacity: disableLoadingEffect || imageLoaded ? 1 : 0.5,
            transition: disableLoadingEffect ? "none" : "opacity 0.3s ease-in-out", // Disable transition if effect is off
          }}
          width={size}
          height={size}
          alt={userName}
          src={`${process.env.REACT_APP_API_URL}/assets/${image}`}
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
      )}
    </Box>
  );
};

export default UserImage;