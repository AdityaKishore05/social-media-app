import React from "react";
import { Box, Typography, Button } from "@mui/material";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          onReset={() => {
            this.setState({ hasError: false, error: null });
            window.location.reload();
          }}
        />
      );
    }
    return this.props.children;
  }
}

const ErrorFallback = ({ error, onReset }) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "50vh",
        p: 4,
        textAlign: "center",
      }}
    >
      <Typography variant="h4" gutterBottom color="error">
        Oops! Something went wrong
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {error?.message || "An unexpected error occurred"}
      </Typography>
      <Button onClick={onReset} variant="contained" color="primary">
        Reload Page
      </Button>
    </Box>
  );
};

export default ErrorBoundary;