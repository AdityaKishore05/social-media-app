import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  Avatar,
  CircularProgress,
  useTheme,
} from "@mui/material";
import { Close as CloseIcon, PhotoCamera } from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { setLogin } from "state";

const EditProfileModal = ({ open, onClose, user }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const token = useSelector((state) => state.token);
  
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    bio: user?.bio || "",
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user?.picturePath || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError("Please select an image file");
        return;
      }
      
      setProfilePicture(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(""); // Clear any previous errors
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");

    try {
      console.log("Updating profile for user:", user._id);
      
      const formDataToSend = new FormData();
      formDataToSend.append("firstName", formData.firstName.trim());
      formDataToSend.append("lastName", formData.lastName.trim());
      formDataToSend.append("bio", formData.bio.trim());
      
      if (profilePicture) {
        console.log("Including new profile picture");
        formDataToSend.append("picture", profilePicture);
      }

      const response = await fetch(
        `https://getsocialnow.onrender.com/users/${user._id}/update`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            // Don't set Content-Type - let browser set it with boundary
          },
          body: formDataToSend,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }

      const updatedUser = await response.json();
      console.log("Profile updated successfully:", updatedUser);
      
      // Update Redux state with new user data
      dispatch(setLogin({
        user: updatedUser,
        token: token,
      }));

      // Close modal and show success
      onClose();
      
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err.message || "Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "12px",
          // Remove elevation prop, use sx instead
        }
      }}
    >
      <DialogTitle
        sx={{
          borderBottom: `1px solid ${theme.palette.divider}`,
          pb: 2,
        }}
      >
        Edit Profile
        <IconButton
          onClick={onClose}
          sx={{ 
            position: "absolute", 
            right: 8, 
            top: 8,
            color: theme.palette.grey[500],
          }}
          disabled={isLoading}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        {error && (
          <Box
            sx={{
              mb: 2,
              p: 2,
              backgroundColor: theme.palette.error.light,
              color: theme.palette.error.dark,
              borderRadius: "8px",
            }}
          >
            <Typography variant="body2">{error}</Typography>
          </Box>
        )}

        <Box display="flex" flexDirection="column" gap={3}>
          {/* Profile Picture Section */}
          <Box 
            display="flex" 
            flexDirection="column" 
            alignItems="center" 
            gap={2}
            sx={{
              p: 2,
              backgroundColor: theme.palette.background.default,
              borderRadius: "8px",
            }}
          >
            <Avatar
              src={previewUrl}
              alt={`${formData.firstName} ${formData.lastName}`}
              sx={{ 
                width: 100, 
                height: 100,
                border: `3px solid ${theme.palette.primary.main}`,
              }}
            />
            <Button
              variant="outlined"
              component="label"
              startIcon={<PhotoCamera />}
              disabled={isLoading}
              sx={{ textTransform: "none" }}
            >
              Change Photo
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleImageChange}
                disabled={isLoading}
              />
            </Button>
            {profilePicture && (
              <Typography variant="caption" color="text.secondary">
                New photo selected: {profilePicture.name}
              </Typography>
            )}
          </Box>

          {/* Form Fields */}
          <TextField
            name="firstName"
            label="First Name"
            value={formData.firstName}
            onChange={handleChange}
            fullWidth
            disabled={isLoading}
            required
            inputProps={{ maxLength: 50 }}
          />

          <TextField
            name="lastName"
            label="Last Name"
            value={formData.lastName}
            onChange={handleChange}
            fullWidth
            disabled={isLoading}
            required
            inputProps={{ maxLength: 50 }}
          />

          <TextField
            name="bio"
            label="Bio"
            value={formData.bio}
            onChange={handleChange}
            multiline
            rows={4}
            fullWidth
            disabled={isLoading}
            inputProps={{ maxLength: 500 }}
            helperText={`${formData.bio.length}/500 characters`}
            placeholder="Tell us about yourself..."
          />
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          borderTop: `1px solid ${theme.palette.divider}`,
          pt: 2,
          px: 3,
          pb: 2,
        }}
      >
        <Button 
          onClick={onClose} 
          disabled={isLoading}
          sx={{ textTransform: "none" }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isLoading || !formData.firstName.trim() || !formData.lastName.trim()}
          sx={{ 
            textTransform: "none",
            minWidth: "120px",
          }}
        >
          {isLoading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "Save Changes"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditProfileModal;