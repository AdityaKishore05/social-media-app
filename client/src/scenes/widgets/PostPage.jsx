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
  const post = useSelector((state) => state.posts.find(p => p._id === postId));
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSinglePost = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.POSTS.GET_SINGLE(postId), {
          headers: { "Accept": "application/json" }, // important!
        });

        const text = await res.text(); // 🔥 FIRST read as text
        try {
          const data = JSON.parse(text); // Try parsing JSON
          dispatch(setPost({ post: data }));
        } catch {
          throw new Error("Server returned HTML instead of JSON\n" + text.slice(0, 100));
        }
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load post");
      }
    };

    fetchSinglePost();
  }, [postId, dispatch]);



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
