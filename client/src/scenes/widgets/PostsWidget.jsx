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

  // Add cache-busting and better error handling
  const getPosts = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Add timestamp to prevent caching
      const timestamp = forceRefresh ? `?_t=${Date.now()}` : '';
      const response = await fetch(`https://getsocialnow.onrender.com/posts${timestamp}`, {
        method: "GET",
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Ensure data is an array
      const postsArray = Array.isArray(data) ? data : [];
      dispatch(setPosts({ posts: postsArray }));
      
      console.log('Posts fetched successfully:', postsArray.length);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, token]);

  const getUserPosts = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const timestamp = forceRefresh ? `?_t=${Date.now()}` : '';
      const response = await fetch(
        `https://getsocialnow.onrender.com/posts/${userId}/posts${timestamp}`,
        {
          method: "GET",
          headers: { 
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user posts: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Ensure data is an array
      const postsArray = Array.isArray(data) ? data : [];
      dispatch(setPosts({ posts: postsArray }));
      
      console.log('User posts fetched successfully:', postsArray.length);
    } catch (error) {
      console.error("Failed to fetch user posts:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, token, userId]);

  // Force refresh function
  const handleRefresh = () => {
    if (isProfile) {
      getUserPosts(true);
    } else {
      getPosts(true);
    }
  };

  useEffect(() => {
    if (isProfile && userId) {
      getUserPosts();
    } else if (!isProfile) {
      getPosts();
    }
  }, [isProfile, userId, getPosts, getUserPosts]);

  // Add effect to refresh when posts are updated (after creating/deleting)
  useEffect(() => {
    const handleStorageChange = () => {
      handleRefresh();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (isLoading) {
    return (
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography>Loading posts...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography color="error" sx={{ mb: 2 }}>
          Error: {error}
        </Typography>
        <Button onClick={handleRefresh} variant="contained">
          Retry
        </Button>
      </Box>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography sx={{ mb: 2 }}>No posts to display.</Typography>
        <Button onClick={handleRefresh} variant="outlined">
          Refresh
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Add refresh button for debugging */}
      <Box sx={{ mb: 2, textAlign: 'center' }}>
        <Button onClick={handleRefresh} variant="outlined" size="small">
          Refresh Posts ({posts.length})
        </Button>
      </Box>
      
      {posts.map((post) => {
        // Add validation to ensure post has required fields
        if (!post || !post._id) {
          console.warn('Invalid post data:', post);
          return null;
        }

        return (
          <PostWidget
            key={post._id}
            postId={post._id}
            postUserId={post.userId}
            name={`${post.firstName || 'Unknown'} ${post.lastName || 'User'}`}
            description={post.description || ''}
            location={post.location || ''}
            picturePath={post.picturePath}
            videoPath={post.videoPath}
            userPicturePath={post.userPicturePath}
            likes={post.likes || {}}
            comments={post.comments || []}
          />
        );
      })}
    </Box>
  );
};

export default PostsWidget;