import { Box, Typography, useTheme, useMediaQuery } from "@mui/material";
import Form from "./Form";
import { useEffect } from "react";
import FlexBetween from "components/FlexBetween";
import { useDispatch } from "react-redux";
import { IconButton } from "@mui/material";
import { setMode } from "state";
import { DarkMode, LightMode } from "@mui/icons-material";
import { API_ENDPOINTS } from "config";


const LoginPage = () => {
  const theme = useTheme();
  const isNonMobileScreens = useMediaQuery("(min-width: 1000px)");
  const dispatch = useDispatch();
  const dark = theme.palette.neutral.dark;
  
  useEffect(() => {
    const wakeUpServer = async () => {
      try {
        console.log("Waking up server...");
        await fetch(API_ENDPOINTS.HEALTH);        console.log("Server is awake");
      } catch (error) {
        console.log("Server wake-up ping sent");
      }
    };
    wakeUpServer();
  }, []);

  return (
    <Box>
      <FlexBetween
        width="100%"
        backdropFilter="blur(12px)"
        boxShadow="2px 0px 2px 0 rgba(0, 0, 0, 0.15)"
        borderBottom="1px solid rgba(255, 255, 255, 0.15)"
        p="1rem 6%"
      >
        <Typography fontWeight="bold" fontSize="32px" color="primary">
          GSN
        </Typography>
        <IconButton onClick={() => dispatch(setMode())}>
          {theme.palette.mode === "dark" ? (
            <DarkMode sx={{ fontSize: "25px" }} />
          ) : (
            <LightMode sx={{ color: dark, fontSize: "25px" }} />
          )}
        </IconButton>
      </FlexBetween>

      <Box
        width={isNonMobileScreens ? "50%" : "93%"}
        p="2rem"
        m="2rem auto"
      >
        <Typography 
          fontWeight="500" 
          variant="h5" 
          sx={{ mb: "0.5rem" }} 
          textAlign="center"
        >
          Welcome to GSN!
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ mb: "2rem" }} 
          textAlign="center"
          color="text.secondary"
        >
          The social media platform for Gen Z
        </Typography>
        <Form />
      </Box>
    </Box>
  );
};

export default LoginPage;