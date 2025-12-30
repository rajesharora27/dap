import * as React from 'react';
import {
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Divider,
    Tooltip,
    IconButton,
    Paper,
    SelectChangeEvent
} from '@mui/material';
import {
    Add,
    Edit,
    Delete,
} from '@shared/components/FAIcon';

export interface Customer {
    id: string;
    name: string;
    description?: string;
}

interface CustomerSelectorProps {
    customers: Customer[];
    selectedCustomerId: string | null;
    onSelectCustomer: (customerId: string | null) => void;
    onAddCustomer: () => void;
    onEditCustomer: (customer: Customer) => void;
    onDeleteCustomer: (customer: Customer) => void;
    loading?: boolean;
}

export function CustomerSelector({
    customers,
    selectedCustomerId,
    onSelectCustomer,
    onAddCustomer,
    onEditCustomer,
    onDeleteCustomer,
    loading
}: CustomerSelectorProps) {
    // Memoize sorted customers to avoid re-sorting on every render
    const sortedCustomers = React.useMemo(() =>
        [...customers].sort((a, b) => a.name.localeCompare(b.name)),
        [customers]
    );

    const handleChange = (e: SelectChangeEvent) => {
        const value = e.target.value;
        if (value === '__add_new__') {
            onAddCustomer();
        } else {
            onSelectCustomer(value);
        }
    };

    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

    if (loading && customers.length === 0) {
        return null; // Or skeleton
    }

    return (
        <Paper sx={{ p: 2, m: 2, mb: 0 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <FormControl sx={{ minWidth: 300, flex: '1 1 300px' }} size="small">
                    <InputLabel>Select Customer</InputLabel>
                    <Select
                        value={selectedCustomerId || ''}
                        onChange={handleChange}
                        label="Select Customer"
                    >
                        {sortedCustomers.map((customer) => (
                            <MenuItem key={customer.id} value={customer.id}>
                                {customer.name}
                            </MenuItem>
                        ))}
                        <Divider />
                        <MenuItem value="__add_new__" sx={{ color: 'success.main', fontWeight: 600 }}>
                            <Add sx={{ mr: 1, fontSize: '1rem' }} /> Add New Customer
                        </MenuItem>
                    </Select>
                </FormControl>

                {selectedCustomer && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Edit Customer">
                            <IconButton
                                onClick={() => onEditCustomer(selectedCustomer)}
                                color="primary"
                                size="small"
                            >
                                <Edit />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Customer">
                            <IconButton
                                onClick={() => onDeleteCustomer(selectedCustomer)}
                                color="error"
                                size="small"
                            >
                                <Delete />
                            </IconButton>
                        </Tooltip>
                    </Box>
                )}
            </Box>
        </Paper>
    );
}
