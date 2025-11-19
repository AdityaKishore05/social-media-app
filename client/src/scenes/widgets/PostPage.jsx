// src/scenes/postPage/PostPage.jsx
import { useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { API_ENDPOINTS } from "config";
import { setPost } from "state";
import PostWidget from "scenes/widgets/PostWidget";
import { Box, Typography } from "@mui/material";

const PostPage = () => {
  const { postId } = useParams();
  const dispatch = useDispatch();
  const token = useSelector((state) => state.token) || null;
  const post = useSelector((state) => state.posts.find(p => p._id === postId));

  useEffect(() => {
    const fetchSinglePost = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.POSTS.GET_SINGLE(postId), {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (!res.ok) throw new Error("Post not found");
        const data = await res.json();
        dispatch(setPost({ post: data })); // updates redux
      } catch (err) {
        console.error(err);
      }
    };

    if (!post) fetchSinglePost();
  }, [postId, post, dispatch, token]);

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
