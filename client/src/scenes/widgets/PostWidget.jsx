import {
  ChatBubbleOutlineOutlined,
  FavoriteBorderOutlined,
  FavoriteOutlined,
  DeleteOutline,
  ChevronLeft,
  ChevronRight,
} from "@mui/icons-material";
import { Box, Divider, IconButton, Typography, useTheme, InputBase, Button } from "@mui/material";
import FlexBetween from "components/FlexBetween";
import Friend from "components/Friend";
import WidgetWrapper from "components/WidgetWrapper";
import { useState } from "react";
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
  createdAt, // Add this

}) => {
  const [mediaError, setMediaError] = useState(false);
  const [isComments, setIsComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const items = mediaItems || [];
  const [currentIndex, setCurrentIndex] = useState(0);

  const dispatch = useDispatch();
  const token = useSelector((state) => state.token);
  const loggedInUserId = useSelector((state) => state.user._id);
  const isLiked = Boolean(likes[loggedInUserId]);
  const likeCount = Object.keys(likes).length;

  const { palette } = useTheme();
  const main = palette.neutral.main;
  const primary = palette.primary.main;
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

  return (
    <WidgetWrapper m="1rem 0">
      <Friend friendId={postUserId} name={name} subtitle={formatDate(createdAt)} userPicturePath={userPicturePath} />
      
      <Typography color={main} sx={{ mt: "1rem" }}>{description}</Typography>

      {items.length > 0 && (
        <Box sx={{ width: "100%", paddingBottom: "70%", position: "relative", backgroundColor: "black", borderRadius: "0.75rem", marginTop: "0.75rem" }}>
          {items[currentIndex].type === 'video' ? (
            <video
              width="100%"
              height="100%"
              controls
              src={items[currentIndex].url}
              style={{ position: "absolute", top: 0, left: 0, objectFit: "contain" }}
            />
          ) : (
            <img
              src={items[currentIndex].url}
              alt="post media"
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "contain" }}
            />
          )}
          
          {items.length > 1 && (
            <>
              <IconButton onClick={() => setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)}
                sx={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", backgroundColor: "rgba(255,255,255,0.8)" }}>
                <ChevronLeft />
              </IconButton>
              
              <IconButton onClick={() => setCurrentIndex((prev) => (prev + 1) % items.length)}
                sx={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", backgroundColor: "rgba(255,255,255,0.8)" }}>
                <ChevronRight />
              </IconButton>
              
              <Box sx={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", display: "flex", gap: "4px" }}>
                {items.map((_, index) => (
                  <Box
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: index === currentIndex ? "white" : "rgba(255,255,255,0.5)", cursor: "pointer" }}
                  />
                ))}
              </Box>
            </>
          )}
        </Box>
      )}

      {/* Show error message if media fails to load */}
      {mediaError && (items) && (
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