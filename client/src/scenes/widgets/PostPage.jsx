import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, CircularProgress, Typography } from "@mui/material";
import { Helmet } from "react-helmet"; // make sure react-helmet is installed
import { API_ENDPOINTS } from "config";
import PostWidget from "./PostWidget";

const PostPage = () => {
  const { postId } = useParams();
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
          signal: controller.signal,
          // ❌ no Authorization header – public endpoint
        });

        if (!res.ok) {
          const text = await res.text();
          const msg =
            text && text.startsWith("{")
              ? JSON.parse(text).message || "Failed to load post"
              : text || `Failed to load post (${res.status})`;
          throw new Error(msg);
        }

        const data = await res.json();
        if (!ignore) {
          setPost(data);
        }
      } catch (err) {
        if (ignore || err.name === "AbortError") return;
        console.error("PostPage fetch error:", err);
        setError(err.message || "Failed to load post");
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    if (postId) {
      fetchPost();
    }

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [postId]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography>Loading post...</Typography>
      </Box>
    );
  }

  if (error || !post) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 1,
        }}
      >
        <Typography color="error" variant="h6">
          {error || "Post not found"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          The post might have been deleted or the link is invalid.
        </Typography>
      </Box>
    );
  }

  const title = `${post.firstName} ${post.lastName}'s post on GSN`;
  const desc = post.description || "Check out this post on GSN!";
  const image =
    post.mediaItems && post.mediaItems[0] && post.mediaItems[0].type === "image"
      ? post.mediaItems[0].url
      : undefined;

  return (
    <>
      {/* SEO / social preview */}
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={desc} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
        <meta
          property="og:url"
          content={`https://getsocialnow.netlify.app/post/${postId}`}
        />
        <meta property="og:type" content="article" />
        {image && <meta property="og:image" content={image} />}
      </Helmet>

      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          mt: 4,
          px: 2,
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 640 }}>
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
        </Box>
      </Box>
    </>
  );
};

export default PostPage;
