// src/scenes/postPage/PostPage.jsx
import { useParams, useNavigate } from "react-router-dom"; // 👈 added useNavigate
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { API_ENDPOINTS } from "config";
import { setPost } from "state";
import PostWidget from "scenes/widgets/PostWidget";
import { Box, Typography } from "@mui/material";

const PostPage = () => {
  const { postId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();          // 👈 required for redirect
  const token = useSelector((state) => state.token);
  const post = useSelector((state) => state.posts.find(p => p._id === postId));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🚨 CHECK TOKEN FIRST!
  useEffect(() => {
    if (!token) {
      navigate("/login");       // 👈 Force redirect if not logged in
      return;
    }
  }, [token, navigate]);

  useEffect(() => {
    const fetchSinglePost = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.POSTS.GET_SINGLE(postId), {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error("Post not found");
        }

        const data = await res.json();
        dispatch(setPost({ post: data }));
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError(err.message);
        setLoading(false);
      }
    };

    if (token) {
      fetchSinglePost();  // only fetch if logged in
    }
  }, [postId, token, dispatch]);

  if (loading) {
    return <Typography sx={{ mt: 4, textAlign: "center" }}>Loading post...</Typography>;
  }

  if (error) {
    return <Typography sx={{ mt: 4, textAlign: "center", color: "red" }}>{error}</Typography>;
  }

  if (!post) {
    return <Typography sx={{ mt: 4, textAlign: "center" }}>Post not found</Typography>;
  }

  return (
    <Box sx={{ maxWidth: "600px", mx: "auto", mt: 4 }}>
      <PostWidget {...post} />
    </Box>
  );
};

export default PostPage;
