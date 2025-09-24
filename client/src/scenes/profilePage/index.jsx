import { useEffect, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setPosts } from "state";
import PostWidget from "../widgets/PostWidget";
import { Typography, Box, Button } from "@mui/material";

const PostsWidget = ({ userId, isProfile = false }) => {
  const dispatch = useDispatch();
  const posts = useSelector((state) => state.posts);
  const token = useSelector((state) => state.token);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const getPosts = useCallback(async (forceRefresh = false) => {
    if (!token) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
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
      const postsArray = Array.isArray(data) ? data : [];
      
      dispatch(setPosts({ posts: postsArray }));
      console.log('All posts fetched successfully:', postsArray.length);
      
    } catch (error) {
      console.error("Failed to fetch posts:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, token]);

  // FIXED: Better user posts fetching with proper error handling
  const getUserPosts = useCallback(async (forceRefresh = false) => {
    if (!token || !userId) {
      console.error('Missing token or userId for profile posts:', { token: !!token, userId });
      setError('Missing authentication or user ID');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const timestamp = forceRefresh ? `?_t=${Date.now()}` : '';
      // FIXED: Check if your backend expects this exact endpoint format
      const url = `https://getsocialnow.onrender.com/posts/${userId}/posts${timestamp}`;
      console.log('Fetching user posts from:', url);
      
      const response = await fetch(url, {
        method: "GET",
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
      });
      
      console.log('User posts response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('User posts error response:', errorText);
        throw new Error(`Failed to fetch user posts: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Raw user posts data:', data);
      
      const postsArray = Array.isArray(data) ? data : [];
      
      dispatch(setPosts({ posts: postsArray }));
      console.log(`User posts fetched successfully for userId ${userId}:`, postsArray.length);
      
    } catch (error) {
      console.error("Failed to fetch user posts:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, token, userId]);

  const handleRefresh = useCallback(() => {
    console.log('Refreshing posts - isProfile:', isProfile, 'userId:', userId);
    if (isProfile && userId) {
      getUserPosts(true);
    } else if (!isProfile) {
      getPosts(true);
    }
  }, [isProfile, userId, getUserPosts, getPosts]);

  // FIXED: Better effect management
  useEffect(() => {
    console.log('PostsWidget useEffect triggered:', { isProfile, userId, token: !!token });
    
    if (isProfile && userId && token) {
      getUserPosts(false);
    } else if (!isProfile && token) {
      getPosts(false);
    } else {
      console.warn('PostsWidget: Missing required props', { isProfile, userId, token: !!token });
      setIsLoading(false);
    }
  }, [isProfile, userId, token, getUserPosts, getPosts]);

  if (isLoading) {
    return (
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography>
          {isProfile ? `Loading ${userId}'s posts...` : 'Loading posts...'}
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography color="error" sx={{ mb: 2 }}>
          Error: {error}
        </Typography>
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
          {isProfile ? `Failed to load posts for user: ${userId}` : 'Failed to load posts'}
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
        <Typography sx={{ mb: 2 }}>
          {isProfile ? "This user hasn't posted anything yet." : "No posts to display."}
        </Typography>
        <Button onClick={handleRefresh} variant="outlined">
          Refresh
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Debug info - remove in production */}
      <Box sx={{ mb: 1, textAlign: 'center', fontSize: '0.8rem', color: 'text.secondary' }}>
        {isProfile ? `Showing ${posts.length} posts for user ${userId}` : `Showing ${posts.length} posts`}
      </Box>
      
      {posts.map((post) => {
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
