import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
    Box,
    CircularProgress
} from '@mui/material';
import { useQuery, useMutation, gql } from '@apollo/client';
import { PRODUCTS } from '@features/products/graphql/products.queries';
import { COPY_GLOBAL_PRODUCT_TO_PERSONAL } from '../graphql/personal-sandbox';

interface AssignFromCatalogDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const AssignFromCatalogDialog: React.FC<AssignFromCatalogDialogProps> = ({ open, onClose, onSuccess }) => {
    const [selectedProductId, setSelectedProductId] = useState<string>('');

    // Fetch Global Products
    const { data: productsData, loading: loadingProducts } = useQuery(PRODUCTS);

    // Mutation
    const [copyProduct, { loading: copying }] = useMutation(COPY_GLOBAL_PRODUCT_TO_PERSONAL, {
        onCompleted: () => {
            onSuccess();
            handleClose();
        },
        onError: (err) => {
            alert(`Error copying product: ${err.message}`);
        }
    });

    const handleClose = () => {
        setSelectedProductId('');
        onClose();
    };

    const handleCopy = () => {
        if (!selectedProductId) return;
        copyProduct({ variables: { productId: selectedProductId } });
    };

    const products = productsData?.products?.edges?.map((e: any) => e.node) || [];

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Add from Catalog</DialogTitle>
            <DialogContent>
                <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        Select a product from the global catalog to copy into your personal sandbox.
                        You will be able to edit tasks, outcomes, and track your progress independently.
                    </Typography>

                    <FormControl fullWidth size="small">
                        <InputLabel>Select Product</InputLabel>
                        <Select
                            value={selectedProductId}
                            label="Select Product"
                            onChange={(e) => setSelectedProductId(e.target.value)}
                            disabled={loadingProducts || copying}
                        >
                            {loadingProducts ? (
                                <MenuItem disabled><CircularProgress size={20} sx={{ mr: 2 }} /> Loading...</MenuItem>
                            ) : (
                                products.map((p: any) => (
                                    <MenuItem key={p.id} value={p.id}>
                                        {p.name}
                                    </MenuItem>
                                ))
                            )}
                        </Select>
                    </FormControl>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={copying}>Cancel</Button>
                <Button
                    onClick={handleCopy}
                    variant="contained"
                    disabled={!selectedProductId || copying}
                >
                    {copying ? 'Copying...' : 'Copy to Sandbox'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
