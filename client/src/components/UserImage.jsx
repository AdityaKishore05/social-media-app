import { Box } from "@mui/material";
import { useState } from "react";

const UserImage = ({ image, size = "60px", userName = "" }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageError = () => {
    console.error('Failed to load image:', `${process.env.REACT_APP_API_URL}/assets/${image}`);
    setImageError(true);
  };

  const handleImageLoad = () => {
    console.log('Successfully loaded image:', `${process.env.REACT_APP_API_URL}/assets/${image}`);
    setImageLoaded(true);
  };

  // Generate a default avatar URL (using UI Avatars service)
  const getDefaultAvatar = () => {
    const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random&color=fff&size=150`;
  };

  // Debug logging
  console.log('UserImage props:', { image, size, userName });

  return (
    <Box width={size} height={size}>
      {imageError || !image ? (
        // Use external default avatar service
        <img
          style={{ 
            objectFit: "cover", 
            borderRadius: "50%" 
          }}
          width={size}
          height={size}
          alt="user"
          src={getDefaultAvatar()}
          onError={() => {
            // Last fallback - colored circle with initial
            console.error('Even default avatar failed to load');
          }}
        />
      ) : (
        <img
          style={{ 
            objectFit: "cover", 
            borderRadius: "50%",
            opacity: imageLoaded ? 1 : 0.5 
          }}
          width={size}
          height={size}
          alt="user"
          src={`${process.env.REACT_APP_API_URL}/assets/${image}`}
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
      )}
    </Box>
  );
};

export default UserImage;