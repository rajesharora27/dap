import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Chip,
    Divider,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    Paper,
    Link,
    IconButton
} from '@mui/material';
import { Close, Description, Speed, Scale, Link as LinkIcon } from '@shared/components/FAIcon';
import { gql, useQuery } from '@apollo/client';

const GET_TASK_DETAILS = gql`
  query TaskDetails($id: ID!) {
    task(id: $id) {
      id
      name
      description
      estMinutes
      weight
      notes
      howToDoc
      howToVideo
      telemetryAttributes {
        id
        name
        description
        dataType
        isRequired
        currentValue {
          value
          notes
        }
      }
      product {
        id
        name
      }
    }
  }
`;

interface TaskPreviewDialogProps {
    open: boolean;
    onClose: () => void;
    taskId: string;
}

export const TaskPreviewDialog: React.FC<TaskPreviewDialogProps> = ({
    open,
    onClose,
    taskId
}) => {
    const { data, loading, error } = useQuery(GET_TASK_DETAILS, {
        variables: { id: taskId },
        skip: !taskId || !open
    });

    if (!open) return null;

    const task = data?.task;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 3, maxHeight: '85vh' }
            }}
        >
            {loading ? (
                <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Box sx={{ p: 3 }}>
                    <Typography color="error">Error loading task: {error.message}</Typography>
                </Box>
            ) : task ? (
                <>
                    <DialogTitle
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: 1,
                            borderColor: 'divider',
                            pb: 2,
                            background: 'linear-gradient(to right, #f8f9fa, #ffffff)'
                        }}
                    >
                        <Box>
                            <Typography variant="h6" fontWeight={600}>
                                {task.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Product: {task.product?.name || 'Unknown'}
                            </Typography>
                        </Box>
                        <IconButton onClick={onClose} size="small">
                            <Close />
                        </IconButton>
                    </DialogTitle>

                    <DialogContent sx={{ py: 3 }}>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 3 }}>
                            {/* Left Column: Description & Telemetry */}
                            <Box>
                                {/* Description */}
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Description fontSize="small" /> Description
                                    </Typography>
                                    <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fafafa' }}>
                                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                            {task.description || 'No description provided.'}
                                        </Typography>
                                    </Paper>
                                </Box>

                                {/* Telemetry */}
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Telemetry Criteria
                                    </Typography>
                                    {task.telemetryAttributes && task.telemetryAttributes.length > 0 ? (
                                        <Paper variant="outlined">
                                            <List disablePadding>
                                                {task.telemetryAttributes.map((attr: any, index: number) => (
                                                    <React.Fragment key={attr.id || index}>
                                                        {index > 0 && <Divider />}
                                                        <ListItem sx={{ py: 1.5 }}>
                                                            <ListItemText
                                                                primary={
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                        <Typography variant="body2" fontWeight={500}>
                                                                            {attr.name}
                                                                        </Typography>
                                                                        {attr.isRequired && (
                                                                            <Chip label="Required" size="small" color="error" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                                                                        )}
                                                                    </Box>
                                                                }
                                                                secondary={
                                                                    <Box sx={{ mt: 0.5 }}>
                                                                        <Typography variant="caption" display="block" color="text.secondary">
                                                                            {attr.description}
                                                                        </Typography>
                                                                        {attr.currentValue?.value && (
                                                                            <Box sx={{ mt: 0.5, bgcolor: '#e3f2fd', p: 0.5, borderRadius: 1, display: 'inline-block' }}>
                                                                                <Typography variant="caption" color="primary.dark" fontWeight={500}>
                                                                                    Current: {attr.currentValue.value}
                                                                                </Typography>
                                                                            </Box>
                                                                        )}
                                                                    </Box>
                                                                }
                                                            />
                                                        </ListItem>
                                                    </React.Fragment>
                                                ))}
                                            </List>
                                        </Paper>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                            No telemetry criteria defined.
                                        </Typography>
                                    )}
                                </Box>
                            </Box>

                            {/* Right Column: Meta & Links */}
                            <Box>
                                {/* Metrics */}
                                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom>Metrics</Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                                                <Speed fontSize="small" /> <Typography variant="caption">Est. Time</Typography>
                                            </Box>
                                            <Typography variant="body2" fontWeight={600}>{task.estMinutes} min</Typography>
                                        </Box>
                                        <Divider />
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                                                <Scale fontSize="small" /> <Typography variant="caption">Weight</Typography>
                                            </Box>
                                            <Typography variant="body2" fontWeight={600}>{task.weight}%</Typography>
                                        </Box>
                                    </Box>
                                </Paper>

                                {/* Documentation */}
                                {(task.howToDoc?.length > 0 || task.howToVideo?.length > 0) && (
                                    <Paper variant="outlined" sx={{ p: 2 }}>
                                        <Typography variant="subtitle2" gutterBottom>Resources</Typography>
                                        <List disablePadding dense>
                                            {task.howToDoc?.map((link: string, i: number) => (
                                                <ListItem key={`doc-${i}`} disablePadding sx={{ mb: 1 }}>
                                                    <Link href={link} target="_blank" rel="noopener noreferrer" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.875rem' }}>
                                                        <LinkIcon fontSize="inherit" /> Documentation {i + 1}
                                                    </Link>
                                                </ListItem>
                                            ))}
                                            {task.howToVideo?.map((link: string, i: number) => (
                                                <ListItem key={`vid-${i}`} disablePadding sx={{ mb: 1 }}>
                                                    <Link href={link} target="_blank" rel="noopener noreferrer" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.875rem' }}>
                                                        <LinkIcon fontSize="inherit" /> Video Tutorial {i + 1}
                                                    </Link>
                                                </ListItem>
                                            ))}
                                        </List>
                                    </Paper>
                                )}
                            </Box>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
                        <Button onClick={onClose} variant="contained">Close</Button>
                    </DialogActions>
                </>
            ) : null}
        </Dialog>
    );
};
