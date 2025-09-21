import { PersonAddOutlined, PersonRemoveOutlined } from "@mui/icons-material";
import { Box, IconButton, Typography, useTheme } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setFriends } from "state";
import FlexBetween from "./FlexBetween";
import UserImage from "./UserImage";
import { useState } from "react";

const Friend = ({ friendId, name, subtitle, userPicturePath }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { _id } = useSelector((state) => state.user);
  const token = useSelector((state) => state.token);
  const friends = useSelector((state) => state.user.friends);
  const [isLoading, setIsLoading] = useState(false);

  const { palette } = useTheme();
  const primaryLight = palette.primary.light;
  const primaryDark = palette.primary.dark;
  const main = palette.neutral.main;
  const medium = palette.neutral.medium;

  const isFriend = friends.find((friend) => friend._id === friendId);

  const patchFriend = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    // Debug logging
    console.log('=== DEBUG INFO ===');
    console.log('User ID (_id):', _id);
    console.log('Friend ID:', friendId);
    console.log('Token exists:', !!token);
    console.log('Is currently friend:', !!isFriend);
    console.log('API URL:', `http://localhost:3001/users/${_id}/${friendId}`);
    
    // Optimistic update - update UI immediately
    const optimisticFriends = isFriend 
      ? friends.filter(friend => friend._id !== friendId)
      : [...friends, { 
          _id: friendId, 
          firstName: name.split(' ')[0], 
          lastName: name.split(' ')[1] || '',
          picturePath: userPicturePath,
          occupation: subtitle // assuming subtitle is occupation
        }];
    
    // Update state immediately for instant UI feedback
    dispatch(setFriends({ friends: optimisticFriends }));
    
    try {
      const response = await fetch(
        `http://localhost:3001/users/${_id}/${friendId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response:', errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }
      
      // Get the actual updated friends list from server
      const actualUpdatedFriends = await response.json();
      console.log('Successfully updated friends:', actualUpdatedFriends.length);
      
      // Update with the real data from server
      dispatch(setFriends({ friends: actualUpdatedFriends }));
      
    } catch (error) {
      console.error('=== ERROR DETAILS ===');
      console.error('Error message:', error.message);
      console.error('Full error:', error);
      
      // Revert the optimistic update on error
      dispatch(setFriends({ friends: friends })); // Revert to original state
      
      // More helpful error message
      const errorMessage = error.message.includes('Failed to fetch') 
        ? 'Cannot connect to server. Is your backend running on port 3001?'
        : `Server error: ${error.message}`;
        
      console.log('Showing alert:', errorMessage);
      alert(errorMessage);
      
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileClick = () => {
    navigate(`/profile/${friendId}`);
  };

  return (
    <FlexBetween>
      <FlexBetween gap="1rem">
        <UserImage image={userPicturePath} size="55px" />
        <Box
          onClick={handleProfileClick}
          sx={{ cursor: "pointer" }}
        >
          <Typography
            color={main}
            variant="h5"
            fontWeight="500"
            sx={{
              "&:hover": {
                color: palette.primary.light,
                cursor: "pointer",
              },
            }}
          >
            {name}
          </Typography>
          <Typography color={medium} fontSize="0.75rem">
            {subtitle}
          </Typography>
        </Box>
      </FlexBetween>
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
    </FlexBetween>
  );
};

export default Friend;