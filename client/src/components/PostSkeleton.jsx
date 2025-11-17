import { Skeleton, Box } from "@mui/material";

export const PostSkeleton = () => (
  <Box sx={{ p: 2, mb: 2 }}>
    <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
      <Skeleton variant="circular" width={40} height={40} />
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="text" width="60%" height={20} />
        <Skeleton variant="text" width="40%" height={16} />
      </Box>
    </Box>
    <Skeleton
      variant="rectangular"
      height={400}
      sx={{ borderRadius: 2, mb: 2 }}
    />
    <Box sx={{ display: "flex", gap: 2, mb: 1 }}>
      <Skeleton variant="circular" width={24} height={24} />
      <Skeleton variant="circular" width={24} height={24} />
    </Box>
    <Skeleton variant="text" width="80%" height={16} />
  </Box>
);