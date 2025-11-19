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
  Dialog,
} from "@mui/material";
import {
  ChatBubbleOutlineOutlined,
  FavoriteBorderOutlined,
  FavoriteOutlined,
  DeleteOutline,
  ChevronLeft,
  ChevronRight,
  Share,
  Close,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import FlexBetween from "components/FlexBetween";
import Friend from "components/Friend";
import { useDispatch, useSelector } from "react-redux";
import { setPost, setPosts } from "state";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { ConfirmDialog } from "components/ConfirmDialog";
import { useSwipe } from "hooks/useSwipe";
import { API_ENDPOINTS } from "config";

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteCommentDialog, setDeleteCommentDialog] = useState({ open: false, commentId: null });
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

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

  // Swipe handlers - must be after items is defined
  const swipeHandlers = useSwipe(
    () => setCurrentIndex((p) => (p + 1) % items.length),
    () => setCurrentIndex((p) => (p - 1 + items.length) % items.length)
  );

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

  const formatCommentDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return `${weeks}w`;
  };

  // ---------- network handlers ----------
  const patchLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      const res = await fetch(API_ENDPOINTS.POSTS.LIKE(postId), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ userId: loggedInUserId }),
      });
      if (!res.ok) throw new Error("Failed to like post");
      const updated = await res.json();
      dispatch(setPost({ post: updated }));
      toast.success(isLiked ? "Post unliked" : "Post liked");
    } catch (err) {
      console.error(err);
      toast.error("Failed to like post");
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || isCommenting) return;
    setIsCommenting(true);
    try {
      const res = await fetch(API_ENDPOINTS.POSTS.COMMENT(postId), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ userId: loggedInUserId, commentText: commentText.trim() }),
      });
      if (!res.ok) throw new Error("Failed to add comment");
      const updated = await res.json();
      dispatch(setPost({ post: updated }));
      setCommentText("");
      setIsCommentsOpen(true);
      toast.success("Comment added");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add comment");
    } finally {
      setIsCommenting(false);
    }
  };

  const handleDeletePost = async () => {
    setDeleteDialogOpen(false);
    setIsDeletingPost(true);
    try {
      const url = `${API_ENDPOINTS.POSTS.DELETE(postId)}${isProfilePage ? `?userId=${postUserId}` : ""}`;
      const res = await fetch(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ userId: loggedInUserId }),
      });
      if (!res.ok) throw new Error("Delete failed");
      const updated = await res.json();
      dispatch(setPosts({ posts: updated }));
      toast.success("Post deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("Could not delete post.");
    } finally {
      setIsDeletingPost(false);
    }
  };

  const toggleCommentLike = async (commentId) => {
    try {
      const res = await fetch(API_ENDPOINTS.POSTS.LIKE_COMMENT(postId, commentId), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ userId: loggedInUserId }),
      });
      if (!res.ok) throw new Error("Failed to toggle comment like");
      const updated = await res.json();
      dispatch(setPost({ post: updated }));
    } catch (err) {
      console.error(err);
      toast.error("Failed to like comment");
    }
  };

  const deleteComment = async (commentId) => {
    setDeleteCommentDialog({ open: false, commentId: null });
    try {
      const res = await fetch(API_ENDPOINTS.POSTS.DELETE_COMMENT(postId, commentId), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ userId: loggedInUserId }),
      });
      if (!res.ok) throw new Error("Failed to delete comment");
      const updated = await res.json();
      dispatch(setPost({ post: updated }));
      toast.success("Comment deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete comment");
    }
  };

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

