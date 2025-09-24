import { Box, useTheme } from "@mui/material";
import { useState, useEffect } from "react";

const UserImage = ({ image, size = "60px", userName = "" }) => {
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

  // NEW: Logic to calculate user initials
  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "";

  // NEW: Helper function to generate a consistent color from a string (the user's name)
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
        // NEW: Styled Box to display initials as a fallback
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            backgroundColor: stringToColor(userName), // Generates a color from the name
            borderRadius: "50%",
            color: palette.background.default, // Text color for initials
            fontSize: `calc(${size} / 2.5)`, // Dynamically adjust font size based on avatar size
            fontWeight: "500",
          }}
        >
          {initials}
        </Box>
      ) : (
        // Render the primary image
        <img
          style={{
            objectFit: "cover",
            borderRadius: "50%",
            opacity: imageLoaded ? 1 : 0.5,
            transition: "opacity 0.3s ease-in-out",
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