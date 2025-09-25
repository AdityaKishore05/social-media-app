import { Box } from "@mui/material";
import { useState } from "react";

const UserImage = ({ image, size = "60px", name = "" }) => {
  const [imageError, setImageError] = useState(false);

  // Function to get user initials
  const getInitials = (fullName) => {
    if (!fullName) return "U";
    const names = fullName.split(" ");
    if (names.length === 1) return names[0][0]?.toUpperCase() || "U";
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  // Function to generate a consistent color based on name
  const getColorFromName = (name) => {
    if (!name) return "#1976d2";
    
    const colors = [
      "#1976d2", "#d32f2f", "#388e3c", "#f57c00",
      "#7b1fa2", "#c2185b", "#00796b", "#5d4037",
      "#455a64", "#e64a19", "#303f9f", "#0288d1"
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const constructImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    // If it's already a full URL (Cloudinary), return as is
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // If it's a local file path, construct the full URL
    return `https://getsocialnow.onrender.com/assets/${imagePath}`;
  };

  const imageUrl = constructImageUrl(image);
  const initials = getInitials(name);
  const backgroundColor = getColorFromName(name);

  // If no image or image failed to load, show initials
  if (!imageUrl || imageError) {
    return (
      <Box
        width={size}
        height={size}
        sx={{
          borderRadius: "50%",
          backgroundColor: backgroundColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: "bold",
          fontSize: `calc(${size} * 0.4)`,
          flexShrink: 0,
        }}
      >
        {initials}
      </Box>
    );
  }

  // Show image with fallback to initials on error
  return (
    <Box width={size} height={size}>
      <img
        style={{
          objectFit: "cover",
          borderRadius: "50%",
          width: size,
          height: size,
        }}
        alt="user"
        src={imageUrl}
        onError={() => {
          console.log(`Image failed to load: ${imageUrl}`);
          setImageError(true);
        }}
        onLoad={() => {
          console.log(`Image loaded successfully: ${imageUrl}`);
          setImageError(false);
        }}
      />
    </Box>
  );
};

export default UserImage;