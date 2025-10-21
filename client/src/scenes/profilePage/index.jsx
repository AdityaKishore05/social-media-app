import { Box, Divider, useMediaQuery } from "@mui/material";
import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import Navbar from "scenes/navbar";
import FriendListWidget from "scenes/widgets/FriendListWidget";
import PostsWidget from "scenes/widgets/PostsWidget";
import UserWidget from "scenes/widgets/UserWidget";

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const { userId } = useParams();
  const token = useSelector((state) => state.token);
  const loggedInUserId = useSelector((state) => state.user._id);
  const isNonMobileScreens = useMediaQuery("(min-width:1000px)");

  const getUser = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await fetch(
        `https://getsocialnow.onrender.com/users/${userId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch user: ${response.status}`);
      }

      const data = await response.json();
      console.log("User data loaded for profile:", data.firstName, data.lastName);
      setUser(data);
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  }, [userId, token]);

  useEffect(() => {
    getUser();
  }, [getUser]);

  if (!user) {
    return (
      <Box>
        <Navbar />
        <Box sx={{ textAlign: "center", mt: 4 }}>Loading user profile...</Box>
      </Box>
    );
  }

  return (
    <Box>
      <Navbar />
      <Box
        width="100%"
        display={isNonMobileScreens ? "flex" : "block"}
        gap="1.5rem"
        justifyContent="center"
        my="1.5rem"
      >
        {/* LEFT COLUMN */}
        <Box flexBasis={isNonMobileScreens ? "27%" : undefined}>
          <UserWidget userId={userId} picturePath={user.picturePath} />
          <Box m="1rem 0" />
          <Divider />
          <Box>
            <FriendListWidget userId={userId} />
          </Box>
        </Box>
        <Box m="1rem 0" />
          <Divider />
        {/* RIGHT COLUMN */}
        <Box
          flexBasis={isNonMobileScreens ? "60%" : undefined}
          mt={isNonMobileScreens ? "-1rem" : "1rem"}
        >
          {loggedInUserId === userId && <Box m="1rem 0" />}
          
          <PostsWidget
            key={`profile-posts-${userId}`}
            userId={userId}
            isProfile={true}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default ProfilePage;
