import { Box, Typography, useTheme } from "@mui/material";
import Friend from "components/Friend";
import WidgetWrapper from "components/WidgetWrapper";
import { useEffect, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setFriends } from "state";

const FriendListWidget = ({ userId }) => {
  const dispatch = useDispatch();
  const { palette } = useTheme();
  const token = useSelector((state) => state.token);
  const loggedInUserId = useSelector((state) => state.user._id);
  const reduxFriends = useSelector((state) => state.user.friends);
  const [otherUserFriends, setOtherUserFriends] = useState([]);

  const getFriends = useCallback(async () => {
    if (!userId || !token) return;
    
    try {
      const response = await fetch(
        `https://getsocialnow.onrender.com/users/${userId}/friends`,
        {
          method: "GET",
          headers: { 
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch friends: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update Redux if viewing own profile, otherwise update local state
      if (userId === loggedInUserId) {
        dispatch(setFriends({ friends: data }));
      } else {
        setOtherUserFriends(data);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  }, [userId, token, loggedInUserId, dispatch]);

  useEffect(() => {
    getFriends();
  }, [getFriends]);

  // Show friends from Redux for logged-in user, local state for others
  const displayFriends = userId === loggedInUserId ? reduxFriends : otherUserFriends;

  return (
    <Box>
      <Typography
        color={palette.neutral.dark}
        variant="h5"
        fontWeight="500"
        sx={{ mb: "1.5rem" }}
      >
        Friend List
      </Typography>
      <Box display="flex" flexDirection="column" gap="1.5rem">
        {displayFriends && displayFriends.length > 0 ? (
          displayFriends.map((friend) => (
            <Friend
              key={friend._id}
              friendId={friend._id}
              name={`${friend.firstName} ${friend.lastName}`}
              subtitle={friend.occupation}
              userPicturePath={friend.picturePath}
            />
          ))
        ) : (
          <Typography color={palette.neutral.medium}>
            No friends yet
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default FriendListWidget;