// Navbar.jsx
import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import {
  Box,
  IconButton,
  InputBase,
  Typography,
  Select,
  MenuItem,
  FormControl,
  Badge,
  useTheme,
  useMediaQuery,
  Avatar,
  Button,
} from "@mui/material";
import {
  DarkMode,
  LightMode,
  Menu,
  Close,
  NotificationsNoneOutlined,
  NotificationsActive,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { setMode, setLogout } from "state";
import { useNavigate } from "react-router-dom";
import FlexBetween from "components/FlexBetween";
import { motion, AnimatePresence } from "framer-motion";

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:6001";

const relativeTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleString();
};

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.user);
  const token = useSelector((s) => s.token);
  const theme = useTheme();
  const isNonMobileScreens = useMediaQuery("(min-width:1000px)");
  const [isMobileMenuToggled, setIsMobileMenuToggled] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const socketRef = useRef(null);

  const fullName = user ? `${user.firstName} ${user.lastName}` : "";

  // Fetch notifications initially
  const fetchNotifications = async () => {
    if (!user?._id || !token) return;
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL || "https://getsocialnow.onrender.com"}/notifications/${user._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data || []);
      setUnreadCount((data || []).filter((n) => !n.isRead).length);
    } catch (err) {
      console.error("fetchNotifications error", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, token]);

  // Socket setup for realtime notifications
  useEffect(() => {
    if (!user?._id) return;

    socketRef.current = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { token }, // optional
    });

    socketRef.current.on("connect", () => {
      // register this user on the server
      socketRef.current.emit("register", user._id);
    });

    socketRef.current.on("notification", (note) => {
      // note should be a notification object (preferably enriched with fromUserName/fromUserPicture)
      setNotifications((prev) => [note, ...prev]);
      setUnreadCount((c) => c + 1);
    });

    socketRef.current.on("disconnect", () => {
      // noop
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [user?._id, token]);

  // mark all read (frontend + backend)
  const markAllRead = async () => {
    if (!user?._id) return;
    try {
      await fetch(
        `${process.env.REACT_APP_API_URL || "https://getsocialnow.onrender.com"}/notifications/mark-read/${user._id}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("markAllRead error", err);
    }
  };

  // Accept friend request handler
  const acceptFriend = async (note) => {
    try {
      // Call your accept friend backend route (should handle adding friends)
      await fetch(
        `${process.env.REACT_APP_API_URL || "https://getsocialnow.onrender.com"}/notifications/friend/accept/${user._id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ requesterId: note.fromUserId }),
        }
      );
      // remove that notification locally
      setNotifications((prev) => prev.filter((n) => n._id !== note._id));
      setUnreadCount((c) => Math.max(0, c - (note.isRead ? 0 : 1)));
    } catch (err) {
      console.error("acceptFriend error", err);
    }
  };

  // Decline friend request handler
  const declineFriend = async (note) => {
    try {
      await fetch(
        `${process.env.REACT_APP_API_URL || "https://getsocialnow.onrender.com"}/notifications/friend/decline/${user._id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ requesterId: note.fromUserId }),
        }
      );
      setNotifications((prev) => prev.filter((n) => n._id !== note._id));
      setUnreadCount((c) => Math.max(0, c - (note.isRead ? 0 : 1)));
    } catch (err) {
      console.error("declineFriend error", err);
    }
  };

  // Click notification -> open post or profile
  const openNotification = (note) => {
    // mark this item read locally
    setNotifications((prev) =>
      prev.map((n) => (n._id === note._id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - (note.isRead ? 0 : 1)));

    if (note.postId) {
      navigate(`/post/${note.postId}`);
    } else if (note.fromUserId) {
      navigate(`/profile/${note.fromUserId}`);
    }
    // optionally mark single notification read on backend (not implemented here)
  };

  // UI small presentational Notification item
  const NotificationItem = ({ note }) => {
    const fromName = note.fromUserName || `${note.fromUser?.firstName || ""} ${note.fromUser?.lastName || ""}` || "Someone";
    const avatar = note.fromUserPicture || note.fromUser?.picturePath || "";
    const thumbnail = note.postThumbnail || note.post?.thumbnail || ""; // fallback keys
    return (
      <Box
        onClick={() => openNotification(note)}
        sx={{
          display: "flex",
          gap: "0.75rem",
          alignItems: "center",
          p: "0.5rem",
          borderRadius: "10px",
          cursor: "pointer",
          background: note.isRead ? "transparent" : (theme.palette.mode === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.03)"),
        }}
      >
        <Avatar src={avatar} sx={{ width: 40, height: 40 }} />
        <Box flex="1">
          <Typography fontSize="0.95rem">
            <strong>{fromName}</strong>{" "}
            {note.type === "like" && "liked your post"}
            {note.type === "comment" && "commented on your post"}
            {note.type === "like_comment" && "liked your comment"}
            {note.type === "friend_request" && "sent you a friend request"}
            {note.type === "friend_accept" && "accepted your friend request"}
            {note.type === "new_post" && "posted a new update"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {relativeTime(note.createdAt)}
          </Typography>
        </Box>

        {thumbnail ? (
          <Box component="img" src={thumbnail} sx={{ width: 48, height: 48, borderRadius: 1, objectFit: "cover" }} />
        ) : note.type === "friend_request" ? (
          <Box display="flex" gap="0.5rem">
            <Button size="small" variant="contained" onClick={(e) => { e.stopPropagation(); acceptFriend(note); }}>
              Accept
            </Button>
            <Button size="small" variant="outlined" color="error" onClick={(e) => { e.stopPropagation(); declineFriend(note); }}>
              Delete
            </Button>
          </Box>
        ) : null}
      </Box>
    );
  };

  return (
    <FlexBetween
      width="100%"
      boxShadow="0px 2px 5px rgba(0,0,0,0.15)"
      borderBottom="1px solid rgba(255,255,255,0.1)"
      p="1rem 6%"
      sx={{ position: "sticky", top: 0, backdropFilter: "blur(12px)", zIndex: 50 }}
    >
      {/* Left: Logo */}
      <FlexBetween gap="1.75rem">
        <Typography
          fontWeight="bold"
          fontSize="clamp(1rem, 2rem, 2.25rem)"
          color="primary"
          onClick={() => navigate("/home")}
          sx={{ cursor: "pointer" }}
        >
          GSN
        </Typography>
      </FlexBetween>

      {/* Right: actions */}
      {isNonMobileScreens ? (
        <FlexBetween gap="1rem">
          {/* Notifications */}
          <Box position="relative">
            <IconButton onClick={() => { setIsNotificationsOpen((s) => !s); if (!isNotificationsOpen) markAllRead(); }}>
              <Badge badgeContent={unreadCount} color="error">
                {unreadCount > 0 ? <NotificationsActive color="primary" /> : <NotificationsNoneOutlined sx={{ color: theme.palette.neutral.main }} />}
              </Badge>
            </IconButton>

            <AnimatePresence>
              {isNotificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  style={{
                    position: "absolute",
                    top: "48px",
                    right: 0,
                    width: 360,
                    maxHeight: 420,
                    overflowY: "auto",
                    borderRadius: 12,
                    background: theme.palette.mode === "dark" ? "rgba(17,24,39,0.9)" : "rgba(255,255,255,0.98)",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                    padding: 12,
                    zIndex: 2000,
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography fontWeight={700}>Notifications</Typography>
                    <Button size="small" onClick={markAllRead}>Mark all read</Button>
                  </Box>

                  {notifications.length === 0 ? (
                    <Typography sx={{ textAlign: "center", opacity: 0.7 }}>No notifications yet</Typography>
                  ) : (
                    <Box display="flex" flexDirection="column" gap={0.5}>
                      {notifications.map((n) => (
                        <NotificationItem key={n._id} note={n} />
                      ))}
                    </Box>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </Box>

          {/* Theme toggle */}
          <IconButton onClick={() => dispatch(setMode())}>
            {theme.palette.mode === "dark" ? <DarkMode sx={{ fontSize: 25 }} /> : <LightMode sx={{ color: theme.palette.neutral.dark, fontSize: 25 }} />}
          </IconButton>

          {/* User menu */}
          <FormControl variant="standard" value={fullName}>
            <Select
              value={fullName}
              sx={{ backgroundColor: theme.palette.neutral.light, borderRadius: "0.25rem", p: "0.25rem 1rem" }}
              input={<InputBase />}
            >
              <MenuItem value={fullName}><Typography>{fullName}</Typography></MenuItem>
              <MenuItem onClick={() => dispatch(setLogout())}>Logout</MenuItem>
            </Select>
          </FormControl>
        </FlexBetween>
      ) : (
        <IconButton onClick={() => setIsMobileMenuToggled((s) => !s)}>
          <Menu />
        </IconButton>
      )}

      {/* Mobile menu panel */}
      {!isNonMobileScreens && isMobileMenuToggled && (
        <Box position="fixed" right={0} bottom={0} height="100%" width="70%" zIndex={1200} p={2} sx={{ backgroundColor: theme.palette.background.default }}>
          <Box display="flex" justifyContent="flex-end"><IconButton onClick={() => setIsMobileMenuToggled(false)}><Close /></IconButton></Box>
          <Box mt={2} display="flex" flexDirection="column" gap={2} alignItems="center">
            <IconButton onClick={() => dispatch(setMode())}>{theme.palette.mode === "dark" ? <DarkMode /> : <LightMode />}</IconButton>
            <FormControl variant="standard"><Select value={fullName} input={<InputBase />}>
              <MenuItem value={fullName}>{fullName}</MenuItem>
              <MenuItem onClick={() => dispatch(setLogout())}>Logout</MenuItem>
            </Select></FormControl>
          </Box>
        </Box>
      )}
    </FlexBetween>
  );
}
