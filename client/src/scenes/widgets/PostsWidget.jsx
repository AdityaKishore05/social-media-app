import { useEffect, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setPosts } from "state";
import PostWidget from "./PostWidget";
import { Typography } from "@mui/material";

const PostsWidget = ({ userId, isProfile = false }) => {
  const dispatch = useDispatch();
  const posts = useSelector((state) => state.posts);
  const token = useSelector((state) => state.token);
  const [isLoading, setIsLoading] = useState(true); // Add loading state

const getPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/posts`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      dispatch(setPosts({ posts: data }));
    } catch (error) {
      console.error("Failed to refresh posts:", error);
      // FIX: DO NOT clear the posts here. Just log the error.
      // The user will continue to see the old posts instead of a blank screen.
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, token]);

  const getUserPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/posts/${userId}/posts`,
        { /* ... */ }
      );
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      dispatch(setPosts({ posts: data }));
    } catch (error) {
      console.error("Failed to refresh user posts:", error);
      // FIX: DO NOT clear the posts here either.
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, token,  userId]);
  useEffect(() => {
    if (isProfile) {
      getUserPosts();
    } else {
      getPosts();
    }
  }, [isProfile, userId, getPosts, getUserPosts]); // ✅ Correct dependencies

  if (isLoading) {
    return <Typography sx={{ mt: 2, textAlign: 'center' }}>Loading posts...</Typography>;
  }

  if (!posts || posts.length === 0) {
    return <Typography sx={{ mt: 2, textAlign: 'center' }}>No posts to display.</Typography>;
  }

  return (
    <>
      {posts.map(
        ({
          _id,
          userId,
          firstName,
          lastName,
          description,
          location,
          picturePath,
          videoPath, // 1. Destructure videoPath here
          userPicturePath,
          likes,
          comments,
        }) => (
          <PostWidget
            key={_id}
            postId={_id}
            postUserId={userId}
            name={`${firstName} ${lastName}`}
            description={description}
            location={location}
            picturePath={picturePath}
            videoPath={videoPath} // 2. Pass videoPath as a prop here
            userPicturePath={userPicturePath}
            likes={likes}
            comments={comments}
          />
        )
      )}
    </>
  );
};

export default PostsWidget;