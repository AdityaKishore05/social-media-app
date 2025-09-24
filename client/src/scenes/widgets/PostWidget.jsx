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
import { useState, useEffect, useCallback, useMemo } from "react";
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

  // FIXED: Memoize media URLs to prevent constant recalculation
  const mediaUrls = useMemo(() => {
    const getMediaUrl = (mediaPath) => {
      if (!mediaPath) return null;
      if (mediaPath.startsWith('http')) return mediaPath;
      return `https://getsocialnow.onrender.com/assets/${mediaPath}`;
    };

    return {
      imageUrl: getMediaUrl(picturePath),
      videoUrl: getMediaUrl(videoPath)
    };
  }, [picturePath, videoPath]);

  // FIXED: Only reset media error when URLs actually change
  useEffect(() => {
    setMediaError(false);
  }, [mediaUrls.imageUrl, mediaUrls.videoUrl]);

  // FIXED: Stabilize functions with useCallback to prevent parent re-renders
  const patchLike = useCallback(async () => {
    if (isLiking) return;
    
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
    } catch (error) {
      console.error("Like action failed:", error);
    } finally {
      setIsLiking(false);
    }
  }, [postId, token, loggedInUserId, isLiking, dispatch]);

  const handleComment = useCallback(async () => {
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
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setIsCommenting(false);
    }
  }, [postId, token, loggedInUserId, commentText, isCommenting, dispatch]);

  const handleDelete = useCallback(async () => {
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
    } catch (error) {
      console.error("Error deleting post:", error);
    } finally {
      setIsDeleting(false);
    }
  }, [postId, token, loggedInUserId, isDeleting, dispatch]);

  // FIXED: Prevent media error loops with better error handling
  const handleMediaError = useCallback((mediaType) => {
    console.error(`${mediaType} load error for post ${postId}`);
    setMediaError(true);
  }, [postId]);

  const handleMediaLoad = useCallback((mediaType) => {
    console.log(`${mediaType} loaded successfully for post ${postId}`);
  }, [postId]);

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

      {/* FIXED: Stabilize media rendering to prevent constant re-loading */}
      {(mediaUrls.imageUrl || mediaUrls.videoUrl) && !mediaError && (
        <Box
          sx={{
            width: "100%",
            paddingTop: "56.25%", // 16:9 aspect ratio instead of square
            position: "relative",
            backgroundColor: "black",
            borderRadius: "0.75rem",
            marginTop: "0.75rem",
          }}
        >
          {mediaUrls.videoUrl ? (
            <video
              key={mediaUrls.videoUrl} // Force re-mount only when URL changes
              width="100%"
              height="100%"
              controls
              src={mediaUrls.videoUrl}
              onError={() => handleMediaError('Video')}
              onLoadedData={() => handleMediaLoad('Video')}
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
          ) : mediaUrls.imageUrl ? (
            <img
              key={mediaUrls.imageUrl} // Force re-mount only when URL changes
              alt={description || 'Post image'}
              src={mediaUrls.imageUrl}
              onError={() => handleMediaError('Image')}
              onLoad={() => handleMediaLoad('Image')}
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

      {/* FIXED: Better error state display */}
      {mediaError && (mediaUrls.imageUrl || mediaUrls.videoUrl) && (
        <Box
          sx={{
            width: "100%",
            height: "200px",
            backgroundColor: palette.neutral.light,
            borderRadius: "0.75rem",
            marginTop: "0.75rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
          }}
        >
          <Typography color={palette.neutral.medium}>
            Failed to load media content
          </Typography>
          <Button
            size="small"
            onClick={() => setMediaError(false)}
            sx={{ color: primary }}
          >
            Retry
          </Button>
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

      {/* Comments section - unchanged */}
      {isComments && (
        <Box mt="0.5rem">
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
