import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  useTheme,
  Divider,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setLogin } from "state";

const Form = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { palette } = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const API_URL = "https://getsocialnow.onrender.com";

  // Handle Google response - wrapped in useCallback to avoid recreating
  const handleGoogleResponse = useCallback(async (response) => {
    setIsLoading(true);
    setError("");

    try {
      console.log("Google login successful, sending to backend...");

      const res = await fetch(`${API_URL}/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          credential: response.credential,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Google login failed");
      }

      const data = await res.json();
      console.log("Login successful:", data);

      if (data.user && data.token) {
        dispatch(setLogin({ user: data.user, token: data.token }));
        navigate("/home");
      }
    } catch (error) {
      console.error("Google login error:", error);
      setError(`Google login failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, navigate]); // Add dependencies

  // Initialize Google Sign-In
  useEffect(() => {
    // Check if Google script is loaded
    if (window.google) {
      try {
        window.google.accounts.id.initialize({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        });

        // Render the button
        window.google.accounts.id.renderButton(
          document.getElementById("googleSignInButton"),
          {
            theme: palette.mode === "dark" ? "filled_black" : "outline",
            size: "large",
            width: "100%",
            text: "signin_with",
            shape: "rectangular",
          }
        );

        console.log("Google Sign-In initialized");
      } catch (error) {
        console.error("Error initializing Google Sign-In:", error);
        setError("Failed to initialize Google Sign-In");
      }
    } else {
      console.warn("Google Sign-In script not loaded yet");
    }
  }, [palette.mode, handleGoogleResponse]); // Now includes handleGoogleResponse

  // Email/Password Login
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Invalid credentials");
      }

      const data = await response.json();

      if (data.user && data.token) {
        dispatch(setLogin({ user: data.user, token: data.token }));
        navigate("/home");
      }
    } catch (error) {
      setError("Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box>
      {error && (
        <Box
          sx={{
            mb: 2,
            p: 2,
            backgroundColor: "#f8d7da",
            color: "#721c24",
            borderRadius: "8px",
            border: "1px solid #f5c6cb",
          }}
        >
          <Typography>{error}</Typography>
        </Box>
      )}

      {/* GOOGLE SIGN IN BUTTON */}
      <Box sx={{ mb: 1 }}>
        {isLoading ? (
          <Box display="flex" justifyContent="center">
            <CircularProgress />
          </Box>
        ) : (
          <div id="googleSignInButton" style={{ width: "100%" }}></div>
        )}
      </Box>

      <Typography
            variant="body2"
            textAlign="center"
            sx={{color: palette.neutral.medium }}
          >
             New users get automatically registered with Google
          </Typography>

      <Divider sx={{ my: 1 }}>
        <Typography variant="body2" color="text.secondary">
          OR
        </Typography>
      </Divider>

      <Typography
            variant="body2"
            textAlign="center"
            sx={{ my: 1, color: palette.neutral.medium }}
      >
        Registered users login
          </Typography>

      {/* EMAIL/PASSWORD LOGIN */}
      <form onSubmit={handleEmailLogin}>
        <Box display="flex" flexDirection="column" gap="20px">
          <TextField
            label="Email"
            name="email"
            type="email"
            required
            disabled={isLoading}
            fullWidth
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            required
            disabled={isLoading}
            fullWidth
          />

          <Button
            fullWidth
            type="submit"
            disabled={isLoading}
            sx={{
              p: "1rem",
              backgroundColor: palette.primary.main,
              color: palette.background.alt,
              "&:hover": { color: palette.primary.main },
              "&:disabled": {
                backgroundColor: palette.neutral.light,
              },
            }}
          >
            {isLoading ? "LOGGING IN..." : "LOGIN"}
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default Form;