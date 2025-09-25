import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { createTheme } from "@mui/material/styles";

// Import your scenes - if any of these fail, we'll see the error
import HomePage from "scenes/homePage";
import LoginPage from "scenes/loginPage";
import ProfilePage from "scenes/profilePage";

// Import theme - if this fails, we'll see the error
import { themeSettings } from "./theme";

function App() {
  console.log("App component is loading...");

  try {
    // Test Redux state access with error handling
    const mode = useSelector((state) => {
      console.log("Redux state:", state);
      return state.mode || "light"; // Fallback to "light" if mode doesn't exist
    });

    const token = useSelector((state) => {
      console.log("Token from state:", state.token);
      return state.token;
    });

    const isAuth = Boolean(token);
    console.log("Authentication status:", isAuth);

    const theme = useMemo(() => {
      console.log("Creating theme with mode:", mode);
      return createTheme(themeSettings(mode));
    }, [mode]);

    console.log("Theme created successfully");

    return (
      <div className="app">
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <div style={{ padding: "20px" }}>
              <h1>Debug: React is Loading!</h1>
              <p>Mode: {mode}</p>
              <p>Is Authenticated: {isAuth ? "Yes" : "No"}</p>
              <p>Token exists: {token ? "Yes" : "No"}</p>
            </div>
            <Routes>
              <Route path="/" element={<LoginPage />} />
              <Route
                path="/home"
                element={isAuth ? <HomePage /> : <Navigate to="/" />}
              />
              <Route
                path="/profile/:userId"
                element={isAuth ? <ProfilePage /> : <Navigate to="/" />}
              />
            </Routes>
          </ThemeProvider>
        </BrowserRouter>
      </div>
    );
  } catch (error) {
    console.error("App component error:", error);
    return (
      <div style={{ padding: "20px", color: "red" }}>
        <h1>Error Loading App</h1>
        <p>Error: {error.message}</p>
        <p>Check the browser console for more details.</p>
      </div>
    );
  }
}

export default App;
