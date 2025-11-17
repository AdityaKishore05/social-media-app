import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
  } from "@mui/material";
  
  export const ConfirmDialog = ({
    open,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = "Confirm",
    cancelText = "Cancel",
    confirmColor = "error",
  }) => {
    return (
      <Dialog open={open} onClose={onCancel}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCancel}>{cancelText}</Button>
          <Button onClick={onConfirm} color={confirmColor} variant="contained">
            {confirmText}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };