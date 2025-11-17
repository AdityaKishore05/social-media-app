// Modern color design tokens
export const colorTokens = {
  grey: {
    0: "#FFFFFF",
    10: "#F9FAFB",
    50: "#F3F4F6",
    100: "#E5E7EB",
    200: "#D1D5DB",
    300: "#9CA3AF",
    400: "#6B7280",
    500: "#4B5563",
    600: "#374151",
    700: "#1F2937",
    800: "#111827",
    900: "#0A0F1A",
    1000: "#000000",
  },
  primary: {
    50: "#EEF2FF",
    100: "#E0E7FF",
    200: "#C7D2FE",
    300: "#A5B4FC",
    400: "#818CF8",
    500: "#6366F1", // Modern indigo
    600: "#4F46E5",
    700: "#4338CA",
    800: "#3730A3",
    900: "#312E81",
  },
  accent: {
    50: "#FDF2F8",
    100: "#FCE7F3",
    200: "#FBCFE8",
    300: "#F9A8D4",
    400: "#F472B6",
    500: "#EC4899", // Pink accent for highlights
    600: "#DB2777",
    700: "#BE185D",
    800: "#9D174D",
    900: "#831843",
  },
  success: {
    500: "#10B981", // Green for success states
    600: "#059669",
  },
  warning: {
    500: "#F59E0B", // Amber for warnings
    600: "#D97706",
  },
  error: {
    500: "#EF4444", // Red for errors
    600: "#DC2626",
  },
};

// Modern theme settings with improved UX
export const themeSettings = (mode) => {
  const darkMode = mode === "dark";

  return {
    palette: {
      mode,
      primary: {
        main: darkMode ? "#be9dffff" : "#5B46FF",
        light: darkMode ? "#8C78FF" : "#8C78FF",
        dark: darkMode ? "#b8adffff" : "#3B22D6",
      },
      secondary: {
        main: "#FF6B6B",
      },
      neutral: {
        main: darkMode ? "#E6EEF8" : "#374151",
        mediumMain: darkMode ? "#9AA4B2" : "#6B7280",
        medium: darkMode ? "#7B8696" : "#9CA3AF",
        light: darkMode ? "#282d38ff" : "#e5e5e6ff",
      },
      background: {
        default: darkMode ? "#071029" : "#F7FAFF",
        alt: darkMode ? "rgba(13,20,30,0.6)" : "rgba(255,255,255,0.8)",
        paper: darkMode ? "rgba(10,15,25,0.7)" : "rgba(255,255,255,0.85)",
      },
    },
    typography: {
      // Modern font stack with better readability
      fontFamily: [
        "Inter",
        "-apple-system",
        "BlinkMacSystemFont",
        "Segoe UI",
        "Roboto",
        "Helvetica Neue",
        "Arial",
        "sans-serif",
      ].join(","),
      fontSize: 14,
      fontWeightLight: 300,
      fontWeightRegular: 400,
      fontWeightMedium: 500,
      fontWeightBold: 700,
      h1: {
        fontFamily: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ].join(","),
        fontSize: "2.5rem",
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: "-0.01562em",
      },
      h2: {
        fontFamily: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ].join(","),
        fontSize: "2rem",
        fontWeight: 700,
        lineHeight: 1.3,
        letterSpacing: "-0.00833em",
      },
      h3: {
        fontFamily: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ].join(","),
        fontSize: "1.5rem",
        fontWeight: 600,
        lineHeight: 1.4,
        letterSpacing: "0em",
      },
      h4: {
        fontFamily: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ].join(","),
        fontSize: "1.25rem",
        fontWeight: 600,
        lineHeight: 1.5,
        letterSpacing: "0.00735em",
      },
      h5: {
        fontFamily: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ].join(","),
        fontSize: "1rem",
        fontWeight: 600,
        lineHeight: 1.5,
        letterSpacing: "0em",
      },
      h6: {
        fontFamily: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ].join(","),
        fontSize: "0.875rem",
        fontWeight: 600,
        lineHeight: 1.6,
        letterSpacing: "0.0075em",
      },
      body1: {
        fontSize: "1rem",
        lineHeight: 1.6,
        letterSpacing: "0.00938em",
      },
      body2: {
        fontSize: "0.875rem",
        lineHeight: 1.6,
        letterSpacing: "0.01071em",
      },
      button: {
        fontWeight: 600,
        letterSpacing: "0.02857em",
        textTransform: "none", // More modern look without uppercase
      },
    },
    shape: {
      borderRadius: 12, // Softer, more modern rounded corners
    },
    shadows: [
      "none",
      "0px 2px 4px rgba(0, 0, 0, 0.05)",
      "0px 4px 8px rgba(0, 0, 0, 0.08)",
      "0px 8px 16px rgba(0, 0, 0, 0.1)",
      "0px 12px 24px rgba(0, 0, 0, 0.12)",
      "0px 16px 32px rgba(0, 0, 0, 0.14)",
      // Add more shadow levels as needed
    ],
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: "10px 20px",
            fontWeight: 600,
            "&:focus-visible": {
              outline: `2px solid ${darkMode ? "#be9dffff" : "#5B46FF"}`,
              outlineOffset: 2,
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.08)",
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            "&:focus-visible": {
              outline: `2px solid ${darkMode ? "#be9dffff" : "#5B46FF"}`,
              outlineOffset: 2,
            },
          },
        },
      },
    },
  };
};

// Optional: Add this to your index.css for Inter font
/*
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
*/
