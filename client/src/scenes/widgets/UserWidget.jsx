import {
  ManageAccountsOutlined,
  EditOutlined,
  LocationOnOutlined,
  WorkOutlineOutlined,
} from "@mui/icons-material";
import LaunchIcon from '@mui/icons-material/Launch';
import { Box, Typography, Divider, useTheme } from "@mui/material";
import UserImage from "components/UserImage";
import FlexBetween from "components/FlexBetween";
import WidgetWrapper from "components/WidgetWrapper";
import EditProfileModal from "components/EditProfileModal";
import { useSelector } from "react-redux";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const UserWidget = ({ userId, picturePath }) => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { palette } = useTheme();
  const navigate = useNavigate();
  const token = useSelector((state) => state.token);
  const loggedInUser = useSelector((state) => state.user);
  const dark = palette.neutral.dark;
  const medium = palette.neutral.medium;
  const main = palette.neutral.main;

// Helper function to format social media URLs
const formatSocialUrl = (url) => {
  if (!url) return null;
  
  // If URL already has http:// or https://, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Otherwise, add https://
  return `https://${url}`;
};

// Then in your JSX, use this function:
user?.socialLinks?.twitter && (
  <FlexBetween gap="1rem" mb="0.5rem">
    <FlexBetween gap="1rem">
      <img src="../assets/twitter.png" alt="twitter" style={{ width: '24px', height: '24px' }} />
      <Box>
        <Typography color={main} fontWeight="500">Twitter</Typography>
        <Typography color={medium} fontSize="0.75rem">Social Network</Typography>
      </Box>
    </FlexBetween>
    <a 
      href={formatSocialUrl(user.socialLinks.twitter)}
      target="_blank" 
      rel="noopener noreferrer"
      style={{ textDecoration: 'none' }}
    >
      <EditOutlined sx={{ color: main, cursor: 'pointer' }} />
    </a>
  </FlexBetween>
  )

user?.socialLinks?.linkedin && (
  <FlexBetween gap="1rem" mb="0.5rem">
    <FlexBetween gap="1rem">
      <img src="../assets/linkedin.png" alt="linkedin" style={{ width: '24px', height: '24px' }} />
      <Box>
        <Typography color={main} fontWeight="500">LinkedIn</Typography>
        <Typography color={medium} fontSize="0.75rem">Network Platform</Typography>
      </Box>
    </FlexBetween>
    <a 
      href={formatSocialUrl(user.socialLinks.linkedin)}
      target="_blank" 
      rel="noopener noreferrer"
      style={{ textDecoration: 'none' }}
    >
      <EditOutlined sx={{ color: main, cursor: 'pointer' }} />
    </a>
  </FlexBetween>
  )


user?.socialLinks?.instagram && (
  <FlexBetween gap="1rem">
    <FlexBetween gap="1rem">
      <img src="../assets/instagram.png" alt="instagram" style={{ width: '24px', height: '24px' }} />
      <Box>
        <Typography color={main} fontWeight="500">Instagram</Typography>
        <Typography color={medium} fontSize="0.75rem">Photo Sharing</Typography>
      </Box>
    </FlexBetween>
    <a 
      href={formatSocialUrl(user.socialLinks.instagram)}
      target="_blank" 
      rel="noopener noreferrer"
      style={{ textDecoration: 'none' }}
    >
      <EditOutlined sx={{ color: main, cursor: 'pointer' }} />
    </a>
  </FlexBetween>
  )
  
  
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
    location,
    occupation,
    friends,
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
            <Typography color={medium}>
              {Array.isArray(displayFriends) ? displayFriends.length : 0} friends
            </Typography>
          </Box>
        </Box>
        
        {/* Only show edit button for own profile */}
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

      <Divider />

      {/* SECOND ROW */}
      <FlexBetween p="1rem 0">
        <Box display="flex" alignItems="center" gap="0.75rem">
          <LocationOnOutlined fontSize="large" sx={{ color: main }} />
          <Typography color={medium}>{location || 'Not specified'}</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap="0.75rem">
          <WorkOutlineOutlined fontSize="large" sx={{ color: main }} />
          <Typography color={medium}>{occupation || 'Not specified'}</Typography>
        </Box>
      </FlexBetween>

      <Divider />

      {/* FOURTH ROW - Social Media Links */}
      <Box p="1rem 0">
        <Typography fontSize="1rem" color={main} fontWeight="500" mb="1rem">
          Social Profiles
        </Typography>

        {/* Twitter */}
        {user?.socialLinks?.twitter && (
          <FlexBetween gap="1rem">
            <FlexBetween gap="1rem">
              <img src="../assets/twitter.png" alt="twitter" style={{ width: '24px', height: '24px' }} />
                <Typography color={main} fontWeight="500">
                  Twitter
                </Typography>
            </FlexBetween>
            <a 
              href={user.socialLinks.twitter} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <LaunchIcon sx={{ color: main, cursor: 'pointer' }} />
            </a>
          </FlexBetween>
        )}

        {/* LinkedIn */}
        {user?.socialLinks?.linkedin && (
          <FlexBetween gap="1rem">
            <FlexBetween gap="1rem">
              <img src="../assets/linkedin.png" alt="linkedin" style={{ width: '24px', height: '24px' }} />
                <Typography color={main} fontWeight="500">
                  LinkedIn
                </Typography>
            </FlexBetween>
            <a 
              href={user.socialLinks.linkedin} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <LaunchIcon sx={{ color: main, cursor: 'pointer' }} />
            </a>
          </FlexBetween>
        )}

        {/* Instagram */}
        {user?.socialLinks?.instagram && (
          <FlexBetween gap="1rem">
            <FlexBetween gap="1rem">
              <img src="../assets/instagram.png" alt="instagram" style={{ width: '24px', height: '24px' }} />
                <Typography color={main} fontWeight="500">
                  Instagram
                </Typography>
            </FlexBetween>
            <a 
              href={user.socialLinks.instagram} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <LaunchIcon sx={{ color: main, cursor: 'pointer' }} />
            </a>
          </FlexBetween>
        )}

        {/* Show message if no social links */}
        {!user?.socialLinks?.twitter && !user?.socialLinks?.linkedin && !user?.socialLinks?.instagram && (
          <Typography color={medium} fontSize="0.875rem" fontStyle="italic">
            {isOwnProfile ? 'Add your social media links by editing your profile' : 'No social profiles added'}
          </Typography>
        )}
      </Box>

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