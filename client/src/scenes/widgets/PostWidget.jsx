import {
  ChatBubbleOutlineOutlined,
  FavoriteBorderOutlined,
  FavoriteOutlined,
  DeleteOutline, // NEW: Import delete icon
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
  videoPath, // 1. Accept videoPath as a prop

}) => {
  const [mediaError, setMediaError] = useState(false); // Use a generic name for image/video errors
  const [isComments, setIsComments] = useState(false);
  const [commentText, setCommentText] = useState("");
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

const patchLike = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/posts/${postId}/like`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: loggedInUserId }),
      });
      if (!response.ok) {
        throw new Error("Failed to update like status.");
      }
      const updatedPost = await response.json();
      dispatch(setPost({ post: updatedPost }));
    } catch (error) {
      console.error("Like action failed:", error);
    }
};

const handleComment = async () => {
    if (!commentText.trim()) return; // Don't send empty comments
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/posts/${postId}/comment`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: loggedInUserId,
          commentText: commentText,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to add comment.");
      }   
      // The backend returns the single post with the updated comments list
      const updatedPost = await response.json();
      // Dispatch the action to update this specific post in the Redux store
      dispatch(setPost({ post: updatedPost }));
      // Clear the input field
      setCommentText("");
    } catch (error) {
      console.error("Error adding comment:", error);
  }
};
  // NEW: Function to handle deleting a post
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/posts/${postId}/delete`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: loggedInUserId }),
      });
      if (!response.ok) throw new Error("Failed to delete post.");
      
      const updatedPosts = await response.json();
      dispatch(setPosts({ posts: updatedPosts })); // Update the entire feed
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

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

      {(picturePath || videoPath) && !mediaError && (
        <Box
          sx={{
            width: "100%",
            paddingTop: "100%", // Maintain 1:1 aspect ratio
            position: "relative",
            backgroundColor: "black",
            borderRadius: "0.75rem",
            marginTop: "0.75rem",
          }}
        >
          {videoPath ? (
            // If videoPath exists, render the video player
            <video
              width="100%"
              height="100%"
              controls
              src={`${process.env.REACT_APP_API_URL}/assets/${videoPath}`}
              onError={() => setMediaError(true)}
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
          ) : (
            // Otherwise, render the image
            <img
              alt={description}
              src={`${process.env.REACT_APP_API_URL}/assets/${picturePath}`}
              onError={() => setMediaError(true)}
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
          )}
        </Box>
      )}

      <FlexBetween mt="0.25rem">
        <FlexBetween gap="1rem">
          <FlexBetween gap="0.3rem">
            <IconButton onClick={patchLike}>
              {isLiked ? <FavoriteOutlined sx={{ color: primary }} /> : <FavoriteBorderOutlined />}
            </IconButton>
            <Typography>{likeCount}</Typography>
          </FlexBetween>
          <FlexBetween gap="0.3rem">
            <IconButton onClick={() => setIsComments(!isComments)}>
              <ChatBubbleOutlineOutlined />
            </IconButton>
            <Typography>{comments.length}</Typography>
          </FlexBetween>
        </FlexBetween>
        {/* NEW: Conditionally render the delete button */}
        {loggedInUserId === postUserId && (
          <IconButton onClick={handleDelete} sx={{ color: palette.neutral.medium }}>
            <DeleteOutline />
          </IconButton>
        )}
      </FlexBetween>

      {isComments && (
        <Box mt="0.5rem">
          {/* CRITICAL FIX: Map over comment objects correctly */}
          {comments.map((comment) => (
            <Box key={comment._id}> {/* FIX: Use unique comment ID for the key */}
              <Divider />
              <Typography sx={{ color: main, m: "0.5rem 0", pl: "1rem" }}>
                <span style={{ fontWeight: 500 }}>
                  {`${comment.firstName} ${comment.lastName}`}
                </span>
                {` — ${comment.commentText}`} {/* FIX: Display the comment text property */}
              </Typography>
            </Box>
          ))}
          <Divider />
          <FlexBetween gap="1.5rem" mt="0.5rem">
            <InputBase
              placeholder="Write a comment..."
              onChange={(e) => setCommentText(e.target.value)}
              value={commentText}
              sx={{ width: "100%", backgroundColor: palette.neutral.light, borderRadius: "2rem", padding: "0.5rem 1.5rem" }}
            />
            <Button
              disabled={!commentText.trim()}
              onClick={handleComment}
              sx={{ color: palette.background.alt, backgroundColor: primary, borderRadius: "3rem" }}
            >
              SEND
            </Button>
          </FlexBetween>
        </Box>
      )}
    </WidgetWrapper>
  );
};

export default PostWidget;