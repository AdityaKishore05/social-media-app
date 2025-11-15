// src/scenes/widgets/PostWidget.jsx
import React, { useMemo, useState } from "react";
import {
  Box,
  Divider,
  IconButton,
  Typography,
  useTheme,
  InputBase,
  Button,
  useMediaQuery,
  Avatar,
} from "@mui/material";
import {
  ChatBubbleOutlineOutlined,
  FavoriteBorderOutlined,
  FavoriteOutlined,
  DeleteOutline,
  ChevronLeft,
  ChevronRight,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import FlexBetween from "components/FlexBetween";
import Friend from "components/Friend";
import { useDispatch, useSelector } from "react-redux";
import { setPost, setPosts } from "state";
import { useLocation } from "react-router-dom";

const PostWidget = ({
  postId,
  postUserId,
  name,
  description,
  userPicturePath,
  mediaItems,
  likes = {},
  comments = [],
  createdAt,
  picturePath,
  videoPath,
}) => {
  const isNonMobileScreens = useMediaQuery("(min-width:1025px)");
  const dispatch = useDispatch();
  const token = useSelector((s) => s.token);
  const loggedInUserId = useSelector((s) => s.user._id);
  const location = useLocation();
  const isProfilePage = location.pathname.includes("/profile");

  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mediaError, setMediaError] = useState({});

  const theme = useTheme();
  const main = theme.palette.neutral.main;
  const primary = theme.palette.primary.main;

  // Prevent crash when likes is Map-like or object
  const likeObj = likes instanceof Map ? Object.fromEntries(likes) : likes;
  const isLiked = Boolean(likeObj[loggedInUserId]);
  const likeCount = Object.keys(likeObj || {}).length;

  // Build media items (support legacy single picture/video)
  const items = useMemo(() => {
    if (mediaItems && mediaItems.length > 0) return mediaItems;
    const arr = [];
    if (picturePath) arr.push({ url: picturePath.startsWith("http") ? picturePath : `/assets/${picturePath}`, type: "image" });
    if (videoPath) arr.push({ url: videoPath.startsWith("http") ? videoPath : `/assets/${videoPath}`, type: "video" });
    return arr;
  }, [mediaItems, picturePath, videoPath]);

  const formatDate = (dateString) => {
    if (!dateString) return "Recently";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "Recently";
    const now = new Date();
    const diffMs = now - d;
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  };

  // ---------- network handlers ----------
  const patchLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      const res = await fetch(`https://getsocialnow.onrender.com/posts/${postId}/like`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ userId: loggedInUserId }),
      });
      if (!res.ok) throw new Error("Failed to like post");
      const updated = await res.json();
      dispatch(setPost({ post: updated }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || isCommenting) return;
    setIsCommenting(true);
    try {
      const res = await fetch(`https://getsocialnow.onrender.com/posts/${postId}/comment`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ userId: loggedInUserId, commentText: commentText.trim() }),
      });
      if (!res.ok) throw new Error("Failed to add comment");
      const updated = await res.json();
      dispatch(setPost({ post: updated }));
      setCommentText("");
      setIsCommentsOpen(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCommenting(false);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm("Delete this post?")) return;
    setIsDeletingPost(true);
    try {
      const url = `https://getsocialnow.onrender.com/posts/${postId}/delete${isProfilePage ? `?userId=${postUserId}` : ""}`;
      const res = await fetch(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ userId: loggedInUserId }),
      });
      if (!res.ok) throw new Error("Delete failed");
      const updated = await res.json();
      dispatch(setPosts({ posts: updated }));
    } catch (err) {
      console.error(err);
      alert("Could not delete post.");
    } finally {
      setIsDeletingPost(false);
    }
  };

  const toggleCommentLike = async (commentId) => {
    try {
      const res = await fetch(`https://getsocialnow.onrender.com/posts/${postId}/comment/${commentId}/like`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ userId: loggedInUserId }),
      });
      if (!res.ok) throw new Error("Failed to toggle comment like");
      const updated = await res.json();
      dispatch(setPost({ post: updated }));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteComment = async (commentId) => {
    if (!window.confirm("Delete comment?")) return;
    try {
      const res = await fetch(`https://getsocialnow.onrender.com/posts/${postId}/comment/${commentId}/delete`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ userId: loggedInUserId }),
      });
      if (!res.ok) throw new Error("Failed to delete comment");
      const updated = await res.json();
      dispatch(setPost({ post: updated }));
    } catch (err) {
      console.error(err);
    }
  };

  // ---------- UI ----------
  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
      <Box
        sx={{
          pt: 1.5
        }}
      >
        <Friend padding="12px" friendId={postUserId} name={name} subtitle={formatDate(createdAt)} userPicturePath={userPicturePath} />

        {/* Media */}
        {items.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Box
              sx={{
                position: "relative",
                width: "100%",
                overflow: "hidden",
                height: isNonMobileScreens ? 0 : 360,
                // Maintain aspect ratio by padding-top for desktop
                ...(isNonMobileScreens ? { paddingTop: "60%" } : {}),
                display: "flex",
                background: "black",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {mediaError[currentIndex] ? (
                <Typography color="text.secondary">Failed to load</Typography>
              ) : items[currentIndex].type === "video" ? (
                <video
                  controls
                  src={items[currentIndex].url}
                  onError={() => setMediaError((p) => ({ ...p, [currentIndex]: true }))}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    position: "absolute",
                    left: 0,
                    top: 0,
                  }}
                />
              ) : (
                <img
                  src={items[currentIndex].url}
                  alt="post media"
                  onError={() => setMediaError((p) => ({ ...p, [currentIndex]: true }))}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain", // <-- prevents cropping
                    display: "block",
                    position: "absolute",
                    left: 0,
                    top: 0,
                  }}
                />
              )}

              {items.length > 1 && (
                <>
                  <IconButton
                    onClick={() => setCurrentIndex((p) => (p - 1 + items.length) % items.length)}
                    sx={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.35)" }}
                    size="large"
                    aria-label="prev media"
                  >
                    <ChevronLeft sx={{ color: "white" }} />
                  </IconButton>
                  <IconButton
                    onClick={() => setCurrentIndex((p) => (p + 1) % items.length)}
                    sx={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.35)" }}
                    size="large"
                    aria-label="next media"
                  >
                    <ChevronRight sx={{ color: "white" }} />
                  </IconButton>
                </>
              )}
            </Box>
          </Box>
        )}

        {/* Description */}
        {description ? (
          <Typography sx={{ ml: 3, mt: 1, mr: 1, color: main, fontSize: "0.98rem", lineHeight: 1.45, whiteSpace: "pre-wrap", wordBreak: "break-word"}}>{description}</Typography>
        ) : null}

        {/* Actions */}
        <FlexBetween sx={{ mt: 1 }}>
          <FlexBetween gap={1}>
            <FlexBetween gap={0.5}>
              <IconButton onClick={patchLike} disabled={isLiking} aria-label="like post">
                {isLiked ? <FavoriteOutlined sx={{ color: primary }} /> : <FavoriteBorderOutlined />}
              </IconButton>
              <Typography sx={{ fontSize: "0.95rem" }}>{likeCount}</Typography>
            </FlexBetween>

            <FlexBetween gap={0.5}>
              <IconButton onClick={() => setIsCommentsOpen((p) => !p)} aria-label="comments">
                <ChatBubbleOutlineOutlined />
              </IconButton>
              <Typography sx={{ fontSize: "0.95rem" }}>{comments?.length || 0}</Typography>
            </FlexBetween>
          </FlexBetween>

          {loggedInUserId === postUserId && (
            <IconButton onClick={handleDeletePost} disabled={isDeletingPost} aria-label="delete post">
              <DeleteOutline sx={{ color: theme.palette.error.main }} />
            </IconButton>
          )}
        </FlexBetween>

        {/* Comments (animated open/close) */}
        <AnimatePresence initial={false}>
          {isCommentsOpen && (
            <motion.div
              key="comments"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.28 }}
              style={{ overflow: "hidden" }}
            >
              <Box sx={{ mt: 1, mx: 1,wordBreak: "break-word",
                whiteSpace: "pre-wrap"}}>
                {comments && comments.length > 0 ? (
                  comments.map((c) => {
                    const cid = c._id || c.id || "";
                    const cLikes = c.likes instanceof Map ? Object.fromEntries(c.likes) : c.likes || {};
                    const cLikeCount = Object.keys(cLikes).length;
                    const cIsLiked = Boolean(cLikes[loggedInUserId]);
                    const authorName = c.firstName && c.lastName ? `${c.firstName} ${c.lastName}` : c.name || "Unknown";
                    return (
                      <Box key={cid} sx={{ display: "flex",gap: 1, alignItems: "flex-start", mb: 1 }}>
                        <Avatar src={c.userPicturePath} sx={{ width: 35, height: 35 }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ fontWeight: 600, fontSize: "0.75rem", mb: -1 }}>{authorName}</Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary"}}>
                            {c.createdAt ? formatDate(c.createdAt) : "Just now"}
                          </Typography>
                          <Typography sx={{ color: main, fontSize: "0.95rem", mt: -0.5 }}>{c.commentText ?? c.text ?? ""}</Typography>
                          
                        </Box>
                        <Box sx={{ display: "flex", flexDirection: "cOLUMN"}}>
                    
                        <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 0.5}}>
                          <IconButton
                            size="small"
                            onClick={() => toggleCommentLike(cid)}
                            aria-label="like comment"
                            sx={{ p: 0.5 }}
                          >
                            {cIsLiked ? <FavoriteOutlined sx={{ color: primary, fontSize: 16}} /> : <FavoriteBorderOutlined sx={{ fontSize: 16 }} />}
                          </IconButton>
                          {cLikeCount > 0 && <Typography variant="caption">{cLikeCount}</Typography>}

                          {/* delete allowed for comment author or post owner */}
                          {(c.userId === loggedInUserId || loggedInUserId === postUserId) && (
                            <IconButton size="small" onClick={() => deleteComment(cid)} aria-label="delete comment" sx={{ p: 0.5 }}>
                              <DeleteOutline sx={{ fontSize: 16, color: "error.main" }} />
                            </IconButton>                 
                          )}
                          </Box>
                        
                        </Box>
                      </Box>
                    );
                  })
                ) : (
                  <Typography sx={{ color: "text.secondary", fontStyle: "italic" }}>No comments yet</Typography>
                )}

                {/* Add comment row */}
                <FlexBetween gap={1} sx={{ mt: 1 }}>
                  <InputBase
                    placeholder="Write a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    multiline
                    maxRows={4}
                    sx={{ background: theme.palette.background.paper, borderRadius: 999, p: "10px 20px", width: "100%" }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        handleComment();
                      }
                    }}
                  />
                  <Button disabled={!commentText.trim() || isCommenting} onClick={handleComment} variant="contained" sx={{ minWidth: 88, maxHeight: 40 }}>
                    {isCommenting ? "SENDING..." : "SEND"}
                  </Button>
                </FlexBetween>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
        <Divider sx={{ mt: 1 }} />
      </Box>
    </motion.div>
  );
};

export default PostWidget;
