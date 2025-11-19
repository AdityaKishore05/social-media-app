// src/scenes/postPage/PostPage.jsx
import { useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { API_ENDPOINTS } from "config";
import { setPost } from "state";
import PostWidget from "scenes/widgets/PostWidget";
import { Box, Typography } from "@mui/material";

const PostPage = () => {
  const { postId } = useParams();
  const dispatch = useDispatch();
  const token = useSelector((state) => state.token);
  const post = useSelector((state) => state.posts.find(p => p._id === postId));
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSinglePost = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.POSTS.GET_SINGLE(postId), {
          headers: token ? { Authorization: `Bearer ${token}` } : {}, // 🔥 token only if exists
        });
        if (!res.ok) throw new Error("Post not found");
        const data = await res.json();
        dispatch(setPost({ post: data }));
      } catch (err) {
        console.error(err);
        setError(err.message);
      }
    };

    fetchSinglePost();
  }, [postId, token, dispatch]);

  if (error) {
    return <Typography sx={{ mt: 4, textAlign: "center", color: "red" }}>{error}</Typography>;
  }

  if (!post) {
    return <Typography sx={{ mt: 4, textAlign: "center" }}>Loading post...</Typography>;
  }

  return (
    <Box sx={{ maxWidth: "600px", mx: "auto", mt: 4 }}>
      <PostWidget {...post} />
    </Box>
  );
};

export default PostPage;