const handleShare = async () => {
  const postUrl = `${window.location.origin}/post/${postId}`;
  if (navigator.share) {
    try {
      await navigator.share({
        title: `${name}'s post`,
        text: description || "Check out this post!",
        url: postUrl,
      });
      toast.success("Shared successfully!");
    } catch (err) {}
  } else {
    await navigator.clipboard.writeText(postUrl);
    toast.success("Link copied!");
  }
};


  const handleKeyDown = (e) => {
    if (e.key === "ArrowLeft") {
      setCurrentIndex((p) => (p - 1 + items.length) % items.length);
    } else if (e.key === "ArrowRight") {
      setCurrentIndex((p) => (p + 1) % items.length);
    }
  };

  // ---------- UI ----------
  return (
    <>
      <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
        <Box sx={{ pt: 1.5 }}>
          <Friend padding="12px" friendId={postUserId} name={name} subtitle={formatDate(createdAt)} userPicturePath={userPicturePath} />

          {/* Media */}
          {items.length > 0 && (
           <Box
  {...swipeHandlers}
  sx={{
    mt: 1,
  }}
>
  <Box
    tabIndex={0}
    onKeyDown={handleKeyDown}
    role="img"
    aria-label={`Post media ${currentIndex + 1} of ${items.length}`}
    sx={{
      position: "relative",
      width: "100%",
      height: isNonMobileScreens ? "520px" : "360px",   // 👈 FIXED HEIGHT
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "black",
      borderRadius: "12px",
    }}
  >
    {/* MEDIA */}
    {mediaError[currentIndex] ? (
      <Typography color="text.secondary">Failed to load</Typography>
    ) : items[currentIndex].type === "video" ? (
      <video
        controls
        src={items[currentIndex].url}
        onError={() =>
          setMediaError((p) => ({ ...p, [currentIndex]: true }))
        }
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />
    ) : (
      <img
        src={items[currentIndex].url}
        alt="post media"
        onClick={() => openLightbox(currentIndex)}
        onError={() =>
          setMediaError((p) => ({ ...p, [currentIndex]: true }))
        }
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          cursor: "pointer",
        }}
      />
    )}

    {/* DOTS */}
    {items.length > 1 && (
      <Box
        sx={{
          position: "absolute",
          bottom: 12,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 1,
        }}
      >
        {items.map((_, index) => (
          <Box
            key={index}
            onClick={() => setCurrentIndex(index)}
            sx={{
              width: index === currentIndex ? 10 : 8,
              height: index === currentIndex ? 10 : 8,
              borderRadius: "50%",
              backgroundColor:
                index === currentIndex ? "white" : "rgba(255,255,255,0.5)",
              transition: "all 0.25s ease",
              cursor: "pointer",
            }}
          />
        ))}
      </Box>
    )}

    {/* CHEVRONS */}
    {items.length > 1 && (
      <>
        <IconButton
          onClick={() =>
            setCurrentIndex(
              (old) => (old - 1 + items.length) % items.length
            )
          }
          sx={{
            position: "absolute",
            left: 10,
            top: "50%",
            transform: "translateY(-50%)",
            background: "rgba(0,0,0,0.5)",
            color: "white",
            "&:hover": { backgroundColor: "rgba(0,0,0,0.7)" },
          }}
        >
          <ChevronLeft />
        </IconButton>

        <IconButton
          onClick={() =>
            setCurrentIndex((old) => (old + 1) % items.length)
          }
          sx={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: "translateY(-50%)",
            background: "rgba(0,0,0,0.5)",
            color: "white",
            "&:hover": { backgroundColor: "rgba(0,0,0,0.7)" },
          }}
        >
          <ChevronRight />
        </IconButton>
      </>
    )}
  </Box>
