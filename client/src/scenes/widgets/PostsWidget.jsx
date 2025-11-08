import { useEffect, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setPosts } from "state";
import PostWidget from "./PostWidget";
import { Typography, Box, Button } from "@mui/material";

const PostsWidget = ({ userId, isProfile = false }) => {
  const dispatch = useDispatch();
  const posts = useSelector((state) => state.posts);
  const token = useSelector((state) => state.token);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPosts = useCallback(async (url, errorPrefix) => {
    if (!token) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });

      if (!response.ok) throw new Error(`${errorPrefix}: ${response.status}`);

      const data = await response.json();
      dispatch(setPosts({ posts: Array.isArray(data) ? data : [] }));
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, token]);

  const getFeedPosts = useCallback(() => {
    fetchPosts(`https://getsocialnow.onrender.com/posts?_t=${Date.now()}`, "Failed to fetch posts");
  }, [fetchPosts]);

  const getUserPosts = useCallback(() => {
    fetchPosts(`https://getsocialnow.onrender.com/posts/${userId}/posts?_t=${Date.now()}`, "Failed to fetch user posts");
  }, [fetchPosts, userId]);

  useEffect(() => {
    if (!token) return;
    isProfile ? getUserPosts() : getFeedPosts();
  }, [token, userId, isProfile, getFeedPosts, getUserPosts]);

  const handleRefresh = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    isProfile ? getUserPosts() : getFeedPosts();
  };

  if (isLoading)
    return <Typography align="center" sx={{ mt: 2 }}>Loading posts...</Typography>;

  if (error)
    return (
      <Box sx={{ mt: 2, textAlign: "center" }}>
        <Typography color="error" sx={{ mb: 2 }}>Error: {error}</Typography>
        <Button onClick={handleRefresh} variant="contained">Retry</Button>
      </Box>
    );

  if (!posts?.length)
    return (
      <Box sx={{ mt: 2, textAlign: "center" }}>
        <Typography sx={{ mb: 2 }}>
          {isProfile ? "No posts yet." : "No posts to display."}
        </Typography>
        <Button onClick={handleRefresh} variant="outlined">Refresh</Button>
      </Box>
    );

  return (
    <Box>
      {posts.map((post) => (
        <PostWidget
          key={post._id}
          postId={post._id}
          postUserId={post.userId}
          name={`${post.firstName} ${post.lastName}`}
          description={post.description}
          userPicturePath={post.userPicturePath}
          likes={post.likes || {}}
          comments={post.comments || []}
          mediaItems={post.mediaItems || []}
          picturePath={post.picturePath}
          videoPath={post.videoPath}
          createdAt={post.createdAt}
        />
      ))}
    </Box>
  );
};

export default PostsWidget;
