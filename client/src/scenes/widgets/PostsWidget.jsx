import { useEffect, useCallback, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setPosts } from "state";
import PostWidget from "./PostWidget";
import { Typography, Box, Button, CircularProgress } from "@mui/material";
import { API_ENDPOINTS } from "config";
import { PostSkeleton } from "components/PostSkeleton";
import { usePolling } from "hooks/usePolling";


const PostsWidget = ({ userId, isProfile = false }) => {
  const dispatch = useDispatch();
  const posts = useSelector((state) => state.posts);
  const token = useSelector((state) => state.token);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef();

  const lastPostRef = useCallback(
    (node) => {
      if (isLoading || isLoadingMore) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMorePosts();
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [isLoading, isLoadingMore, hasMore]
  );

  const fetchPosts = useCallback(
    async (url, errorPrefix, isInitial = false) => {
      if (!token) return;
      if (isInitial) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);

      try {
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        });

        if (!response.ok)
          throw new Error(`${errorPrefix}: ${response.status}`);

        const data = await response.json();
        const postsArray = Array.isArray(data) ? data : data.posts || [];

        if (isInitial) {
          dispatch(setPosts({ posts: postsArray }));
          setPage(1);
          setHasMore(postsArray.length >= 10);
        } else {
          if (postsArray.length === 0) {
            setHasMore(false);
          } else {
            dispatch(setPosts({ posts: [...posts, ...postsArray] }));
            setPage((p) => p + 1);
            setHasMore(postsArray.length >= 10);
          }
        }
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [dispatch, token, posts]
  );

  const getFeedPosts = useCallback(() => {
    fetchPosts(
      API_ENDPOINTS.POSTS.GET_FEED(1, 10),
      "Failed to fetch posts",
      true
    );
  }, [fetchPosts]);

  const getUserPosts = useCallback(() => {
    fetchPosts(
      API_ENDPOINTS.POSTS.GET_USER_POSTS(userId, 1, 10),
      "Failed to fetch user posts",
      true
    );
  }, [fetchPosts, userId]);

  const loadMorePosts = useCallback(() => {
    if (isProfile) {
      fetchPosts(
        API_ENDPOINTS.POSTS.GET_USER_POSTS(userId, page + 1, 10),
        "Failed to fetch more posts"
      );
    } else {
      fetchPosts(
        API_ENDPOINTS.POSTS.GET_FEED(page + 1, 10),
        "Failed to fetch more posts"
      );
    }
  }, [isProfile, userId, page, fetchPosts]);

  useEffect(() => {
    if (!token) return;
    isProfile ? getUserPosts() : getFeedPosts();
  }, [token, userId, isProfile, getFeedPosts, getUserPosts]);

  const handleRefresh = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setPage(1);
    setHasMore(true);
    isProfile ? getUserPosts() : getFeedPosts();
  };
  usePolling(() => {
    if (!isLoading && !isLoadingMore && document.visibilityState === "visible") {
      const url = isProfile
        ? API_ENDPOINTS.POSTS.GET_USER_POSTS(userId, 1, 10)
        : API_ENDPOINTS.POSTS.GET_FEED(1, 10);
      
      fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          const postsArray = Array.isArray(data) ? data : data.posts || [];
          if (postsArray.length > 0 && postsArray[0]._id !== posts[0]?._id) {
            dispatch(setPosts({ posts: postsArray }));
          }
        })
        .catch((err) => console.error("Polling error:", err));
    }
  }, 30000);
  

  if (isLoading)
    return (
      <Box>
        <PostSkeleton />
        <PostSkeleton />
        <PostSkeleton />
      </Box>
    );

  if (error)
    return (
      <Box sx={{ mt: 2, textAlign: "center" }}>
        <Typography color="error" sx={{ mb: 2 }}>
          Error: {error}
        </Typography>
        <Button onClick={handleRefresh} variant="contained">
          Retry
        </Button>
      </Box>
    );

  if (!posts?.length)
    return (
      <Box sx={{ mt: 2, textAlign: "center" }}>
        <Typography sx={{ mb: 2 }}>
          {isProfile ? "No posts yet." : "No posts to display."}
        </Typography>
        <Button onClick={handleRefresh} variant="outlined">
          Refresh
        </Button>
      </Box>
    );

  return (
    <Box>
      {posts.map((post, index) => (
        <div
          key={post._id}
          ref={index === posts.length - 1 ? lastPostRef : null}
        >
          <PostWidget
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
        </div>
      ))}
      {isLoadingMore && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
          <CircularProgress />
        </Box>
      )}
      {!hasMore && posts.length > 0 && (
        <Box sx={{ textAlign: "center", my: 2 }}>
          <Typography variant="body2" color="text.secondary">
            No more posts to load
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default PostsWidget;