import { Box, Typography, useTheme, useMediaQuery } from "@mui/material";
import Form from "./Form";
import { useEffect } from "react";
import FlexBetween from "components/FlexBetween";
import { useDispatch } from "react-redux";
import{IconButton} from "@mui/material";
import { setMode } from "state";
import {
  DarkMode,
  LightMode,
} from "@mui/icons-material";
import WidgetWrapper from "components/WidgetWrapper";

const LoginPage = () => {
  const theme = useTheme();
  const isNonMobileScreens = useMediaQuery("(min-width: 1000px)");
  const dispatch = useDispatch();
  const dark = theme.palette.neutral.dark;
  
  // ADDED: Wake up Render server on page load
  useEffect(() => {
    const wakeUpServer = async () => {
      try {
        console.log("Waking up server...");
        await fetch("https://getsocialnow.onrender.com/health");
        console.log("Server is awake");
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
        boxShadow="10px 0px 10px 0 rgba(0, 0, 0, 0.5)"
        borderBottom="1px solid rgba(255, 255, 255, 0.15)"
        p="1rem 6%"
      >
        <Typography fontWeight="bold" fontSize="32px" color="primary">
          GSN
        </Typography>
        <Typography fontWeight="bold" fontSize="32px" color="primary">
          <IconButton onClick={() => dispatch(setMode())}>
            {theme.palette.mode === "dark" ? (
              <DarkMode sx={{ fontSize: "25px" }} />
            ) : (
              <LightMode sx={{ color: dark, fontSize: "25px" }} />
            )}
          </IconButton>
        </Typography>
      </FlexBetween>

      <WidgetWrapper
        width={isNonMobileScreens ? "50%" : "93%"}
        p="2rem"
        m="2rem auto"
      >
        <Typography fontWeight="500" variant="h5" sx={{ mb: "1.5rem" }} textAlign="center">
          Welcome to GSN, the social media platform for Gen Z's!
        </Typography>
        <Form />
      </WidgetWrapper>
    </Box>
  );
};

export default LoginPage;