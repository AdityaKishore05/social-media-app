import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  useTheme,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import Dropzone from "react-dropzone";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setLogin } from "state";
import FlexBetween from "components/FlexBetween";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

const EditProfileModal = ({ open, onClose, user }) => {
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    location: user?.location || "",
    occupation: user?.occupation || "",
  });
  const [picture, setPicture] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const dispatch = useDispatch();
  const token = useSelector((state) => state.token);
  const { palette } = useTheme();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");

    try {
      const formDataToSend = new FormData();
      
      // Add all text fields
      Object.keys(formData).forEach((key) => {
        formDataToSend.append(key, formData[key]);
      });

      // Add picture if selected
      if (picture) {
        formDataToSend.append("picture", picture);
        formDataToSend.append("picturePath", picture.name);
      }

      const response = await fetch(
        `https://getsocialnow.onrender.com/users/${user._id}/update`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataToSend,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const updatedUser = await response.json();
      
      // Update Redux store with new user data
      dispatch(
        setLogin({
          user: updatedUser,
          token: token,
        })
      );

      onClose();
      window.location.reload(); // Refresh to show updates
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <FlexBetween>
          <Typography variant="h5" fontWeight="600">
            Edit Profile
          </Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </FlexBetween>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Box
            sx={{
              mb: 2,
              p: 2,
              backgroundColor: "#f8d7da",
              color: "#721c24",
              borderRadius: "4px",
            }}
          >
            <Typography>{error}</Typography>
          </Box>
        )}

        <Box display="flex" flexDirection="column" gap="1.5rem" mt={1}>
          {/* Profile Picture Upload */}
          <Box>
            <Typography variant="subtitle2" mb={1} fontWeight="500">
              Profile Picture
            </Typography>
            <Dropzone
              acceptedFiles=".jpg,.jpeg,.png,.gif,.webp"
              multiple={false}
              onDrop={(acceptedFiles) => setPicture(acceptedFiles[0])}
              disabled={isLoading}
            >
              {({ getRootProps, getInputProps }) => (
                <Box
                  {...getRootProps()}
                  border={`2px dashed ${palette.primary.main}`}
                  p="1rem"
                  sx={{
                    "&:hover": { cursor: isLoading ? "not-allowed" : "pointer" },
                    opacity: isLoading ? 0.5 : 1,
                    borderRadius: "8px",
                  }}
                >
                  <input {...getInputProps()} />
                  {!picture ? (
                    <Typography color={palette.neutral.medium}>
                      Click to upload new profile picture
                    </Typography>
                  ) : (
                    <FlexBetween>
                      <Typography>{picture.name}</Typography>
                      <EditOutlinedIcon />
                    </FlexBetween>
                  )}
                </Box>
              )}
            </Dropzone>
          </Box>

          {/* Name Fields */}
          <TextField
            label="First Name"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            disabled={isLoading}
            fullWidth
          />

          <TextField
            label="Last Name"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            disabled={isLoading}
            fullWidth
          />

          {/* Location and Occupation */}
          <TextField
            label="Location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            disabled={isLoading}
            fullWidth
          />

          <TextField
            label="Occupation"
            name="occupation"
            value={formData.occupation}
            onChange={handleChange}
            disabled={isLoading}
            fullWidth
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isLoading}
          sx={{
            backgroundColor: palette.primary.main,
            color: palette.background.alt,
            "&:hover": { backgroundColor: palette.primary.dark },
          }}
        >
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditProfileModal;