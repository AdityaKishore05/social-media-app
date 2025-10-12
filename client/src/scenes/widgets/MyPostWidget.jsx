import {
  EditOutlined,
  DeleteOutlined,
  ImageOutlined,
  VideoCameraFrontOutlined,
  LinkOutlined, // Add this import
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
import { useNavigate } from "react-router-dom";

const MyPostWidget = ({ picturePath }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isMediaUpload, setIsMediaUpload] = useState(false);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [videoLink, setVideoLink] = useState(""); // Add this
  const [post, setPost] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const { palette } = useTheme();
  const user = useSelector((state) => state.user);
  const { _id, firstName, lastName } = user;
  const token = useSelector((state) => state.token);
  const mediumMain = palette.neutral.mediumMain;
  const medium = palette.neutral.medium;

const handlePost = async () => {
  if (isPosting) return;
  if (!post.trim() && !mediaFile && !videoLink.trim()) {
    alert("Please add a description, select a file, or add a video link.");
    return;
  }
  
  setIsPosting(true);
  
  try {
    const formData = new FormData();
    formData.append("userId", _id);
    formData.append("description", post.trim());
    
    // If video link exists, send it
    if (videoLink.trim()) {
      formData.append("videoLink", videoLink.trim());
      formData.append("mediaType", "link");
    } else if (mediaFile) {
      formData.append("media", mediaFile);
      formData.append("mediaType", mediaType);
    }

    const response = await fetch(`https://getsocialnow.onrender.com/posts`, {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create post: ${response.status} - ${errorText}`);
    }

    const posts = await response.json();
    
    if (Array.isArray(posts)) {
      dispatch(setPosts({ posts }));
    }
    
    // Reset form
    setMediaFile(null);
    setMediaType(null);
    setVideoLink("");
    setPost("");
    setIsMediaUpload(false);
    
  } catch (error) {
    console.error('Error creating post:', error);
    alert(`Failed to create post: ${error.message}`);
  } finally {
    setIsPosting(false);
  }
};


  const handleDrop = (acceptedFiles, type) => {
    const file = acceptedFiles[0];
    if (file) {
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
        <Box onClick={() => navigate(`/profile/${_id}`)} sx={{ cursor: 'pointer' }}>
          <UserImage 
            image={picturePath} 
            name={`${firstName} ${lastName}`}
          />
        </Box>
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

        {mediaType === 'link' && isMediaUpload && (
          <Box mt="1rem">
            <InputBase
              placeholder="Paste YouTube, Vimeo, Twitch, or other video link..."
              value={videoLink}
              onChange={(e) => setVideoLink(e.target.value)}
              sx={{
                width: "100%",
                backgroundColor: palette.neutral.light,
                borderRadius: "0.5rem",
                padding: "1rem",
                border: `1px solid ${medium}`,
              }}
            />
            {videoLink && (
              <Typography 
                variant="caption" 
                color={palette.primary.main}
                sx={{ mt: 0.5, display: 'block' }}
              >
                Link added ✓
              </Typography>
            )}
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

        <FlexBetween 
          gap="0.25rem" 
          onClick={() => {
            setIsMediaUpload(!isMediaUpload || mediaType !== 'link');
            setMediaType('link');
            setMediaFile(null);
            setVideoLink("");
          }}
          sx={{ "&:hover": { cursor: "pointer" } }}
        >
          <LinkOutlined sx={{ color: mediumMain }} />
          <Typography
            color={mediumMain}
            sx={{ "&:hover": { cursor: "pointer", color: medium } }}
          >
            Link
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