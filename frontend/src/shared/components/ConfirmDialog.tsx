import * as React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    Typography
} from '@mui/material';
import { Warning } from '@shared/components/FAIcon';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    severity?: 'error' | 'warning' | 'info';
}

/**
 * A standardized confirmation dialog to replace window.confirm
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    open,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    onConfirm,
    onCancel,
    severity = 'warning'
}) => {
    return (
        <Dialog
            open={open}
            onClose={onCancel}
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    minWidth: 400,
                    border: '1px solid',
                    borderColor: 'divider'
                }
            }}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
                <Warning color={severity === 'error' ? 'error' : 'warning'} />
                <Typography variant="h6" component="span" fontWeight="bold">
                    {title}
                </Typography>
            </DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ color: 'text.primary', mt: 1, fontSize: '0.95rem' }}>
                    {message}
                </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ p: 2.5, pt: 1 }}>
                <Button onClick={onCancel} color="inherit" size="small">
                    {cancelLabel}
                </Button>
                <Button
                    onClick={() => {
                        onConfirm();
                        onCancel(); // Close after confirm
                    }}
                    variant="contained"
                    color={severity === 'error' ? 'error' : 'primary'}
                    autoFocus
                    size="small"
                >
                    {confirmLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
