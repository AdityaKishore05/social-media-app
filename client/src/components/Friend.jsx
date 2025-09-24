import { PersonAddOutlined, PersonRemoveOutlined } from "@mui/icons-material";
import { Box, IconButton, Typography, useTheme } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setFriends } from "state";
import FlexBetween from "./FlexBetween";
import UserImage from "./UserImage";
import { useState, useMemo } from "react"; // 1. Import useState

const Friend = ({ friendId, name, subtitle, userPicturePath }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { _id } = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);
  const friends = useSelector((state) => state.auth.user.friends);

  // 2. CRITICAL FIX: Declare the missing isLoading state
  const [isLoading, setIsLoading] = useState(false);

  const { palette } = useTheme();
  const primaryLight = palette.primary.light;
  const primaryDark = palette.primary.dark;
  const main = palette.neutral.main;
  const medium = palette.neutral.medium;

  // 3. PERFORMANCE IMPROVEMENT: Use a Set for instant O(1) lookups
  const friendIdSet = useMemo(() => new Set(friends.map((friend) => friend._id)), [friends]);
  const isFriend = friendIdSet.has(friendId);
  
  const patchFriend = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/users/${_id}/${friendId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      
      if (!response.ok) {
        // Revert UI on API error
        dispatch(setFriends({ friends }));
        return;
      }
      
      const data = await response.json();
      dispatch(setFriends({ friends: data }));

    } catch (error) {
      // Revert UI on network error
      dispatch(setFriends({ friends }));
      console.error('Friend update failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FlexBetween>
      <FlexBetween gap="1rem">
        <UserImage image={userPicturePath} size="55px" userName={name} />
        <Box onClick={() => navigate(`/profile/${friendId}`)} sx={{ cursor: "pointer" }}>
          <Typography
            color={main}
            variant="h5"
            fontWeight="500"
            sx={{ "&:hover": { color: palette.primary.light } }}
          >
            {name}
          </Typography>
          <Typography color={medium} fontSize="0.75rem">
            {subtitle}
          </Typography>
        </Box>
      </FlexBetween>

      {friendId !== _id && (
        <IconButton
          onClick={patchFriend}
          disabled={isLoading}
          sx={{ 
            backgroundColor: primaryLight, 
            p: "0.6rem",
            opacity: isLoading ? 0.6 : 1
          }}
        >
          {isFriend ? (
            <PersonRemoveOutlined sx={{ color: primaryDark }} />
          ) : (
            <PersonAddOutlined sx={{ color: primaryDark }} />
          )}
        </IconButton>
      )}
    </FlexBetween>
  );
};

export default Friend;