import {
  ManageAccountsOutlined,
} from "@mui/icons-material";
import { Box, Typography, Divider, useTheme } from "@mui/material";
import UserImage from "components/UserImage";
import FlexBetween from "components/FlexBetween";
import WidgetWrapper from "components/WidgetWrapper";
import EditProfileModal from "components/EditProfileModal";
import { useSelector } from "react-redux";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const UserWidget = ({ userId, picturePath }) => {
  const posts = useSelector((state) => state.posts);
  const userPosts = Array.isArray(posts) ? posts.filter(post => post.userId === userId) : [];
  const totalLikes = userPosts.reduce((total, post) => {
  return total + (post.likes ? Object.keys(post.likes).length : 0);
  }, 0);
  const totalComments = userPosts.reduce((total, post) => {
  return total + (post.comments ? post.comments.length : 0);
}, 0);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { palette } = useTheme();
  const navigate = useNavigate();
  const token = useSelector((state) => state.token);
  const loggedInUser = useSelector((state) => state.user);
  const dark = palette.neutral.dark;
  const medium = palette.neutral.medium;
  
  
  const getUser = useCallback(async () => {
    if (!userId || !token) return;
    
    try {
      setError(null);
      const response = await fetch(`https://getsocialnow.onrender.com/users/${userId}`, {
        method: "GET",
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('User widget data loaded:', data.firstName, data.lastName);
      setUser(data);
    } catch (err) {
      console.error('Error fetching user:', err);
      setError(err.message);
    }
  }, [userId, token]);

  useEffect(() => {
    getUser();
  }, [getUser]);

  if (error) {
    return (
      <WidgetWrapper>
        <Typography color="error">
          Error loading user: {error}
        </Typography>
      </WidgetWrapper>
    );
  }

  if (!user) {
    return (
      <WidgetWrapper>
        <Typography>Loading user...</Typography>
      </WidgetWrapper>
    );
  }

  const {
  firstName,
  lastName,
  friends,
  bio,
} = user;

  const displayFriends = userId === loggedInUser?._id ? 
    (loggedInUser.friends || friends || []) : 
    (friends || []);

  const isOwnProfile = loggedInUser?._id === userId;

  return (
    <WidgetWrapper>
      {/* FIRST ROW */}
      <FlexBetween
        gap="0.5rem"
        pb="1.1rem"
      >
        <Box
          gap="1rem" display="flex"
          onClick={() => navigate(`/profile/${userId}`)}
          sx={{ cursor: 'pointer', flex: 1}}
        >
          <UserImage 
            image={picturePath || user.picturePath} 
            name={`${firstName} ${lastName}`} 
          />
          <Box>
            <Typography
              variant="h4"
              color={dark}
              fontWeight="500"
              sx={{
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
          <Typography color={medium} sx={{ fontStyle: 'italic'}}>
            {bio}
          </Typography>
        </Box>
      )}
      <Divider />

      {/* Edit Profile Modal */}
      {isOwnProfile && (
        <EditProfileModal 
          open={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          user={user}
        />
      )}
    </WidgetWrapper>
  );
};

export default UserWidget;