</Box>


          )}

          {/* Description */}
          {description ? (
            <Typography sx={{ ml: 3, mt: 1, mr: 1, color: main, fontSize: "0.98rem", lineHeight: 1.45, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {description}
            </Typography>
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

              <IconButton onClick={handleShare} aria-label="share post">
                <Share />
              </IconButton>
            </FlexBetween>

            {loggedInUserId === postUserId && (
              <IconButton onClick={() => setDeleteDialogOpen(true)} disabled={isDeletingPost} aria-label="delete post">
                <DeleteOutline sx={{ color: theme.palette.error.main }} />
              </IconButton>
            )}
          </FlexBetween>

          {/* Comments */}
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
                <Box sx={{ mt: 1, mx: 1, wordBreak: "break-word", whiteSpace: "pre-wrap" }}>
                  {comments && comments.length > 0 ? (
                    comments.map((c) => {
                      const cid = c._id || c.id || "";
                      const cLikes = c.likes instanceof Map ? Object.fromEntries(c.likes) : c.likes || {};
                      const cLikeCount = Object.keys(cLikes).length;
                      const cIsLiked = Boolean(cLikes[loggedInUserId]);
                      const authorName = c.firstName && c.lastName ? `${c.firstName} ${c.lastName}` : c.name || "Unknown";
                      return (
                        <Box key={cid} sx={{ display: "flex", gap: 1, alignItems: "flex-start", mb: 1 }}>
                          <Avatar src={c.userPicturePath} sx={{ width: 35, height: 35 }} />
                          <Box sx={{ flex: 1 }}>
                            <Typography sx={{ fontWeight: 600, fontSize: "0.75rem" }}>{authorName}</Typography>
                            <Typography sx={{ color: main, fontSize: "0.95rem", mt: -0.5 }}>{c.commentText ?? c.text ?? ""}</Typography>
                          </Box>
                          <Box sx={{ display: "flex", flexDirection: "column" }}>
                            <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 0.5, p: 1 }}>
                              <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.75rem", ml: 1 }}>
                                {c.createdAt ? formatCommentDate(c.createdAt) : "Just now"}
                              </Typography>
                              <IconButton size="small" onClick={() => toggleCommentLike(cid)} aria-label="like comment" sx={{ p: 0 }}>
                                {cIsLiked ? <FavoriteOutlined sx={{ color: primary, fontSize: 16 }} /> : <FavoriteBorderOutlined sx={{ fontSize: 16 }} />}
                              </IconButton>
                              {cLikeCount > 0 && <Typography variant="caption">{cLikeCount}</Typography>}
                              {(c.userId === loggedInUserId || loggedInUserId === postUserId) && (
                                <IconButton
                                  size="small"
                                  onClick={() => setDeleteCommentDialog({ open: true, commentId: cid })}
                                  aria-label="delete comment"
                                >
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

      {/* Lightbox Dialog */}
      {isLightboxOpen && (
        <Dialog
          open={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          maxWidth={false}
          sx={{
            "& .MuiDialog-paper": {
              backgroundColor: "rgba(0,0,0,0.95)",
              width: "100vw",
              height: "100vh",
              maxWidth: "100vw",
              maxHeight: "100vh",
              m: 0,
            },
          }}
        >
          <IconButton
            onClick={() => setIsLightboxOpen(false)}
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              zIndex: 1,
              color: "white",
              backgroundColor: "rgba(0,0,0,0.5)",
              "&:hover": { backgroundColor: "rgba(0,0,0,0.7)" },
            }}
          >
            <Close />
          </IconButton>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100vh",
              position: "relative",
            }}
          >
            {items[lightboxIndex]?.type === "video" ? (
              <video
                onClick={() => setIsLightboxOpen(false)}
                src={items[lightboxIndex].url}
                controls
                autoPlay
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                  cursor: "pointer",
                }}
              />
            ) : (
                <img
                onClick={() => setIsLightboxOpen(false)}
                src={items[lightboxIndex]?.url}
                alt="Fullscreen"
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                  cursor: "pointer",
                }}
              />
            )}
            {items.length > 1 && (
              <>
                <IconButton
                  onClick={() => setLightboxIndex((p) => (p - 1 + items.length) % items.length)}
                  sx={{
                    position: "absolute",
                    left: 16,
                    color: "white",
                    backgroundColor: "rgba(0,0,0,0.5)",
                    "&:hover": { backgroundColor: "rgba(0,0,0,0.7)" },
                  }}
                >
                  <ChevronLeft />
                </IconButton>
                <IconButton
                  onClick={() => setLightboxIndex((p) => (p + 1) % items.length)}
                  sx={{
                    position: "absolute",
                    right: 16,
                    color: "white",
                    backgroundColor: "rgba(0,0,0,0.5)",
                    "&:hover": { backgroundColor: "rgba(0,0,0,0.7)" },
                  }}
                >
                  <ChevronRight />
                </IconButton>
                <Typography
                  sx={{
                    position: "absolute",
                    bottom: 16,
                    color: "white",
                    backgroundColor: "rgba(0,0,0,0.5)",
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                  }}
                >
                  {lightboxIndex + 1} / {items.length}
                </Typography>
              </>
            )}
          </Box>
        </Dialog>
      )}

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        onConfirm={handleDeletePost}
        onCancel={() => setDeleteDialogOpen(false)}
      />

      <ConfirmDialog
        open={deleteCommentDialog.open}
        title="Delete Comment"
        message="Are you sure you want to delete this comment?"
        onConfirm={() => deleteComment(deleteCommentDialog.commentId)}
        onCancel={() => setDeleteCommentDialog({ open: false, commentId: null })}
      />
    </>
  );
};

export default PostWidget;