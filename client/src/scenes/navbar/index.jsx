import { useState, useEffect, useRef } from "react";
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
  Autocomplete,
  TextField,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Paper,
  CircularProgress,
} from "@mui/material";
import {
  DarkMode,
  LightMode,
  Menu,
  Close,
  Search as SearchIcon,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { setMode, setLogout } from "state";
import { useNavigate } from "react-router-dom";
import FlexBetween from "components/FlexBetween";
import { API_ENDPOINTS } from "config";
import { toast } from "react-toastify";

const Navbar = () => {
  const [isMobileMenuToggled, setIsMobileMenuToggled] = useState(false);
  const [, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchTimeoutRef = useRef(null);
 const [showNavbar, setShowNavbar] = useState(false);
const lastScrollY = useRef(0);


  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);
  const token = useSelector((state) => state.token);
  const isNonMobileScreens = useMediaQuery("(min-width: 1000px)");
  const theme = useTheme();

  const fullName = `${user.firstName} ${user.lastName}`;

  const handleSearch = async (query) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(API_ENDPOINTS.USERS.SEARCH(query), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Search failed");
        const users = await res.json();
        setSearchResults(users);
      } catch (err) {
        console.error(err);
        toast.error("Failed to search users");
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };


  useEffect(() => {
  const handleScroll = () => {
    const currentScrollY = window.scrollY;

    // Always show navbar near top
    if (currentScrollY < 50) {
      setShowNavbar(false);
      lastScrollY.current = currentScrollY;
      return;
    }

    if (currentScrollY > lastScrollY.current) {
      // scrolling DOWN → show navbar
      setShowNavbar(true);
    } else {
      // scrolling UP → hide navbar
      setShowNavbar(false);
    }

    lastScrollY.current = currentScrollY;
  };

  lastScrollY.current = window.scrollY;

  window.addEventListener("scroll", handleScroll, { passive: true });
  return () => window.removeEventListener("scroll", handleScroll);
}, []);


  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <FlexBetween
      width="100%"
      boxShadow="2px 0px 2px 0 rgba(0, 0, 0, 0.15)"
      borderBottom="1px solid rgba(255, 255, 255, 0.15)"
      p="1rem 6%"
      sx={{
  position: "sticky",
  top: 0,
  background: theme.palette.background.default,
  zIndex: 50,
  transform: showNavbar ? "translateY(-100%)" : "translateY(0)",
  transition: "transform 0.3s ease-in-out",
}}

    >
      {/* LOGO */}
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

      {/* DESKTOP NAV */}
      {isNonMobileScreens ? (
        <FlexBetween gap="1rem" sx={{ flex: 1, maxWidth: "500px", mx: 2 }}>
          {/* SEARCH BAR */}
          <Autocomplete
            freeSolo
            open={searchOpen}
            onOpen={() => setSearchOpen(true)}
            onClose={() => setSearchOpen(false)}
            options={searchResults}
            getOptionLabel={(option) =>
              typeof option === "string"
                ? option
                : `${option.firstName} ${option.lastName} (${option.email})`
            }

            onInputChange={(e, value) => {
              setSearchQuery(value);
              handleSearch(value);
            }}
            loading={isSearching}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search by name or email..."
                size="small"
                sx={{ width: "300px" }}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />,
                  endAdornment: (
                    <>
                      {isSearching ? <CircularProgress size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderOption={(props, option) => (
              <ListItem
                {...props}
                onClick={() => {
                  navigate(`/profile/${option._id}`);
                  setSearchOpen(false);
                  setSearchQuery("");
                }}
                sx={{ cursor: "pointer" }}
              >
                <ListItemAvatar>
                  <Avatar src={option.picturePath} />
                </ListItemAvatar>
                <ListItemText
                  primary={`${option.firstName} ${option.lastName}`}
                  secondary={option.email}
                />
              </ListItem>
            )}
            PaperComponent={(props) => (
              <Paper {...props} sx={{ mt: 1 }} />
            )}
          />

          {/* Theme Switch */}
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
                borderRadius: "0.5rem",
                p: "0.25rem 0.5rem",
                width: "fit-content",
                maxWidth: "200px",
                display: "flex",
                alignItems: "center",
                whiteSpace: "nowrap",
                overflow: "visible",
              }}
              input={<InputBase />}
            >
              <MenuItem value={fullName}>
                <Typography>{fullName}</Typography>
              </MenuItem>
              <MenuItem onClick={() => navigate(`/profile/${user._id}`)}>
                Profile
              </MenuItem>
              <MenuItem onClick={() => dispatch(setLogout())}>Logout</MenuItem>
            </Select>
          </FormControl>
        </FlexBetween>
      ) : (
        <IconButton onClick={() => setIsMobileMenuToggled(!isMobileMenuToggled)}>
          <Menu />
        </IconButton>
      )}

      {/* MOBILE NAV */}
      {!isNonMobileScreens && isMobileMenuToggled && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            right: 0,
            height: "100vh",
            width: "100%",
            zIndex: 2000,
            backgroundColor:
              theme.palette.mode === "dark" ? "#05051fff" : "#FFFFFF",
            overflowY: "auto",
            boxShadow: "-4px 0 20px rgba(0,0,0,0.4)",
            p: "1.5rem",
            transition: "transform 0.3s ease",
          }}
        >
          <Box display="flex" justifyContent="flex-end">
            <IconButton onClick={() => setIsMobileMenuToggled(false)}>
              <Close sx={{ color: theme.palette.neutral.main }} />
            </IconButton>
          </Box>

          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap="2rem"
            mt="2rem"
          >
            <Autocomplete
              freeSolo
              options={searchResults}
              getOptionLabel={(option) =>
               typeof option === "string"
               ? option
               : `${option.firstName} ${option.lastName} (${option.email})`
              }

              onInputChange={(e, value) => handleSearch(value)}
              loading={isSearching}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Search by name or email..."
                  fullWidth
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: <SearchIcon sx={{ mr: 1 }} />,
                  }}
                />
              )}
              renderOption={(props, option) => (
                <ListItem
                  {...props}
                  onClick={() => {
                    navigate(`/profile/${option._id}`);
                    setIsMobileMenuToggled(false);
                  }}
                >
                  <ListItemAvatar>
                    <Avatar src={option.picturePath} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={`${option.firstName} ${option.lastName}`}
                    secondary={option.email}
                  />
                </ListItem>
              )}
              sx={{ width: "100%" }}
            />

            <IconButton onClick={() => dispatch(setMode())}>
              {theme.palette.mode === "dark" ? (
                <DarkMode sx={{ color: "white" }} />
              ) : (
                <LightMode sx={{ color: "black" }} />
              )}
            </IconButton>

            <FormControl fullWidth>
              <Select
                value={fullName}
                sx={{
                  backgroundColor: theme.palette.neutral.light,
                  borderRadius: "0.5rem",
                  p: "0.25rem 0.5rem",
                }}
                input={<InputBase />}
              >
                <MenuItem value={fullName}>{fullName}</MenuItem>
                <MenuItem onClick={() => navigate(`/profile/${user._id}`)}>
                  Profile
                </MenuItem>
                <MenuItem onClick={() => dispatch(setLogout())}>Logout</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      )}
    </FlexBetween>
  );
};

export default Navbar;