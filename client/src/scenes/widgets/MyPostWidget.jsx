import {
  DeleteOutlined,
  ImageOutlined,
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
  const [mediaType, setMediaType] = useState(null);
  const [post, setPost] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const { palette } = useTheme();
  const user = useSelector((state) => state.user);
  const { _id, firstName, lastName } = user;
  const token = useSelector((state) => state.token);
  const mediumMain = palette.neutral.mediumMain;
  const medium = palette.neutral.medium;
  const [mediaFiles, setMediaFiles] = useState([]);

  const handlePost = async () => {
    if (isPosting) return;
    if (!post.trim() && mediaFiles.length === 0) {
      alert("Please add a description or select media.");
      return;
    }
    
    setIsPosting(true);
    
    try {
      const formData = new FormData();
      formData.append("userId", _id);
      formData.append("description", post.trim());
      
      if (mediaFiles.length > 0) {
        mediaFiles.forEach((file, index) => {
          // Use indexed names or the backend's expected field name
          formData.append("mediaFiles", file);
          console.log(`Adding file ${index}:`, file.name, file.type, file.size);
        });
        formData.append("mediaType", "mixed");
      }

      console.log('Posting to server...', {
        userId: _id,
        description: post.trim(),
        mediaCount: mediaFiles.length
      });

      const response = await fetch(`https://getsocialnow.onrender.com/posts`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`Failed to create post: ${response.status} - ${errorText}`);
      }

      const posts = await response.json();
      console.log('Post created successfully:', posts);
      
      if (Array.isArray(posts)) {
        dispatch(setPosts({ posts }));
      }
      
      // Reset form
      setMediaFiles([]);
      setMediaType(null);
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
    const newFiles = acceptedFiles.slice(0, 10 - mediaFiles.length);
    
    if (mediaFiles.length + newFiles.length > 10) {
      alert('Maximum 10 items allowed per post');
      return;
    }

    // Check file sizes
    for (const file of newFiles) {
      const isVideo = file.type.startsWith('video/');
      const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      
      if (file.size > maxSize) {
        alert(`${file.name} is too large. Max size: ${isVideo ? '50MB' : '10MB'}`);
        return;
      }
    }

    setMediaFiles([...mediaFiles, ...newFiles]);
    setMediaType('mixed');
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
            acceptedFiles=".jpg,.jpeg,.png,.gif,.webp,.mp4,.mov,.avi,.mkv,.webm"
            multiple={true}
            onDrop={(acceptedFiles) => handleDrop(acceptedFiles, 'mixed')}
          >
            {({ getRootProps, getInputProps }) => (
              <Box>
                <Box {...getRootProps()} border={`2px dashed ${palette.primary.main}`} p="1rem" sx={{ cursor: "pointer" }}>
                  <input {...getInputProps()} />
                  <Typography sx={{ textAlign: 'center' }}>
                    {mediaFiles.length === 0 
                      ? 'Click or drag photos/videos here (max 10)'
                      : `${mediaFiles.length} file(s) selected`}
                  </Typography>
                </Box>
                
                {mediaFiles.length > 0 && (
                  <Box mt="1rem" display="flex" gap="0.5rem" flexWrap="wrap">
                    {mediaFiles.map((file, index) => {
                      const isVideo = file.type.startsWith('video/');
                      return (
                        <Box key={index} position="relative">
                          {isVideo ? (
                            <video 
                              src={URL.createObjectURL(file)} 
                              style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }}
                            />
                          ) : (
                            <img 
                              src={URL.createObjectURL(file)} 
                              alt={`preview-${index}`}
                              style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }}
                            />
                          )}
                          <IconButton
                            size="small"
                            onClick={() => setMediaFiles(mediaFiles.filter((_, i) => i !== index))}
                            sx={{
                              position: 'absolute',
                              top: -8,
                              right: -8,
                              backgroundColor: 'white',
                              '&:hover': { backgroundColor: '#f0f0f0' }
                            }}
                          >
                            <DeleteOutlined fontSize="small" />
                          </IconButton>
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Box>
            )}
          </Dropzone>
        </Box>
      )}

      <Divider sx={{ margin: "1.25rem 0" }} />

      <FlexBetween>
        <FlexBetween 
          gap="0.25rem" 
          onClick={() => {
            setIsMediaUpload(!isMediaUpload);
            setMediaType('mixed');
            if (isMediaUpload) {
              setMediaFiles([]);
            }
          }}
          sx={{ "&:hover": { cursor: "pointer" } }}
        >
          <ImageOutlined sx={{ color: mediumMain }} />
          <Typography color={mediumMain} sx={{ "&:hover": { cursor: "pointer", color: medium } }}>
            Photo/Video
          </Typography>
        </FlexBetween>

        <Button
          disabled={isPosting || (!post.trim() && mediaFiles.length === 0)}
          onClick={handlePost}
          sx={{
            color: palette.background.alt,
            backgroundColor: palette.primary.main,
            borderRadius: "3rem",
            opacity: isPosting ? 0.7 : 1,
            "&:hover": {
              cursor: (isPosting || (!post.trim() && mediaFiles.length === 0)) ? "not-allowed" : "pointer",
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