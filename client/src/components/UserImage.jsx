import { Box, useTheme } from "@mui/material";
import { useState, useEffect } from "react";

const UserImage = ({ image, size = "60px", userName = "" }) => {
  const [imageError, setImageError] = useState(false);
  // REMOVED: 'imageLoaded' state is no longer needed.
  const { palette } = useTheme();

  useEffect(() => {
    setImageError(false);
  }, [image]);

  const handleImageError = () => {
    setImageError(true);
  };

  // REMOVED: 'handleImageLoad' function is no longer needed.

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
            // REMOVED: 'opacity' and 'transition' properties.
          }}
          width={size}
          height={size}
          alt={userName}
          src={image}
          onError={handleImageError}
          // REMOVED: 'onLoad' handler.
        />
      )}
    </Box>
  );
};

export default UserImage;