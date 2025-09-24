import {
  ChatBubbleOutlineOutlined,
  FavoriteBorderOutlined,
  FavoriteOutlined,
  DeleteOutline,
} from "@mui/icons-material";
import { Box, Divider, IconButton, Typography, useTheme, InputBase, Button } from "@mui/material";
import FlexBetween from "components/FlexBetween";
import Friend from "components/Friend";
import WidgetWrapper from "components/WidgetWrapper";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setPost, setPosts } from "state";

const PostWidget = ({
  postId,
  postUserId,
  name,
  description,
  location,
  picturePath,
  userPicturePath,
  likes,
  comments,
  videoPath,
}) => {
  const [mediaError, setMediaError] = useState(false);
  const [isComments, setIsComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const dispatch = useDispatch();
  const token = useSelector((state) => state.token);
  const loggedInUserId = useSelector((state) => state.user._id);
  const isLiked = Boolean(likes[loggedInUserId]);
  const likeCount = Object.keys(likes).length;

  const { palette } = useTheme();
  const main = palette.neutral.main;
  const primary = palette.primary.main;

  useEffect(() => {
    setMediaError(false);
  }, [picturePath, videoPath]);

  // FIXED: Add cache-busting headers and better error handling
  const patchLike = async () => {
    if (isLiking) return; // Prevent double clicks
    
    setIsLiking(true);
    try {
      const response = await fetch(`https://getsocialnow.onrender.com/posts/${postId}/like`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify({ userId: loggedInUserId }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update like status: ${response.status}`);
      }
      
      const updatedPost = await response.json();
      dispatch(setPost({ post: updatedPost }));
      console.log('Like updated successfully');
    } catch (error) {
      console.error("Like action failed:", error);
      alert('Failed to update like. Please try again.');
    } finally {
      setIsLiking(false);
    }
  };

  // FIXED: Add cache-busting headers and better error handling
  const handleComment = async () => {
    if (!commentText.trim() || isCommenting) return;
    
    setIsCommenting(true);
    try {
      const response = await fetch(`https://getsocialnow.onrender.com/posts/${postId}/comment`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
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
      console.log('Comment added successfully');
    } catch (error) {
      console.error("Error adding comment:", error);
      alert('Failed to add comment. Please try again.');
    } finally {
      setIsCommenting(false);
    }
  };

  // FIXED: Add cache-busting headers and better error handling
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post?") || isDeleting) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`https://getsocialnow.onrender.com/posts/${postId}/delete`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify({ userId: loggedInUserId }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete post: ${response.status}`);
      }
      
      const updatedPosts = await response.json();
      dispatch(setPosts({ posts: updatedPosts }));
      console.log('Post deleted successfully');
    } catch (error) {
      console.error("Error deleting post:", error);
      alert('Failed to delete post. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // FIXED: Better media URL construction
  const getMediaUrl = (mediaPath) => {
    if (!mediaPath) return null;
    
    // If it's already a full URL, return as is
    if (mediaPath.startsWith('http')) return mediaPath;
    
    // Construct full URL with API base
    return `https://getsocialnow.onrender.com/assets/${mediaPath}`;
  };

  const imageUrl = getMediaUrl(picturePath);
  const videoUrl = getMediaUrl(videoPath);

  return (
    <WidgetWrapper m="2rem 0">
      <Friend
        friendId={postUserId}
        name={name}
        subtitle={location}
        userPicturePath={userPicturePath}
      />
      
      <Typography color={main} sx={{ mt: "1rem" }}>
        {description}
      </Typography>

      {/* FIXED: Better media handling with error states */}
      {(imageUrl || videoUrl) && !mediaError && (
        <Box
          sx={{
            width: "100%",
            paddingTop: "100%",
            position: "relative",
            backgroundColor: "black",
            borderRadius: "0.75rem",
            marginTop: "0.75rem",
          }}
        >
          {videoUrl ? (
            <video
              width="100%"
              height="100%"
              controls
              src={videoUrl}
              onError={(e) => {
                console.error('Video load error:', e);
                setMediaError(true);
              }}
              onLoadStart={() => console.log('Video loading started')}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                objectFit: "contain",
                objectPosition: "center",
              }}
            >
              Your browser does not support the video tag.
            </video>
          ) : imageUrl ? (
            <img
              alt={description || 'Post image'}
              src={imageUrl}
              onError={(e) => {
                console.error('Image load error:', e);
                setMediaError(true);
              }}
              onLoad={() => console.log('Image loaded successfully')}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "contain",
                objectPosition: "center",
              }}
            />
          ) : null}
        </Box>
      )}

      {/* Show error message if media fails to load */}
      {mediaError && (imageUrl || videoUrl) && (
        <Box
          sx={{
            width: "100%",
            height: "200px",
            backgroundColor: palette.neutral.light,
            borderRadius: "0.75rem",
            marginTop: "0.75rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography color={palette.neutral.medium}>
            Failed to load media content
          </Typography>
        </Box>
      )}

      <FlexBetween mt="0.25rem">
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
        
        {/* Delete button - only show for post owner */}
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

      {/* Comments section */}
      {isComments && (
        <Box mt="0.5rem">
          {/* FIXED: Better comment handling with validation */}
          {comments && comments.length > 0 ? (
            comments.map((comment, index) => {
              // Handle both old string format and new object format
              const commentId = comment._id || `comment-${index}`;
              const commentName = comment.firstName && comment.lastName 
                ? `${comment.firstName} ${comment.lastName}`
                : comment.name || 'Unknown User';
              const commentContent = comment.commentText || comment.text || comment;

              return (
                <Box key={commentId}>
                  <Divider />
                  <Typography sx={{ color: main, m: "0.5rem 0", pl: "1rem" }}>
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
          <FlexBetween gap="1.5rem" mt="0.5rem">
            <InputBase
              placeholder="Write a comment..."
              onChange={(e) => setCommentText(e.target.value)}
              value={commentText}
              disabled={isCommenting}
              sx={{
                width: "100%",
                backgroundColor: palette.neutral.light,
                borderRadius: "2rem",
                padding: "0.5rem 1.5rem"
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleComment();
                }
              }}
            />
            <Button
              disabled={!commentText.trim() || isCommenting}
              onClick={handleComment}
              sx={{
                color: palette.background.alt,
                backgroundColor: primary,
                borderRadius: "3rem"
              }}
            >
              {isCommenting ? 'SENDING...' : 'SEND'}
            </Button>
          </FlexBetween>
        </Box>
      )}
    </WidgetWrapper>
  );
};

export default PostWidget;