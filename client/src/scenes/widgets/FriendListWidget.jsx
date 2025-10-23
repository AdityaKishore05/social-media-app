import {
  Box,
  Typography,
  IconButton,
  Collapse,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { ExpandMore, ExpandLess } from "@mui/icons-material";
import Friend from "components/Friend";
import WidgetWrapper from "components/WidgetWrapper";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setFriends } from "state";

const FriendListWidget = ({ userId }) => {
  const dispatch = useDispatch();
  const { palette } = useTheme();
  const token = useSelector((state) => state.token);
  const loggedInUser = useSelector((state) => state.user);
  const [friends, setFriendsState] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useMediaQuery("(max-width:600px)");
  const [open, setOpen] = useState(!isMobile); // ✅ open by default on desktop

  


  const getFriends = async () => {
    if (!userId || !token) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://getsocialnow.onrender.com/users/${userId}/friends`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch friends");

      const data = await response.json();

      const validFriends = Array.isArray(data)
        ? data.filter(
            (friend) =>
              friend && friend._id && friend.firstName && friend.lastName
          )
        : [];

      setFriendsState(validFriends);

      if (userId === loggedInUser?._id) {
        dispatch(setFriends({ friends: validFriends }));
      }

      console.log(`Loaded ${validFriends.length} friends`);
    } catch (error) {
      console.error("Error fetching friends:", error);
      setFriendsState([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getFriends();
  }, [userId, token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
  setOpen(!isMobile); // ✅ auto toggle when resizing
  }, [isMobile]);
   
  if (isLoading) {
    return (
      <WidgetWrapper>
        <Typography>Loading friends...</Typography>
      </WidgetWrapper>
    );
  }



  if (!friends || friends.length === 0) {
    return (
      <WidgetWrapper>
        <Typography
          color={palette.neutral.dark}
          variant="h5"
          fontWeight="500"
          sx={{ mb: "1.5rem" }}
        >
          Friend List
        </Typography>
        <Typography color={palette.neutral.medium}>No friends yet</Typography>
      </WidgetWrapper>
    );
  }

  return (
    <Box m="1rem 1rem 0rem 1rem">
      {/* Header Section */}
      <Box
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      sx={{
        cursor: isMobile ? "pointer" : "default",
        mb: open && !isMobile ? "1.5rem" : 0,
      }}
      onClick={isMobile ? () => setOpen((prev) => !prev) : undefined} // ✅ toggle whole box on mobile
    >
     <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
  <Typography color={palette.neutral.dark} variant="h4" fontWeight="500">
    Friend List
  </Typography>
  <Typography color={palette.neutral.medium} variant="body1" fontWeight="500">
    {friends.length}
  </Typography>
</Box>


      {/* Toggle Button (Visible on mobile) */}
      {isMobile && (
        <IconButton
          size="small"
          sx={{
            transition: "transform 0.3s ease",
            transform: open ? "rotate(180deg)" : "rotate(180deg)", // ✅ correct rotation
          }}
        >
          {open ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      )}
    </Box>

      {/* Collapsible Friend List */}
      <Collapse in={open || !isMobile} timeout="auto" unmountOnExit>
        <Box
          mt={isMobile ? "1rem" : 0}
          sx={{
            maxHeight: { xs: "70vh", md: "60vh" },
            overflowY: "auto",
            pr: "0.5rem",
            transition: "all 0.3s ease",
            "&::-webkit-scrollbar": {
              width: "8px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: palette.neutral.medium,
              borderRadius: "4px",
            },
          }}
        >
          <Box display="flex" flexDirection="column" gap="1.5rem">
            {friends.map((friend) => (
              <Friend
                key={friend._id}
                friendId={friend._id}
                name={`${friend.firstName} ${friend.lastName}`}
                subtitle={friend.bio || ""}
                userPicturePath={friend.picturePath}
                
              />
            ))}
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
};

export default FriendListWidget;
