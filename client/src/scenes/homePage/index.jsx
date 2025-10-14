import { Box, Divider, useMediaQuery } from "@mui/material";
import { useSelector } from "react-redux";
import Navbar from "scenes/navbar";
import MyPostWidget from "scenes/widgets/MyPostWidget";
import PostsWidget from "scenes/widgets/PostsWidget";

const HomePage = () => {
  const isNonMobileScreens = useMediaQuery("(min-width:1025px)");
  const { _id, picturePath } = useSelector((state) => state.user);

  return (
    <Box>
      <Navbar />
      <Box
        width="100%"
        display={isNonMobileScreens ? "flex" : "block"}
        gap="2rem"
        justifyContent="center"
      >
        <Box
          flexBasis={isNonMobileScreens ? "50%" : undefined}
          mt={isNonMobileScreens ? undefined : "1rem"}
        >
          <MyPostWidget picturePath={picturePath}/>
          <Divider></Divider>
          <PostsWidget userId={_id} />
        </Box>
      </Box>
    </Box>
  );
};

export default HomePage;
