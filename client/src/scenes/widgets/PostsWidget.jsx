import { useEffect, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setPosts } from "state";
import PostWidget from "./PostWidget";
import { Typography } from "@mui/material";

const PostsWidget = ({ userId, isProfile = false }) => {
  const dispatch = useDispatch();
  // FIX #1: Select state from the 'auth' slice to match your store configuration
  const posts = useSelector((state) => state.posts);
  const token = useSelector((state) => state.token);
  const [isLoading, setIsLoading] = useState(true);

  const getPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/posts`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      // FIX #2: Add the same 304 check to this function
      if (response.status === 304) {
        setIsLoading(false);
        return;
      }
      
      if (!response.ok) throw new Error("Network response was not ok");

      const data = await response.json();
      dispatch(setPosts({ posts: data }));
    } catch (error) {
      console.error("Failed to fetch posts:", error);
      // Also remove the line that clears posts on error for better UX
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, token]);

  const getUserPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/posts/${userId}/posts`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      if (response.status === 304) {
        setIsLoading(false);
        return;
      }
      
      if (!response.ok) throw new Error("Network response was not ok");

      const data = await response.json();
      dispatch(setPosts({ posts: data }));
    } catch (error) {
      console.error("Failed to fetch user posts:", error);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, token, userId]);

  useEffect(() => {
    if (isProfile) {
      getUserPosts();
    } else {
      getPosts();
    }
  }, [isProfile, userId]);

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
          userId: postUserId,
          firstName,
          lastName,
          description,
          location,
          picturePath,
          videoPath,
          userPicturePath,
          likes,
          comments,
        }) => (
          <PostWidget
            key={_id}
            postId={_id}
            postUserId={postUserId}
            name={`${firstName} ${lastName}`}
            description={description}
            location={location}
            picturePath={picturePath}
            videoPath={videoPath}
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