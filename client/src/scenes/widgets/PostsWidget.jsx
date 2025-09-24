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
      const response = await fetch("http://localhost:3001/posts", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      dispatch(setPosts({ posts: data }));
    } catch (error) {
      console.error("Failed to fetch posts:", error);
      dispatch(setPosts({ posts: [] })); // Clear posts on error
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, token]);

  const getUserPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3001/posts/${userId}/posts`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      dispatch(setPosts({ posts: data }));
    } catch (error) {
      console.error("Failed to fetch user posts:", error);
      dispatch(setPosts({ posts: [] }));
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, token, userId]);

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