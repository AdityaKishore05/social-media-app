import { useState} from "react";
import {
  Box,
  IconButton,
  InputBase,
  Typography,
  Select,
  MenuItem,
  FormControl,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  DarkMode,
  LightMode,
  Menu,
  Close,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { setMode, setLogout } from "state";
import { useNavigate } from "react-router-dom";
import FlexBetween from "components/FlexBetween";

const Navbar = () => {
  const [isMobileMenuToggled, setIsMobileMenuToggled] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);

  const isNonMobileScreens = useMediaQuery("(min-width: 1000px)");
  const theme = useTheme();


  const fullName = `${user.firstName} ${user.lastName}`;

  return (
    <FlexBetween
      width="100%"
      boxShadow="0px 2px 5px rgba(0,0,0,0.15)"
      borderBottom="1px solid rgba(255,255,255,0.1)"
      p="1rem 6%"
      sx={{
        position: "sticky",
        top: 0,
        backdropFilter: "blur(12px)",
        zIndex: 50,
      }}
    >
      {/* LOGO ----------------------------------------------------------- */}
      <FlexBetween gap="1.75rem">
        <Typography
          fontWeight="bold"
          fontSize="clamp(1rem, 2rem, 2.25rem)"
          color="primary"
          onClick={() => navigate("/home")}
          sx={{ cursor: "pointer" }}
        >
          GSN
        </Typography>
      </FlexBetween>

      {/* DESKTOP NAV ---------------------------------------------------- */}
      {isNonMobileScreens ? (
        <FlexBetween gap="1rem">


          {/* 🌙 / ☀ Theme Switch */}
          <IconButton onClick={() => dispatch(setMode())}>
            {theme.palette.mode === "dark" ? (
              <DarkMode sx={{ fontSize: "25px" }} />
            ) : (
              <LightMode sx={{ color: theme.palette.neutral.dark, fontSize: "25px" }} />
            )}
          </IconButton>

          {/* User Menu */}
          <FormControl variant="standard" value={fullName}>
            <Select
              value={fullName}
              sx={{
                backgroundColor: theme.palette.neutral.light,
                borderRadius: "0.25rem",
                p: "0.25rem 1rem",
              }}
              input={<InputBase />}
            >
              <MenuItem value={fullName}>
                <Typography>{fullName}</Typography>
              </MenuItem>

              <MenuItem onClick={() => dispatch(setLogout())}>
                Logout
              </MenuItem>
            </Select>
          </FormControl>
        </FlexBetween>
      ) : (
        <IconButton
          onClick={() => setIsMobileMenuToggled(!isMobileMenuToggled)}
        >
          <Menu />
        </IconButton>
      )}

      {/* MOBILE NAV ---------------------------------------------------- */}
      {!isNonMobileScreens && isMobileMenuToggled && (
        <Box
          position="fixed"
          right="0"
          bottom="0"
          height="100%"
          width="70%"
          zIndex="10"
          backgroundColor={theme.palette.background.default}
          boxShadow="0px 0px 10px rgba(0,0,0,0.4)"
          p="1rem"
        >
          {/* CLOSE ICON */}
          <Box display="flex" justifyContent="flex-end">
            <IconButton onClick={() => setIsMobileMenuToggled(false)}>
              <Close />
            </IconButton>
          </Box>

          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap="2rem"
            mt="2rem"
          >
            {/* Theme */}
            <IconButton onClick={() => dispatch(setMode())}>
              {theme.palette.mode === "dark" ? <DarkMode /> : <LightMode />}
            </IconButton>

            <FormControl variant="standard">
              <Select
                value={fullName}
                sx={{
                  backgroundColor: theme.palette.neutral.light,
                  borderRadius: "0.25rem",
                  p: "0.25rem 1rem",
                }}
                input={<InputBase />}
              >
                <MenuItem value={fullName}>{fullName}</MenuItem>
                <MenuItem onClick={() => dispatch(setLogout())}>
                  Logout
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      )}
    </FlexBetween>
  );
};

export default Navbar;
