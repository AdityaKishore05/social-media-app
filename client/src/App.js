import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import { ToastProvider } from "./components/ToastProvider";

import HomePage from "scenes/homePage";
import LoginPage from "scenes/loginPage";
import ProfilePage from "scenes/profilePage";
import { themeSettings } from "./theme";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  const mode = useSelector((state) => state.mode || "light");
  const token = useSelector((state) => state.token);
  const isAuth = Boolean(token);

  const theme = useMemo(() => {
    return createTheme(themeSettings(mode));
  }, [mode]);

  return (
    <div className="app">
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <ToastProvider />
          <ErrorBoundary>
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
          </ErrorBoundary>
        </ThemeProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
