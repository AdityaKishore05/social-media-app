// src/scenes/widgets/PostsWidget.jsx
import React, { useEffect, useCallback, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setPosts } from "state";
import PostWidget from "./PostWidget";
import { Typography, Box, Button, CircularProgress } from "@mui/material";
import { API_ENDPOINTS } from "config";
import { PostSkeleton } from "components/PostSkeleton";

/**
 * Optimized PostsWidget
 *
 * Props:
 *  - userId (string) - optional for profile page
 *  - isProfile (boolean) - whether to show user posts
 *  - pageSize (number) - optional page size, default 10
 *  - enablePolling (boolean) - DEFAULT false (you said remove unnecessary polling)
 *
 * Notes:
 *  - This component is written to minimize re-renders and race conditions.
 *  - It uses AbortController to cancel inflight fetches.
 */

const PostsWidget = ({ userId, isProfile = false, pageSize = 10, enablePolling = false }) => {
  const dispatch = useDispatch();
  const posts = useSelector((state) => state.posts);
  const token = useSelector((state) => state.token);

  // UI state only
  const [isInitialLoading, setInitialLoading] = useState(true);
  const [isLoadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // Refs for stable logic & avoiding re-renders
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const isFetchingRef = useRef(false);
  const abortControllerRef = useRef(null);
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);
  const tokenRef = useRef(token);
  const postsRef = useRef(posts);

  // Keep refs in sync with redux/state (but not cause re-renders)
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);

  // Safe JSON parse (handles plain text errors)
  const parseResponseSafely = async (res) => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      // Not JSON - return text so callers can decide
      return text;
    }
  };

  // Abort any inflight fetch
  const abortInflight = () => {
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch (e) {
        // ignore
      }
      abortControllerRef.current = null;
    }
    isFetchingRef.current = false;
  };

  // Core fetch function — stable (doesn't change identity)
  const fetchPage = useCallback(
    async ({ page = 1, append = false } = {}) => {
      // require token
      if (!tokenRef.current) {
        // don't set error to noisy value; caller handles UI
        setError("Not authenticated");
        setInitialLoading(false);
        setLoadingMore(false);
        return;
      }

      if (isFetchingRef.current) return; // prevent concurrent
      isFetchingRef.current = true;
      setError(null);

      // Abort previous
      abortInflight();

      const controller = new AbortController();
      abortControllerRef.current = controller;

      if (page === 1) {
        setInitialLoading(true);
      } else {
        setLoadingMore(true);
      }

      const url = isProfile
        ? API_ENDPOINTS.POSTS.GET_USER_POSTS(userId, page, pageSize)
        : API_ENDPOINTS.POSTS.GET_FEED(page, pageSize);

      try {
        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${tokenRef.current}`,
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        });

        // If fetch was aborted, throw so catch block handles cleanup
        if (controller.signal.aborted) throw new Error("Aborted");

        // handle non-OK
        if (!res.ok) {
          const parsed = await parseResponseSafely(res);
          // parsed might be text or object
          const message = typeof parsed === "string" ? parsed : parsed?.error || parsed?.message || `HTTP ${res.status}`;
          throw new Error(message);
        }

        const parsed = await parseResponseSafely(res);

        // The endpoint returns { posts, currentPage, totalPages, totalPosts }
        const postsArray = Array.isArray(parsed) ? parsed : parsed?.posts || [];
        // If we got a plain text success message (rare), treat as empty
        if (!Array.isArray(postsArray)) {
          throw new Error("Invalid posts response");
        }

        // Update Redux with either replace or append
        if (append) {
          // avoid reconstructing arrays if identical
          const existing = postsRef.current || [];
          const merged = [...existing, ...postsArray];
          dispatch(setPosts({ posts: merged }));
        } else {
          dispatch(setPosts({ posts: postsArray }));
        }

        // Update refs
        pageRef.current = page;
        hasMoreRef.current = postsArray.length >= pageSize && (parsed?.totalPages ? page < parsed.totalPages : true);
      } catch (err) {
        if (err.name === "AbortError" || err.message === "Aborted") {
          // fetch was cancelled; do nothing visible
        } else {
          console.error("Posts fetch error:", err);
          setError(err.message || "Failed to load posts");
        }
      } finally {
        isFetchingRef.current = false;
        abortControllerRef.current = null;
        setInitialLoading(false);
        setLoadingMore(false);
      }
    },
    // intentionally has empty dependency array — uses refs for latest values
    []
  );

  // stable wrapper for loadMore that uses refs
  const loadMorePosts = useCallback(() => {
    if (isFetchingRef.current) return;
    if (!hasMoreRef.current) return;
    const nextPage = pageRef.current + 1;
    fetchPage({ page: nextPage, append: true });
  }, [fetchPage]);

  // expose through ref for IntersectionObserver callback without re-creating observer
  useEffect(() => {
    loadMoreRef.current = loadMorePosts;
  }, [loadMorePosts]);

  // Initial load
  useEffect(() => {
    // reset state when switching between profile & feed or userId changes
    pageRef.current = 1;
    hasMoreRef.current = true;
    abortInflight();
    dispatch(setPosts({ posts: [] }));
    fetchPage({ page: 1, append: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProfile, userId, dispatch, fetchPage]);

  // IntersectionObserver — stable single instance
  const lastPostRef = useCallback(
    (node) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (!node) return;
      const observer = new IntersectionObserver((entries) => {
        const e = entries[0];
        if (!e) return;
        if (e.isIntersecting) {
          // call stable ref function
          loadMoreRef.current?.();
        }
      }, { rootMargin: "150px" }); // prefetch a little early
      observer.observe(node);
      observerRef.current = observer;
    },
    [] // stable: doesn't depend on rendered state
  );

  // Optional lightweight polling — disabled by default
  useEffect(() => {
    if (!enablePolling) return;
    let intervalId = null;
    const pollInterval = 60000; // 60s
    const poll = async () => {
      // only poll if visible and not fetching
      if (document.visibilityState !== "visible" || isFetchingRef.current) return;
      // fetch latest page 1 and replace if new
      try {
        const url = isProfile
          ? API_ENDPOINTS.POSTS.GET_USER_POSTS(userId, 1, pageSize)
          : API_ENDPOINTS.POSTS.GET_FEED(1, pageSize);

        const controller = new AbortController();
        const res = await fetch(url, {
          signal: controller.signal,
          headers: { Authorization: `Bearer ${tokenRef.current}` },
        });

        if (!res.ok) return;
        const parsed = await parseResponseSafely(res);
        const postsArray = Array.isArray(parsed) ? parsed : parsed?.posts || [];
        if (!Array.isArray(postsArray) || postsArray.length === 0) return;

        const currentTop = postsRef.current?.[0]?._id;
        if (postsArray[0]._id !== currentTop) {
          dispatch(setPosts({ posts: postsArray }));
          pageRef.current = 1;
          hasMoreRef.current = postsArray.length >= pageSize;
        }
      } catch (err) {
        // ignore polling errors silently
      }
    };

    intervalId = setInterval(poll, pollInterval);
    // trigger first poll after mount
    poll();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [enablePolling, isProfile, userId, pageSize, dispatch]);

  // Refresh handler used by UI
  const handleRefresh = useCallback(() => {
    abortInflight();
    pageRef.current = 1;
    hasMoreRef.current = true;
    dispatch(setPosts({ posts: [] }));
    fetchPage({ page: 1, append: false });
    // smooth scroll is UI-level; keep it if you like
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [dispatch, fetchPage]);

  // UI render cases
  if (isInitialLoading) {
    return (
      <Box>
        <PostSkeleton />
        <PostSkeleton />
        <PostSkeleton />
      </Box>
    );
  }

  if (error) {
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
  }

  if (!posts || posts.length === 0) {
    return (
      <Box sx={{ mt: 2, textAlign: "center" }}>
        <Typography sx={{ mb: 2 }}>{isProfile ? "No posts yet." : "No posts to display."}</Typography>
        <Button onClick={handleRefresh} variant="outlined">
          Refresh
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {posts.map((post, index) => {
        const isLast = index === posts.length - 1;
        return (
          <div key={post._id} ref={isLast ? lastPostRef : null}>
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
        );
      })}
      {isLoadingMore && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
          <CircularProgress />
        </Box>
      )}
      {!hasMoreRef.current && posts.length > 0 && (
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
