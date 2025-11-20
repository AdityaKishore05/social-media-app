import { Box, Typography, useTheme } from "@mui/material";
import Navbar from "scenes/navbar";

const NotFoundPage = () => {
    const theme = useTheme();
    const alt = theme.palette.background.alt;

    return (
        <Box>
            <Navbar />
            <Box
                width="100%"
                height="80vh"
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                backgroundColor={alt}
            >
                <Typography variant="h1" color="primary" fontWeight="bold">
                    404
                </Typography>
                <Typography variant="h4" color={theme.palette.neutral.medium}>
                    Page Not Found
                </Typography>
            </Box>
        </Box>
    );
};

export default NotFoundPage;
