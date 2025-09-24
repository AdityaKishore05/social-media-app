import {
  EditOutlined,
  DeleteOutlined,
  ImageOutlined,
  VideoCameraFrontOutlined, // NEW: Import video icon
} from "@mui/icons-material";
import {
  Box,
  Divider,
  Typography,
  InputBase,
  useTheme,
  Button,
  IconButton,
} from "@mui/material";
import FlexBetween from "components/FlexBetween";
import Dropzone from "react-dropzone";
import UserImage from "components/UserImage";
import WidgetWrapper from "components/WidgetWrapper";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setPosts } from "state";

const MyPostWidget = ({ picturePath }) => {
  const dispatch = useDispatch();
  const [isMediaUpload, setIsMediaUpload] = useState(false); // Combined state for image/video upload section
  const [mediaFile, setMediaFile] = useState(null); // Holds either image or video file
  const [mediaType, setMediaType] = useState(null); // 'image' or 'video'
  const [post, setPost] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const { palette } = useTheme();
  const { _id } = useSelector((state) => state.user);
  const token = useSelector((state) => state.token);
  // No need for `posts` state here, as backend returns all posts after creation.
  const mediumMain = palette.neutral.mediumMain;
  const medium = palette.neutral.medium;

  const handlePost = async () => {
    if (isPosting) return; // Prevent multiple submissions
    if (!post.trim() && !mediaFile) { // Ensure at least text or media is present
        alert("Please add a description or select an image/video to post.");
        return;
    }
    
    setIsPosting(true);
    
    try {
      const formData = new FormData();
      formData.append("userId", _id);
      formData.append("description", post);
      
      if (mediaFile) {
        formData.append("media", mediaFile); // Use a generic name like 'media'
        formData.append("mediaPath", mediaFile.name); // Send filename for backend
        formData.append("mediaType", mediaType); // Tell backend if it's 'image' or 'video'
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL}/posts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to create post: ${response.status}`);
      }

      const posts = await response.json(); // Backend should return all updated posts
      dispatch(setPosts({ posts })); // Update global posts state
      
      // Reset form
      setMediaFile(null);
      setMediaType(null);
      setPost("");
      setIsMediaUpload(false);
      
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleDrop = (acceptedFiles, type) => {
    setMediaFile(acceptedFiles[0]);
    setMediaType(type);
  };

  return (
    <WidgetWrapper>
      <FlexBetween gap="1.5rem">
        <UserImage image={picturePath} />
        <InputBase
          placeholder="What's on your mind..."
          onChange={(e) => setPost(e.target.value)}
          value={post}
          sx={{
            width: "100%",
            backgroundColor: palette.neutral.light,
            borderRadius: "2rem",
            padding: "1rem 2rem",
          }}
        />
      </FlexBetween>

      {isMediaUpload && (
        <Box
          border={`1px solid ${medium}`}
          borderRadius="5px"
          mt="1rem"
          p="1rem"
        >
          <Dropzone
            acceptedFiles={mediaType === 'image' ? ".jpg,.jpeg,.png" : ".mp4,.mov,.avi"} // Accept files based on selected type
            multiple={false}
            onDrop={(acceptedFiles) => handleDrop(acceptedFiles, mediaType)}
          >
            {({ getRootProps, getInputProps }) => (
              <FlexBetween>
                <Box
                  {...getRootProps()}
                  border={`2px dashed ${palette.primary.main}`}
                  p="1rem"
                  width="100%"
                  sx={{ "&:hover": { cursor: "pointer" } }}
                >
                  <input {...getInputProps()} />
                  {!mediaFile ? (
                    <p>
                      {mediaType === 'image' ? "Add Image Here" : "Add Video Here"}
                    </p>
                  ) : (
                    <FlexBetween>
                      <Typography>{mediaFile.name}</Typography>
                      <EditOutlined />
                    </FlexBetween>
                  )}
                </Box>
                {mediaFile && (
                  <IconButton
                    onClick={() => { setMediaFile(null); setMediaType(null); }}
                    sx={{ width: "15%" }}
                  >
                    <DeleteOutlined />
                  </IconButton>
                )}
              </FlexBetween>
            )}
          </Dropzone>
        </Box>
      )}

      <Divider sx={{ margin: "1.25rem 0" }} />

      <FlexBetween>
        {/* Image Upload Option */}
        <FlexBetween 
          gap="0.25rem" 
          onClick={() => {
            setIsMediaUpload(true);
            setMediaType('image');
            setMediaFile(null); // Clear previous media selection
          }}
        >
          <ImageOutlined sx={{ color: mediumMain }} />
          <Typography
            color={mediumMain}
            sx={{ "&:hover": { cursor: "pointer", color: medium } }}
          >
            Image
          </Typography>
        </FlexBetween>

        {/* Video Upload Option */}
        <FlexBetween 
          gap="0.25rem" 
          onClick={() => {
            setIsMediaUpload(true);
            setMediaType('video');
            setMediaFile(null); // Clear previous media selection
          }}
        >
          <VideoCameraFrontOutlined sx={{ color: mediumMain }} />
          <Typography
            color={mediumMain}
            sx={{ "&:hover": { cursor: "pointer", color: medium } }}
          >
            Video
          </Typography>
        </FlexBetween>

        <Button
          disabled={isPosting || (!post.trim() && !mediaFile)} // Disable if no text and no media
          onClick={handlePost}
          sx={{
            color: palette.background.alt,
            backgroundColor: palette.primary.main,
            borderRadius: "3rem",
            opacity: isPosting ? 0.7 : 1,
            "&:hover": {
                cursor: (isPosting || (!post.trim() && !mediaFile)) ? "not-allowed" : "pointer",
                backgroundColor: palette.primary.dark,
            },
            "&:disabled": {
                backgroundColor: palette.neutral.light,
            }
          }}
        >
          {isPosting ? "POSTING..." : "POST"}
        </Button>
      </FlexBetween>
    </WidgetWrapper>
  );
};

export default MyPostWidget;