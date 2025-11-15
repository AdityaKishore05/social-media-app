// components/NotificationItem.jsx
import { Box, Typography, Avatar, Button } from "@mui/material";

export default function NotificationItem({ note, onAccept, onDecline, onClick }) {
  const { type, fromUserName, fromUserPicture, createdAt } = note;

  return (
    <Box display="flex" alignItems="center" gap={1} sx={{ p: "0.5rem", borderRadius: 1 }}>
      <Avatar src={fromUserPicture} />
      <Box flex={1}>
        <Typography fontSize="0.9rem">
          <strong>{fromUserName}</strong>{" "}
          {type === "like" && "liked your post"}
          {type === "comment" && "commented on your post"}
          {type === "friend_request" && "sent you a friend request"}
          {type === "friend_accept" && "accepted your friend request"}
          {type === "new_post" && "posted a new update"}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {new Date(createdAt).toLocaleString()}
        </Typography>
      </Box>

      {type === "friend_request" && (
        <Box display="flex" gap={1}>
          <Button size="small" variant="contained" onClick={onAccept}>Accept</Button>
          <Button size="small" variant="outlined" color="error" onClick={onDecline}>Delete</Button>
        </Box>
      )}
    </Box>
  );
}
