import {
  ChatBubbleOutlineOutlined,
  FavoriteBorderOutlined,
  FavoriteOutlined,
  ShareOutlined,
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
}) => {
  const [isComments, setIsComments] = useState(false);
  const [imageError, setImageError] = useState(false);
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
    setImageError(false);
  }, [picturePath]);

  const patchLike = async () => {
    // ... (existing like function)
  };

  
  
  // You would create a similar function to handle adding a comment
  const handleComment = async () => {
      // API call to add the commentText to the post
      // On success, dispatch an update to the post
      console.log("Adding comment:", commentText);
      setCommentText(""); // Clear input after submit
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

      {picturePath && !imageError && (
        <Box
          sx={{
            width: "100%",
            paddingTop: "90%", // 1:1 Aspect Ratio
            position: "relative",
            backgroundColor: "black",
            borderRadius: "0.75rem",
            marginTop: "0.75rem",
          }}
        >
          <img
            alt={description}
            src={`http://localhost:3001/assets/${picturePath}`}
            onError={() => setImageError(true)}
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
        <IconButton>
          <ShareOutlined />
        </IconButton>
      </FlexBetween>

      {isComments && (
        <Box mt="0.5rem">
          {comments.map((comment, i) => (
            <Box key={`${name}-${i}`}>
              <Divider />
              <Typography sx={{ color: main, m: "0.5rem 0", pl: "1rem" }}>{comment}</Typography>
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
                disabled={!commentText}
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