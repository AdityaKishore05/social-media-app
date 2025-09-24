import { Box } from "@mui/material";
import { useState, useEffect } from "react";

const UserImage = ({ image, size = "60px", userName = "" }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

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

  const getDefaultAvatar = () => {
    // FIX: The 'initials' variable was unused and has been removed.
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      userName
    )}&background=random&color=fff&size=150`;
  };

  return (
    <Box width={size} height={size}>
      {imageError || !image ? (
        <img
          style={{ objectFit: "cover", borderRadius: "50%" }}
          width={size}
          height={size}
          alt={userName}
          src={getDefaultAvatar()}
        />
      ) : (
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