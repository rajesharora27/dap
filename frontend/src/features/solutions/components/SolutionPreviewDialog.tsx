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
import { Close, Category, Description, CheckCircle, NewReleases, Inventory } from '@shared/components/FAIcon';
import { gql, useQuery } from '@apollo/client';

const GET_SOLUTION_DETAILS = gql`
  query SolutionDetails($id: ID!) {
    solution(id: $id) {
      id
      name
      resources { label url }
      customAttrs
      outcomes {
        id
        name
        description
      }
      releases {
        id
        name
        description
        level
      }
      products {
        edges {
          node {
            id
            name
            resources { label url }
            statusPercent
          }
        }
      }
    }
  }
`;

interface SolutionPreviewDialogProps {
    open: boolean;
    onClose: () => void;
    solutionId: string;
}

export const SolutionPreviewDialog: React.FC<SolutionPreviewDialogProps> = ({
    open,
    onClose,
    solutionId
}) => {
    const { data, loading, error } = useQuery(GET_SOLUTION_DETAILS, {
        variables: { id: solutionId },
        skip: !solutionId || !open
    });

    if (!open) return null;

    const solution = data?.solution;
    const products = solution?.products?.edges?.map((e: any) => e.node) || [];

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
                    <Typography color="error">Error loading solution: {error.message}</Typography>
                </Box>
            ) : solution ? (
                <>
                    <DialogTitle
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: 1,
                            borderColor: 'divider',
                            pb: 2,
                            background: 'linear-gradient(to right, #f3e5f5, #ffffff)'
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{
                                width: 48,
                                height: 48,
                                borderRadius: 2,
                                bgcolor: 'secondary.main',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Category sx={{ color: 'white', fontSize: 28 }} />
                            </Box>
                            <Box>
                                <Typography variant="h6" fontWeight={600}>
                                    {solution.name}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                    <Chip
                                        size="small"
                                        label="Solution"
                                        color="secondary"
                                        variant="outlined"
                                    />
                                    <Typography variant="caption" color="text.secondary">
                                        {products.length} products
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
                            {/* Left Column: Description & Products */}
                            <Box>
                                {/* Resources */}
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Description fontSize="small" /> Resources
                                    </Typography>
                                    <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fafafa' }}>
                                        {solution.resources && solution.resources.length > 0 ? (
                                            <List dense disablePadding>
                                                {solution.resources.map((res: any, idx: number) => (
                                                    <ListItem key={idx} sx={{ px: 0 }}>
                                                        <ListItemText
                                                            primary={
                                                                <Button
                                                                    component="a"
                                                                    href={res.url}
                                                                    target="_blank"
                                                                    rel="noopener"
                                                                    size="small"
                                                                    sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
                                                                >
                                                                    {res.label}
                                                                </Button>
                                                            }
                                                        />
                                                    </ListItem>
                                                ))}
                                            </List>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                No resources provided.
                                            </Typography>
                                        )}
                                    </Paper>
                                </Box>

                                {/* Products */}
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Inventory fontSize="small" /> Products ({products.length})
                                    </Typography>
                                    {products.length > 0 ? (
                                        <Paper variant="outlined">
                                            <List disablePadding>
                                                {products.map((product: any, index: number) => (
                                                    <React.Fragment key={product.id}>
                                                        {index > 0 && <Divider />}
                                                        <ListItem sx={{ py: 1.5 }}>
                                                            <ListItemText
                                                                primary={
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                        <Typography variant="body2" fontWeight={500}>
                                                                            {product.name}
                                                                        </Typography>
                                                                        {product.statusPercent !== undefined && (
                                                                            <Chip
                                                                                size="small"
                                                                                label={`${product.statusPercent}%`}
                                                                                color={product.statusPercent === 100 ? 'success' : 'primary'}
                                                                                variant="outlined"
                                                                                sx={{ height: 20, fontSize: '0.7rem' }}
                                                                            />
                                                                        )}
                                                                    </Box>
                                                                }
                                                                secondary={product.resources && product.resources.length > 0 ? `${product.resources.length} resources` : 'No resources'}
                                                            />
                                                        </ListItem>
                                                    </React.Fragment>
                                                ))}
                                            </List>
                                        </Paper>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                            No products assigned.
                                        </Typography>
                                    )}
                                </Box>

                                {/* Outcomes */}
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <CheckCircle fontSize="small" /> Outcomes ({solution.outcomes?.length || 0})
                                    </Typography>
                                    {solution.outcomes && solution.outcomes.length > 0 ? (
                                        <Paper variant="outlined">
                                            <List disablePadding>
                                                {solution.outcomes.map((outcome: any, index: number) => (
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

                            {/* Right Column: Releases */}
                            <Box>
                                {/* Releases */}
                                <Paper variant="outlined" sx={{ p: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <NewReleases fontSize="small" /> Releases ({solution.releases?.length || 0})
                                    </Typography>
                                    {solution.releases && solution.releases.length > 0 ? (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                            {solution.releases.map((release: any) => (
                                                <Box key={release.id}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Typography variant="body2" fontWeight={500}>{release.name}</Typography>
                                                        <Chip size="small" label={`Level ${release.level}`} variant="outlined" />
                                                    </Box>
                                                    {release.description && (
                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                                            {release.description}
                                                        </Typography>
                                                    )}
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


