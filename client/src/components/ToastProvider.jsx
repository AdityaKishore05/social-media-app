import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useTheme } from '@mui/material';

export const ToastProvider = () => {
  const theme = useTheme();
  return (
    <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme={theme.palette.mode}
      toastStyle={{
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
      }}
    />
  );
};