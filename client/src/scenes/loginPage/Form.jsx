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
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    
    console.log("=== GOOGLE SIGN-IN SETUP ===");
    console.log("Client ID:", clientId);
    console.log("Client ID length:", clientId?.length);
    console.log("Google loaded:", !!window.google);
    
    // Validate Client ID
    if (!clientId) {
      console.error("❌ REACT_APP_GOOGLE_CLIENT_ID is not set!");
      setError("Google Sign-In is not configured. Missing Client ID.");
      return;
    }
    
    if (!clientId.includes('.apps.googleusercontent.com')) {
      console.error("❌ Client ID format is incorrect!");
      setError("Google Client ID is invalid. Must end with .apps.googleusercontent.com");
      return;
    }
    
    // Check if Google script is loaded
    if (window.google) {
      try {
        console.log("Initializing Google Sign-In...");
        
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Render the button
        const buttonDiv = document.getElementById("googleSignInButton");
        if (buttonDiv) {
          window.google.accounts.id.renderButton(
            buttonDiv,
            {
              theme: palette.mode === "dark" ? "filled_black" : "outline",
              size: "large",
              width: "100%",
              text: "signin_with",
              shape: "rectangular",
              logo_alignment: "left",
            }
          );
          console.log("✓ Google Sign-In button rendered");
        } else {
          console.error("❌ Button container not found");
        }

        console.log("✓ Google Sign-In initialized successfully");
      } catch (error) {
        console.error("❌ Error initializing Google Sign-In:", error);
        setError(`Failed to initialize Google Sign-In: ${error.message}`);
      }
    } else {
      console.warn("⚠️ Google Sign-In script not loaded yet. Retrying...");
      // Retry after a short delay
      const retryTimeout = setTimeout(() => {
        if (window.google) {
          window.location.reload();
        }
      }, 2000);
      return () => clearTimeout(retryTimeout);
    }
  }, [palette.mode, handleGoogleResponse]);

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
      <Box mb="2">
        {isLoading ? (
          <Box display="flex" justifyContent="center">
            <CircularProgress />
          </Box>
        ) : (
          <div id="googleSignInButton"></div>
        )}
      </Box>

      <Divider sx={{ my: 3 }}>
        <Typography variant="body2" color="text.secondary">
          OR
        </Typography>
      </Divider>

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
            {isLoading ? "LOGGING IN..." : "LOGIN WITH EMAIL"}
          </Button>

          <Typography
            variant="body2"
            textAlign="center"
            sx={{ mt: 1, color: palette.neutral.medium }}
          >
           New users get automatically registered with Google
          </Typography>
        </Box>
      </form>
    </Box>
  );
};

export default Form;