import { motion } from "framer-motion";
import { Box } from "@mui/material";

// ✅ Properly forward refs and context-safe motion-enabled Box
const MotionBox = motion(Box);

export default MotionBox;
