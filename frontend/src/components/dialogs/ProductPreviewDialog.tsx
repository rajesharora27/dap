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
    IconButton,
    LinearProgress
} from '@mui/material';
import { Close, Inventory, Description, CheckCircle, LocalOffer, NewReleases } from '../../components/common/FAIcon';
import { gql, useQuery } from '@apollo/client';

const GET_PRODUCT_DETAILS = gql`
  query GetProductDetails($id: ID!) {
    product(id: $id) {
      id
      name
      description
      statusPercent
      customAttrs
      licenses {
        id
        name
        description
        level
        isActive
      }
      releases {
        id
        name
        description
        level
        isActive
      }
      outcomes {
        id
        name
        description
      }
      tasks(first: 100) {
        edges {
          node {
            id
            name
            weight
          }
        }
      }
    }
  }
`;

interface ProductPreviewDialogProps {
    open: boolean;
    onClose: () => void;
    productId: string;
}

export const ProductPreviewDialog: React.FC<ProductPreviewDialogProps> = ({
    open,
    onClose,
    productId
}) => {
    const { data, loading, error } = useQuery(GET_PRODUCT_DETAILS, {
        variables: { id: productId },
        skip: !productId || !open
    });

    if (!open) return null;

    const product = data?.product;
    const tasks = product?.tasks?.edges?.map((e: any) => e.node) || [];

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
                    <Typography color="error">Error loading product: {error.message}</Typography>
                </Box>
            ) : product ? (
                <>
                    <DialogTitle
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: 1,
                            borderColor: 'divider',
                            pb: 2,
                            background: 'linear-gradient(to right, #e3f2fd, #ffffff)'
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ 
                                width: 48, 
                                height: 48, 
                                borderRadius: 2, 
                                bgcolor: 'primary.main',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Inventory sx={{ color: 'white', fontSize: 28 }} />
                            </Box>
                            <Box>
                                <Typography variant="h6" fontWeight={600}>
                                    {product.name}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                    <Chip 
                                        size="small" 
                                        label={`${product.statusPercent}% Complete`}
                                        color={product.statusPercent === 100 ? 'success' : product.statusPercent > 50 ? 'primary' : 'warning'}
                                    />
                                    <Typography variant="caption" color="text.secondary">
                                        {tasks.length} tasks
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                        <IconButton onClick={onClose} size="small">
                            <Close />
                        </IconButton>
                    </DialogTitle>

                    <DialogContent sx={{ py: 3 }}>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 3 }}>
                            {/* Left Column: Description & Outcomes */}
                            <Box>
                                {/* Description */}
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Description fontSize="small" /> Description
                                    </Typography>
                                    <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fafafa' }}>
                                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                            {product.description || 'No description provided.'}
                                        </Typography>
                                    </Paper>
                                </Box>

                                {/* Completion Progress */}
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Completion Progress
                                    </Typography>
                                    <Paper variant="outlined" sx={{ p: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Box sx={{ flex: 1 }}>
                                                <LinearProgress 
                                                    variant="determinate" 
                                                    value={product.statusPercent} 
                                                    sx={{ height: 10, borderRadius: 5 }}
                                                />
                                            </Box>
                                            <Typography variant="h6" fontWeight={600} color="primary.main">
                                                {product.statusPercent}%
                                            </Typography>
                                        </Box>
                                    </Paper>
                                </Box>

                                {/* Outcomes */}
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <CheckCircle fontSize="small" /> Outcomes ({product.outcomes?.length || 0})
                                    </Typography>
                                    {product.outcomes && product.outcomes.length > 0 ? (
                                        <Paper variant="outlined">
                                            <List disablePadding>
                                                {product.outcomes.map((outcome: any, index: number) => (
                                                    <React.Fragment key={outcome.id}>
                                                        {index > 0 && <Divider />}
                                                        <ListItem sx={{ py: 1.5 }}>
                                                            <ListItemText
                                                                primary={
                                                                    <Typography variant="body2" fontWeight={500}>
                                                                        {outcome.name}
                                                                    </Typography>
                                                                }
                                                                secondary={outcome.description}
                                                            />
                                                        </ListItem>
                                                    </React.Fragment>
                                                ))}
                                            </List>
                                        </Paper>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                            No outcomes defined.
                                        </Typography>
                                    )}
                                </Box>
                            </Box>

                            {/* Right Column: Licenses & Releases */}
                            <Box>
                                {/* Licenses */}
                                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <LocalOffer fontSize="small" /> Licenses ({product.licenses?.length || 0})
                                    </Typography>
                                    {product.licenses && product.licenses.length > 0 ? (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            {product.licenses.map((license: any) => (
                                                <Box key={license.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Typography variant="body2">{license.name}</Typography>
                                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                        <Chip size="small" label={`Level ${license.level}`} variant="outlined" />
                                                        {license.isActive && <Chip size="small" label="Active" color="success" />}
                                                    </Box>
                                                </Box>
                                            ))}
                                        </Box>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                            No licenses defined.
                                        </Typography>
                                    )}
                                </Paper>

                                {/* Releases */}
                                <Paper variant="outlined" sx={{ p: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <NewReleases fontSize="small" /> Releases ({product.releases?.length || 0})
                                    </Typography>
                                    {product.releases && product.releases.length > 0 ? (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            {product.releases.map((release: any) => (
                                                <Box key={release.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Typography variant="body2">{release.name}</Typography>
                                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                        <Chip size="small" label={`Level ${release.level}`} variant="outlined" />
                                                        {release.isActive && <Chip size="small" label="Active" color="success" />}
                                                    </Box>
                                                </Box>
                                            ))}
                                        </Box>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                            No releases defined.
                                        </Typography>
                                    )}
                                </Paper>
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


