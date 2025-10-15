import {
  ChatBubbleOutlineOutlined,
  FavoriteBorderOutlined,
  FavoriteOutlined,
  DeleteOutline,
  ChevronLeft,
  ChevronRight,
} from "@mui/icons-material";
import { Box, Divider, IconButton, Typography, useTheme, InputBase, Button, useMediaQuery } from "@mui/material";
import FlexBetween from "components/FlexBetween";
import Friend from "components/Friend";
import { useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setPost, setPosts } from "state";

const PostWidget = ({
  postId,
  postUserId,
  name,
  description,
  userPicturePath,
  mediaItems,
  likes,
  comments,
  createdAt,
  // OLD FORMAT FIELDS - for backward compatibility
  picturePath,
  videoPath,
}) => {
  const isNonMobileScreens = useMediaQuery("(min-width:1025px)");
  const [isComments, setIsComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mediaError, setMediaError] = useState({});

  const dispatch = useDispatch();
  const token = useSelector((state) => state.token);
  const loggedInUserId = useSelector((state) => state.user._id);
  const isLiked = Boolean(likes[loggedInUserId]);
  const likeCount = Object.keys(likes).length;

  const { palette } = useTheme();
  const main = palette.neutral.main;
  const primary = palette.primary.main;

  // Helper function to construct proper media URL
  const constructMediaUrl = (path) => {
    if (!path) return null;
    
    // If it's already a full URL (http:// or https://), return as-is
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    // If it's a relative path, prepend the server URL
    return `https://getsocialnow.onrender.com/assets/${path}`;
  };

  // BACKWARD COMPATIBILITY: Convert old format to new format
  const items = useMemo(() => {
    // If new format exists, use it
    if (mediaItems && mediaItems.length > 0) {
      return mediaItems;
    }

    // Otherwise, convert old format to new format
    const oldFormatItems = [];

    if (picturePath) {
      oldFormatItems.push({
        url: constructMediaUrl(picturePath),
        type: 'image',
      });
    }

    if (videoPath) {
      oldFormatItems.push({
        url: constructMediaUrl(videoPath),
        type: 'video',
      });
    }

    return oldFormatItems;
  }, [mediaItems, picturePath, videoPath]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recently';
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const patchLike = async () => {
    if (isLiking) return;
    
    setIsLiking(true);
    try {
      const response = await fetch(`https://getsocialnow.onrender.com/posts/${postId}/like`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: loggedInUserId }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update like status: ${response.status}`);
      }
      
      const updatedPost = await response.json();
      dispatch(setPost({ post: updatedPost }));
    } catch (error) {
      console.error("Like action failed:", error);
      alert('Failed to update like. Please try again.');
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || isCommenting) return;
    
    setIsCommenting(true);
    try {
      const response = await fetch(`https://getsocialnow.onrender.com/posts/${postId}/comment`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: loggedInUserId,
          commentText: commentText.trim(),
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to add comment: ${response.status}`);
      }
      
      const updatedPost = await response.json();
      dispatch(setPost({ post: updatedPost }));
      setCommentText("");
    } catch (error) {
      console.error("Error adding comment:", error);
      alert('Failed to add comment. Please try again.');
    } finally {
      setIsCommenting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post?") || isDeleting) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`https://getsocialnow.onrender.com/posts/${postId}/delete`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: loggedInUserId }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete post: ${response.status}`);
      }
      
      const updatedPosts = await response.json();
      dispatch(setPosts({ posts: updatedPosts }));
    } catch (error) {
      console.error("Error deleting post:", error);
      alert('Failed to delete post. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMediaError = (index) => {
    console.error(`Failed to load media at index ${index}:`, items[index]);
    setMediaError(prev => ({ ...prev, [index]: true }));
  };

  return (
    <Box my="1rem">
      <Friend
        padding="20px"
        friendId={postUserId} 
        name={name} 
        subtitle={formatDate(createdAt)} 
        userPicturePath={userPicturePath}
      />

      {items.length > 0 && (
        <Box
        sx={{
          width: "100%",
          paddingTop: isNonMobileScreens ? "60%" : "150%",
          position: "relative", 
          backgroundColor: "black", 
          marginTop: "1.2rem",
          marginBottom:"0.5rem"
        }}
      >
          {mediaError[currentIndex] ? (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: palette.neutral.light,
              }}
            >
              <Typography color={palette.neutral.medium}>
                Failed to load media
              </Typography>
            </Box>
          ) : items[currentIndex].type === 'video' ? (
            <video
              width="100%"
              height="100%"
              controls
              src={items[currentIndex].url}
              onError={() => handleMediaError(currentIndex)}
              style={{ 
                position: "absolute", 
                top: 0, 
                left: 0, 
                objectFit: "contain" 
              }}
            />
          ) : (
            <img
              src={items[currentIndex].url}
              alt="post media"
              onError={() => handleMediaError(currentIndex)}
              style={{ 
                position: "absolute", 
                top: 0, 
                left: 0, 
                width: "100%", 
                height: "100%", 
                objectFit: "contain" 
              }}
            />
          )}
          
          {items.length > 1 && (
            <>
              <IconButton 
                onClick={() => setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)}
                sx={{ 
                  position: "absolute", 
                  left: 8, 
                  top: "50%", 
                  transform: "translateY(-50%)", 
                  backgroundColor: "rgba(255,255,255,0.8)",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.9)",
                  }
                }}
              >
                <ChevronLeft />
              </IconButton>
              
              <IconButton 
                onClick={() => setCurrentIndex((prev) => (prev + 1) % items.length)}
                sx={{ 
                  position: "absolute", 
                  right: 8, 
                  top: "50%", 
                  transform: "translateY(-50%)", 
                  backgroundColor: "rgba(255,255,255,0.8)",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.9)",
                  }
                }}
              >
                <ChevronRight />
              </IconButton>
              
              <Box 
                sx={{ 
                  position: "absolute", 
                  bottom: 8, 
                  left: "50%", 
                  transform: "translateX(-50%)", 
                  display: "flex", 
                  gap: "4px" 
                }}
              >
                {items.map((_, index) => (
                  <Box
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: "50%", 
                      backgroundColor: index === currentIndex ? "white" : "rgba(255,255,255,0.5)", 
                      cursor: "pointer",
                      transition: "all 0.2s",
                      "&:hover": {
                        backgroundColor: "rgba(255,255,255,0.8)",
                      }
                    }}
                  />
                ))}
              </Box>
            </>
          )}
        </Box>
      )}
      <Typography
        color={main}
        variant="h5"
        fontWeight="500"
        display="flex"
        flexDirection="colomn"
        >
        {name} -
        {description && (
        <Typography 
          color={main} 
          sx={{ 
            mx: "0.5rem",
            wordWrap: "break-word",
            overflowWrap: "break-word",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {description}
        </Typography>
      )}
      </Typography>

      

      <FlexBetween mb="0.5rem">
        <FlexBetween gap="1rem">
          <FlexBetween gap="0.3rem">
            <IconButton onClick={patchLike} disabled={isLiking}>
              {isLiked ? (
                <FavoriteOutlined sx={{ color: primary }} />
              ) : (
                <FavoriteBorderOutlined />
              )}
            </IconButton>
            <Typography>{likeCount}</Typography>
          </FlexBetween>
          
          <FlexBetween gap="0.3rem">
            <IconButton onClick={() => setIsComments(!isComments)}>
              <ChatBubbleOutlineOutlined />
            </IconButton>
            <Typography>{comments?.length || 0}</Typography>
          </FlexBetween>
        </FlexBetween>
        
        {loggedInUserId === postUserId && (
          <IconButton 
            onClick={handleDelete} 
            disabled={isDeleting}
            sx={{ color: palette.neutral.medium }}
          >
            <DeleteOutline />
          </IconButton>
        )}
      </FlexBetween>

      {isComments && (
        <Box m="0.5rem">
          {comments && comments.length > 0 ? (
            comments.map((comment, index) => {
              const commentId = comment._id || `comment-${index}`;
              const commentName = comment.firstName && comment.lastName 
                ? `${comment.firstName} ${comment.lastName}`
                : comment.name || 'Unknown User';
              const commentContent = comment.commentText || comment.text || comment;

              return (
                <Box key={commentId}>
                  <Divider />
                  <Typography 
                    sx={{ 
                      color: main, 
                      m: "0.5rem 0", 
                      pl: "1rem",
                      wordWrap: "break-word",
                      overflowWrap: "break-word",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>
                      {commentName}
                    </span>
                    {` — ${commentContent}`}
                  </Typography>
                </Box>
              );
            })
          ) : (
            <Typography sx={{ color: main, m: "0.5rem 0", pl: "1rem", fontStyle: 'italic' }}>
              No comments yet
            </Typography>
          )}
          
          <Divider />
          <FlexBetween gap="1.5rem" mt="0.5rem" alignItems="flex-end" mb="1rem">
            <InputBase
              placeholder="Write a comment..."
              onChange={(e) => setCommentText(e.target.value)}
              value={commentText}
              disabled={isCommenting}
              multiline
              maxRows={4}
              sx={{
                width: "100%",
                backgroundColor: palette.neutral.light,
                borderRadius: "2rem",
                padding: "0.5rem 1.5rem",
                minHeight: "40px",
                alignItems: "center",
              }}
              onKeyDown={(e) => {
                // Enter for new line, Ctrl+Enter or Cmd+Enter to submit
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleComment();
                }
                // Just Enter adds new line (default behavior)
              }}
            />
            <Button
              disabled={!commentText.trim() || isCommenting}
              onClick={handleComment}
              sx={{
                color: palette.background.alt,
                backgroundColor: primary,
                borderRadius: "3rem",
                minWidth: "80px",
                flexShrink: 0,
              }}
            >
              {isCommenting ? 'SENDING...' : 'SEND'}
            </Button>
          </FlexBetween>
        </Box>
      )}
      <Divider ></Divider>
    </Box>
  );
};

export default PostWidget;