// src/scenes/widgets/PostPage.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet";   // 👈 ADD THIS
import { API_ENDPOINTS } from "config";
import PostWidget from "./PostWidget";

const PostPage = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.POSTS.GET_SINGLE(id));
        if (!res.ok) throw new Error("Failed to fetch post");
        const data = await res.json();
        setPost(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchPost();
  }, [id]);

  if (!post) return <div>Loading...</div>;

  return (
    <>
      {/* ⭐️ HELMET HERE ⭐️ */}
      <Helmet>
        <title>{post?.firstName} {post?.lastName}'s Post | GSN</title>
        <meta name="description" content={post?.description?.slice(0, 150)} />

        {/* OpenGraph (Facebook / LinkedIn) */}
        <meta property="og:title" content={`${post?.firstName} ${post?.lastName}'s Post`} />
        <meta property="og:description" content={post?.description?.slice(0, 150)} />
        <meta property="og:image" content={post?.mediaItems?.[0]?.url || "/default.jpg"} />
        <meta property="og:url" content={`https://getsocialnow.netlify.app/post/${id}`} />
        <meta property="og:type" content="website" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${post?.firstName} ${post?.lastName}'s Post`} />
        <meta name="twitter:description" content={post?.description?.slice(0, 150)} />
        <meta name="twitter:image" content={post?.mediaItems?.[0]?.url || "/default.jpg"} />
      </Helmet>

      {/* MAIN UI */}
      <PostWidget {...post} />
    </>
  );
};

export default PostPage;
