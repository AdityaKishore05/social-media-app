import {
  EditOutlined,
  DeleteOutlined,
  ImageOutlined,
  VideoCameraFrontOutlined,
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
  const [isMediaUpload, setIsMediaUpload] = useState(false);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [post, setPost] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const { palette } = useTheme();
  const { _id } = useSelector((state) => state.user);
  const token = useSelector((state) => state.token);
  const mediumMain = palette.neutral.mediumMain;
  const medium = palette.neutral.medium;

  const handlePost = async () => {
    if (isPosting) return;
    if (!post.trim() && !mediaFile) {
      alert("Please add a description or select an image/video to post.");
      return;
    }
    
    setIsPosting(true);
    
    try {
      const formData = new FormData();
      formData.append("userId", _id);
      formData.append("description", post.trim());
      
      if (mediaFile) {
        // FIXED: Use 'media' as field name to match backend multer config
        formData.append("media", mediaFile);
        formData.append("mediaType", mediaType);
        
        // Debug: Log file details
        console.log('Uploading file:', {
          name: mediaFile.name,
          type: mediaFile.type,
          size: mediaFile.size,
          mediaType: mediaType
        });
      }

      // FIXED: Remove Content-Type header - let browser set it automatically for FormData
      const response = await fetch(`https://getsocialnow.onrender.com/posts`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          // Removed Content-Type - browser will set multipart/form-data automatically
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', response.status, errorText);
        throw new Error(`Failed to create post: ${response.status} - ${errorText}`);
      }

      const posts = await response.json();
      console.log('Post created successfully, received posts:', posts.length);
      dispatch(setPosts({ posts }));
      
      // Reset form
      setMediaFile(null);
      setMediaType(null);
      setPost("");
      setIsMediaUpload(false);
      
      // Show success message
      alert("Post created successfully!");
      
    } catch (error) {
      console.error('Error creating post:', error);
      alert(`Failed to create post: ${error.message}`);
    } finally {
      setIsPosting(false);
    }
  };

  // FIXED: Better file validation and handling
const handleDrop = (acceptedFiles, type) => {
  const file = acceptedFiles[0];
  if (file) {
    // Check file size (50MB = 100 * 1024 * 1024 bytes)
    if (file.size > 50 * 1024 * 1024) {
      alert('File is too large. Maximum size is 50MB.');
      return;
    }
    console.log('File selected:', file.name, 'Type:', type, 'Size:', (file.size / 1024 / 1024).toFixed(2) + 'MB');
    setMediaFile(file);
    setMediaType(type);
  }
};

  return (
    <WidgetWrapper>
      <FlexBetween gap="1.5rem">
        <UserImage image={picturePath} />
        <InputBase
          placeholder="What's on your mind..."
          onChange={(e) => setPost(e.target.value)}
          value={post}
          multiline
          maxRows={4}
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
          acceptedFiles={mediaType === 'image' 
            ? ".jpg,.jpeg,.png,.gif,.webp" 
            : ".mp4,.mov,.avi,.mkv,.webm,.flv,.wmv"}
          multiple={false}
          onDrop={(acceptedFiles) => handleDrop(acceptedFiles, mediaType)}
>
            {({ getRootProps, getInputProps, isDragActive }) => (
              <FlexBetween>
                <Box
                  {...getRootProps()}
                  border={`2px dashed ${isDragActive ? palette.primary.dark : palette.primary.main}`}
                  p="1rem"
                  width="100%"
                  sx={{ 
                    "&:hover": { cursor: "pointer" },
                    backgroundColor: isDragActive ? palette.primary.light : 'transparent'
                  }}
                >
                  <input {...getInputProps()} />
                  {!mediaFile ? (
                    <Typography sx={{ textAlign: 'center' }}>
                      {isDragActive 
                        ? `Drop ${mediaType} here...`
                        : `Click or drag ${mediaType} here`}
                    </Typography>
                  ) : (
                    <FlexBetween>
                      <Typography>{mediaFile.name}</Typography>
                      <EditOutlined />
                    </FlexBetween>
                  )}
                </Box>
                {mediaFile && (
                  <IconButton
                    onClick={(e) => { 
                      e.stopPropagation();
                      setMediaFile(null); 
                      setMediaType(null);
                      setIsMediaUpload(false);
                    }}
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
        <FlexBetween 
          gap="0.25rem" 
          onClick={() => {
            setIsMediaUpload(!isMediaUpload || mediaType !== 'image');
            setMediaType('image');
            setMediaFile(null);
          }}
          sx={{ "&:hover": { cursor: "pointer" } }}
        >
          <ImageOutlined sx={{ color: mediumMain }} />
          <Typography
            color={mediumMain}
            sx={{ "&:hover": { cursor: "pointer", color: medium } }}
          >
            Image
          </Typography>
        </FlexBetween>

        <FlexBetween 
          gap="0.25rem" 
          onClick={() => {
            setIsMediaUpload(!isMediaUpload || mediaType !== 'video');
            setMediaType('video');
            setMediaFile(null);
          }}
          sx={{ "&:hover": { cursor: "pointer" } }}
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
          disabled={isPosting || (!post.trim() && !mediaFile)}
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
