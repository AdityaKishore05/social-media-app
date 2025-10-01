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
  return {
    palette: {
      mode: mode,
      ...(mode === "dark"
        ? {
            // Dark mode - easier on eyes with better contrast
            primary: {
              dark: colorTokens.primary[300],
              main: colorTokens.primary[400],
              light: colorTokens.primary[200],
            },
            secondary: {
              dark: colorTokens.accent[300],
              main: colorTokens.accent[400],
              light: colorTokens.accent[200],
            },
            neutral: {
              dark: colorTokens.grey[100],
              main: colorTokens.grey[300],
              mediumMain: colorTokens.grey[400],
              medium: colorTokens.grey[500],
              light: colorTokens.grey[700],
            },
            background: {
              default: colorTokens.grey[900],
              alt: colorTokens.grey[800],
              paper: colorTokens.grey[800],
            },
            success: {
              main: colorTokens.success[500],
            },
            warning: {
              main: colorTokens.warning[500],
            },
            error: {
              main: colorTokens.error[500],
            },
          }
        : {
            // Light mode - clean and modern
            primary: {
              dark: colorTokens.primary[700],
              main: colorTokens.primary[600],
              light: colorTokens.primary[400],
            },
            secondary: {
              dark: colorTokens.accent[700],
              main: colorTokens.accent[500],
              light: colorTokens.accent[300],
            },
            neutral: {
              dark: colorTokens.grey[700],
              main: colorTokens.grey[500],
              mediumMain: colorTokens.grey[400],
              medium: colorTokens.grey[300],
              light: colorTokens.grey[50],
            },
            background: {
              default: colorTokens.grey[10],
              alt: colorTokens.grey[0],
              paper: colorTokens.grey[0],
            },
            success: {
              main: colorTokens.success[600],
            },
            warning: {
              main: colorTokens.warning[600],
            },
            error: {
              main: colorTokens.error[600],
            },
          }),
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
