// src/scenes/postPage/PostPage.jsx
import { useEffect, useState } from "react";
import { useParams} from "react-router-dom";
import { Box, CircularProgress, Typography } from "@mui/material";
import { API_ENDPOINTS } from "config";
import PostWidget from "scenes/widgets/PostWidget";

const PostPage = () => {
  const { postId } = useParams();
  const token = localStorage.getItem("token");    // 🔥 get token directly
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    const fetchPost = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(API_ENDPOINTS.POSTS.GET_SINGLE(postId), {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`Post not found (${res.status})`);
        }

        const data = await res.json();
        if (!ignore) {
          setPost(data);
        }
      } catch (err) {
        if (!ignore) setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchPost();
    return () => {
      ignore = true;
      controller.abort();
    };
  }, [postId, token]);

  // 🌀 LOADING
  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading post...</Typography>
      </Box>
    );
  }

  // ❌ ERROR
  if (error || !post) {
    return (
      <Box sx={{ textAlign: "center", mt: 4 }}>
        <Typography color="error">{error || "Post not found"}</Typography>
      </Box>
    );
  }
  
  // 👉 VALID POST
  return (
    <Box sx={{ maxWidth: 600, mx: "auto", mt: 4 }}>
      <PostWidget {...post} />
    </Box>
  );
};

export default PostPage;
