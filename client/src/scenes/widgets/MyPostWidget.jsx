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
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setPosts } from "state";
import { useNavigate } from "react-router-dom";
import { API_ENDPOINTS } from "config";
import { LinearProgress } from "@mui/material";
import { toast } from "react-toastify";
import axios from "axios"; // npm install axios



const MyPostWidget = ({ picturePath }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isMediaUpload, setIsMediaUpload] = useState(false);
  const [post, setPost] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const { palette } = useTheme();
  const user = useSelector((state) => state.user);
  const { _id, firstName, lastName } = user;
  const token = useSelector((state) => state.token);
  const mediumMain = palette.neutral.mediumMain;
  const medium = palette.neutral.medium;
  const [mediaFiles, setMediaFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);


  const handlePost = async () => {
    if (isPosting) return;
    if (!post.trim() && mediaFiles.length === 0) {
      toast.error("Please add a description or select media.");
      return;
    }
  
    setIsPosting(true);
    setUploadProgress(0);
  
    try {
      const formData = new FormData();
      formData.append("userId", _id);
      formData.append("description", post.trim());
  
      if (mediaFiles.length > 0) {
        mediaFiles.forEach((file) => {
          formData.append("mediaFiles", file);
        });
        formData.append("mediaType", "mixed");
      }
  
      const response = await axios.post(API_ENDPOINTS.POSTS.CREATE, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });
  
      const posts = response.data;
      if (Array.isArray(posts)) {
        dispatch(setPosts({ posts }));
      }
  
      setMediaFiles([]);
      setPost("");
      setIsMediaUpload(false);
      setUploadProgress(0);
      toast.success("Post created successfully!");
      localStorage.removeItem("postDraft");
      localStorage.removeItem("postDraftMedia");
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error(`Failed to create post: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsPosting(false);
      setUploadProgress(0);
    }
  };

  // Cleanup previews when unmounting or clearing mediaFiles
useEffect(() => {
  return () => {
    mediaFiles.forEach(file => URL.revokeObjectURL(file.preview));
  };
}, [mediaFiles]);


const handleDrop = (acceptedFiles) => {
  const newFiles = acceptedFiles.slice(0, 20 - mediaFiles.length).map(file => {
    file.preview = URL.createObjectURL(file);
    return file;
  });

  if (mediaFiles.length + newFiles.length > 20) {
    toast.error('Maximum 20 items allowed per post');
    return;
  }

  for (const file of newFiles) {
    const isVideo = file.type.startsWith('video/');
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`${file.name} is too large. Max size: ${isVideo ? '50MB' : '10MB'}`);
      return;
    }
  }

  setMediaFiles([...mediaFiles, ...newFiles]);
};

useEffect(() => {
  const draft = localStorage.getItem("postDraft");
  const draftMedia = localStorage.getItem("postDraftMedia");
  
  if (draft) {
    setPost(draft);
  }
  
  // Note: Media files can't be stored in localStorage, so we only restore text
}, []);

useEffect(() => {
  if (post.trim()) {
    localStorage.setItem("postDraft", post);
  } else {
    localStorage.removeItem("postDraft");
  }
}, [post]);


  return (
    <Box m="1rem">
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
          maxRows={8}
          sx={{
            width: "100%",
            backgroundColor: palette.neutral.light,
            borderRadius: "2rem",
            padding: "1rem 2rem",
            wordWrap: "break-word",
            overflowWrap: "break-word",
          }}
          onKeyDown={(e) => {
            // Prevent posting on Enter, allow Shift+Enter for new line
            if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
              // Don't do anything - let user add new lines freely
              // They can click POST button to submit
            }
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
            onDrop={handleDrop}
          >
            {({ getRootProps, getInputProps }) => (
              <Box>
                <Box 
                  {...getRootProps()} 
                  border={`2px dashed ${palette.primary.main}`} 
                  p="1rem" 
                  sx={{ cursor: "pointer" }}
                >
                  <input {...getInputProps()} />
                  <Typography sx={{ textAlign: 'center' }}>
                    {mediaFiles.length === 0 
                      ? 'Click or drag photos/videos here (max 20)'
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
                              style={{ 
                                width: '80px', 
                                height: '80px', 
                                objectFit: 'cover', 
                                borderRadius: '8px' 
                              }}
                            />
                          ) : (
                            <img 
                              src={URL.createObjectURL(file)} 
                              alt={`preview-${index}`}
                              style={{ 
                                width: '80px', 
                                height: '80px', 
                                objectFit: 'cover', 
                                borderRadius: '8px' 
                              }}
                            />
                          )}
                          <IconButton
                            size="small"
                            onClick={() => setMediaFiles(mediaFiles.filter((_, i) => i !== index))}
                            sx={{
                              position: 'absolute',
                              top: -8,
                              right: -8,
                              backgroundColor: 'orange',
                              '&:hover': { backgroundColor: '#d67e55ff' }
                            }}
                          >
                            <DeleteOutlined fontSize="small"/>
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
      {isPosting && (
        <Box sx={{ mt: 1 }}>
          <LinearProgress variant="determinate" value={uploadProgress} />
          <Typography variant="caption">{Math.round(uploadProgress)}%</Typography>
        </Box>
      )}

      <Divider sx={{ margin: "1.25rem 0" }} />

      <FlexBetween>
        <FlexBetween 
          gap="0.25rem" 
          onClick={() => {
            setIsMediaUpload(!isMediaUpload);
            if (isMediaUpload) {
              setMediaFiles([]);
            }
          }}
          sx={{ "&:hover": { cursor: "pointer" } }}
        >
          <ImageOutlined sx={{ color: mediumMain }} />
          <Typography 
            color={mediumMain} 
            sx={{ "&:hover": { cursor: "pointer", color: medium } }}
          >
            Photo/Video
          </Typography>
        </FlexBetween>

        <Button
            disabled={isPosting || (!post.trim() && mediaFiles.length === 0)}
            onClick={handlePost}
            variant="contained"
          sx={{
              borderRadius: "2rem",
              backgroundColor: isPosting ? palette.neutral.light : palette.primary.main,
              "&:hover": {
                backgroundColor: isPosting ? palette.neutral.light : palette.primary.dark,
              },
          }}
        >
          {isPosting ? "POSTING..." : "POST"}
        </Button>
      </FlexBetween>
    </Box>

  );
};

export default MyPostWidget;