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
    IconButton
} from '@mui/material';
import { Close, Business, Description, Inventory, Category } from '@shared/components/FAIcon';
import { gql, useQuery } from '@apollo/client';

const GET_CUSTOMER_DETAILS = gql`
  query CustomerDetails($id: ID!) {
    customer(id: $id) {
      id
      name
      description
      products {
        id
        name
        product {
          id
          name
          statusPercent
        }
        adoptionPlan {
          id
          completedWeight
        }
      }
      solutions {
        id
        name
        solution {
          id
          name
        }
        adoptionPlan {
          id
          completedWeight
        }
      }
    }
  }
`;

interface CustomerPreviewDialogProps {
    open: boolean;
    onClose: () => void;
    customerId: string;
}

export const CustomerPreviewDialog: React.FC<CustomerPreviewDialogProps> = ({
    open,
    onClose,
    customerId
}) => {
    const { data, loading, error } = useQuery(GET_CUSTOMER_DETAILS, {
        variables: { id: customerId },
        skip: !customerId || !open
    });

    if (!open) return null;

    const customer = data?.customer;

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
                    <Typography color="error">Error loading customer: {error.message}</Typography>
                </Box>
            ) : customer ? (
                <>
                    <DialogTitle
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: 1,
                            borderColor: 'divider',
                            pb: 2,
                            background: 'linear-gradient(to right, #e8f5e9, #ffffff)'
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ 
                                width: 48, 
                                height: 48, 
                                borderRadius: 2, 
                                bgcolor: 'success.main',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Business sx={{ color: 'white', fontSize: 28 }} />
                            </Box>
                            <Box>
                                <Typography variant="h6" fontWeight={600}>
                                    {customer.name}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                    <Chip 
                                        size="small" 
                                        label="Customer"
                                        color="success"
                                        variant="outlined"
                                    />
                                    <Typography variant="caption" color="text.secondary">
                                        {customer.products?.length || 0} products • {customer.solutions?.length || 0} solutions
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                        <IconButton onClick={onClose} size="small">
                            <Close />
                        </IconButton>
                    </DialogTitle>

                    <DialogContent sx={{ py: 3 }}>
                        {/* Description */}
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Description fontSize="small" /> Description
                            </Typography>
                            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fafafa' }}>
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                    {customer.description || 'No description provided.'}
                                </Typography>
                            </Paper>
                        </Box>

                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                            {/* Products */}
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Inventory fontSize="small" /> Product Assignments ({customer.products?.length || 0})
                                </Typography>
                                {customer.products && customer.products.length > 0 ? (
                                    <Paper variant="outlined">
                                        <List disablePadding>
                                            {customer.products.map((cp: any, index: number) => (
                                                <React.Fragment key={cp.id}>
                                                    {index > 0 && <Divider />}
                                                    <ListItem sx={{ py: 1.5 }}>
                                                        <ListItemText
                                                            primary={
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <Typography variant="body2" fontWeight={500}>
                                                                        {cp.name || cp.product?.name}
                                                                    </Typography>
                                                                    {cp.adoptionPlan?.completedWeight !== undefined && (
                                                                        <Chip 
                                                                            size="small" 
                                                                            label={`${Math.round(cp.adoptionPlan.completedWeight)}% adopted`}
                                                                            color={cp.adoptionPlan.completedWeight === 100 ? 'success' : 'primary'}
                                                                            variant="outlined"
                                                                            sx={{ height: 20, fontSize: '0.7rem' }}
                                                                        />
                                                                    )}
                                                                </Box>
                                                            }
                                                            secondary={
                                                                cp.product?.statusPercent !== undefined 
                                                                    ? `Product completion: ${cp.product.statusPercent}%` 
                                                                    : null
                                                            }
                                                        />
                                                    </ListItem>
                                                </React.Fragment>
                                            ))}
                                        </List>
                                    </Paper>
                                ) : (
                                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                        No product assignments.
                                    </Typography>
                                )}
                            </Box>

                            {/* Solutions */}
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Category fontSize="small" /> Solution Assignments ({customer.solutions?.length || 0})
                                </Typography>
                                {customer.solutions && customer.solutions.length > 0 ? (
                                    <Paper variant="outlined">
                                        <List disablePadding>
                                            {customer.solutions.map((cs: any, index: number) => (
                                                <React.Fragment key={cs.id}>
                                                    {index > 0 && <Divider />}
                                                    <ListItem sx={{ py: 1.5 }}>
                                                        <ListItemText
                                                            primary={
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <Typography variant="body2" fontWeight={500}>
                                                                        {cs.name || cs.solution?.name}
                                                                    </Typography>
                                                                    {cs.adoptionPlan?.completedWeight !== undefined && (
                                                                        <Chip 
                                                                            size="small" 
                                                                            label={`${Math.round(cs.adoptionPlan.completedWeight)}% adopted`}
                                                                            color={cs.adoptionPlan.completedWeight === 100 ? 'success' : 'primary'}
                                                                            variant="outlined"
                                                                            sx={{ height: 20, fontSize: '0.7rem' }}
                                                                        />
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
                                        No solution assignments.
                                    </Typography>
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

