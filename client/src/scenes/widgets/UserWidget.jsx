import {
  ManageAccountsOutlined,
} from "@mui/icons-material";
import { Box, Typography, useTheme } from "@mui/material";
import UserImage from "components/UserImage";
import FlexBetween from "components/FlexBetween";
import EditProfileModal from "components/EditProfileModal";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { setUser } from "state"; // Import setUser action

const UserWidget = ({ userId, picturePath }) => {
  const dispatch = useDispatch();
  const posts = useSelector((state) => state.posts);
  const loggedInUser = useSelector((state) => state.user);
  const token = useSelector((state) => state.token);
  
  const [user, setUserState] = useState(null);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const { palette } = useTheme();
  const navigate = useNavigate();
  const dark = palette.neutral.dark;
  const medium = palette.neutral.medium;

  // Calculate stats
  const userPosts = Array.isArray(posts) ? posts.filter(post => post.userId === userId) : [];
  const totalLikes = userPosts.reduce((total, post) => {
    return total + (post.likes ? Object.keys(post.likes).length : 0);
  }, 0);
  const totalComments = userPosts.reduce((total, post) => {
    return total + (post.comments ? post.comments.length : 0);
  }, 0);

  const getUser = useCallback(async () => {
    if (!userId || !token) return;
    
    try {
      setError(null);
      const response = await fetch(
        `https://getsocialnow.onrender.com/users/${userId}`,
        {
          method: "GET",
          headers: { 
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch user: ${response.status}`);
      }

      const data = await response.json();
      console.log('User widget data loaded:', data.firstName, data.lastName);
      setUserState(data);
      
      // If this is the logged-in user, update Redux too
      if (userId === loggedInUser?._id) {
        dispatch(setUser({ user: data }));
      }
    } catch (err) {
      console.error('Error fetching user:', err);
      setError(err.message);
    }
  }, [userId, token, loggedInUser?._id, dispatch]);

  useEffect(() => {
    getUser();
  }, [getUser]);

  // Refresh user data when modal closes
  const handleModalClose = () => {
    setIsEditModalOpen(false);
    getUser(); // Refresh user data
  };

  if (error) {
    return (
        <Typography color="error">Error loading user: {error}</Typography>
    );
  }

  if (!user) {
    return (
        <Box display="flex" justifyContent="center">
         <Typography>Loading user...</Typography>
        </Box>
    );
  }

  const { firstName, lastName, friends, bio } = user;
  const displayFriends = userId === loggedInUser?._id 
    ? (loggedInUser.friends || friends || []) 
    : (friends || []);
  const isOwnProfile = loggedInUser?._id === userId;

  return (
    <Box m="1rem" >
      <FlexBetween gap="0.5rem" pb="1.1rem">
        <Box
          gap="1rem"
          display="flex"
          onClick={() => navigate(`/profile/${userId}`)}
          sx={{ cursor: 'pointer', flex: 1 }}
        >
          <UserImage 
            image={user.picturePath} 
            name={`${firstName} ${lastName}`} 
          />
          <Box>
            <Typography
              variant="h4"
              color={dark}
              fontWeight="500"
              sx={{
                wordBreak: "break-word",
                whiteSpace: "pre-wrap",
                "&:hover": {
                  color: palette.primary.light,
                  cursor: "pointer",
                },
              }}
            >

              {firstName} {lastName}
            </Typography>
            <Box display="flex" gap="0.5rem" mt="0.5rem">
              <Box textAlign="center">
                <Typography fontWeight="600" color={dark}>
                  {userPosts.length}
                </Typography>
                <Typography color={medium} fontSize="0.875rem">posts</Typography>
              </Box>
              <Box textAlign="center">
                <Typography fontWeight="600" color={dark}>
                  {Array.isArray(displayFriends) ? displayFriends.length : 0}
                </Typography>
                <Typography color={medium} fontSize="0.875rem">friends</Typography>
              </Box>
              <Box textAlign="center">
                <Typography fontWeight="600" color={dark}>
                  {totalLikes}
                </Typography>
                <Typography color={medium} fontSize="0.875rem">likes</Typography>
              </Box>
              <Box textAlign="center">
                <Typography fontWeight="600" color={dark}>
                  {totalComments}
                </Typography>
                <Typography color={medium} fontSize="0.875rem">comments</Typography>
              </Box>
            </Box>
          </Box>
        </Box>
        
        {isOwnProfile && (
          <ManageAccountsOutlined 
            onClick={() => setIsEditModalOpen(true)}
            sx={{ 
              cursor: 'pointer',
              '&:hover': {
                color: palette.primary.main
              }
            }}
          />
        )}
      </FlexBetween>

      {bio && (
        <Box mt="0.5rem">
         <Typography
          color={medium}
          sx={{ fontStyle: 'italic', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
        >

            {bio}
          </Typography>
        </Box>
      )}

      {isOwnProfile && (
        <EditProfileModal 
          open={isEditModalOpen}
          onClose={handleModalClose}
          user={user}
        />
      )}
    </Box>
  );
};

export default UserWidget;
