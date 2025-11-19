// src/scenes/widgets/PostPage.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet";   // ⭐ IMPORT HELMET
import { API_ENDPOINTS } from "config";
import PostWidget from "./PostWidget";
import { useSelector } from "react-redux";

const PostPage = () => {
  const { postId } = useParams();
  const token = useSelector((state) => state.token);
  const [post, setPost] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.POSTS.GET_SINGLE(postId), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Post not found");
        const data = await res.json();
        setPost(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchPost();
  }, [postId, token]);

  if (!post) return <p>Loading...</p>;

  return (
    <>
      {/* ⭐ SEO / SHARE PREVIEW */}
      <Helmet>
        <title>{post.userName}'s Post</title>
        <meta name="description" content={post.description || "Social Media Post"} />

        {/* FACEBOOK / INSTAGRAM / LINKEDIN */}
        <meta property="og:title" content={`${post.userName}'s Post`} />
        <meta property="og:description" content={post.description} />
        <meta property="og:type" content="article" />
        <meta property="og:image" content={post.mediaItems?.[0]?.url} />
        <meta property="og:url" content={`https://getsocialnow.netlify.app/post/${postId}`} />

        {/* TWITTER */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${post.userName}'s Post`} />
        <meta name="twitter:description" content={post.description} />
        <meta name="twitter:image" content={post.mediaItems?.[0]?.url} />
      </Helmet>

      {/* Render post */}
      <PostWidget {...post} />
    </>
  );
};

export default PostPage;
