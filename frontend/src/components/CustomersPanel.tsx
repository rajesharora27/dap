import * as React from 'react';
import { useState } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { 
  List, 
  ListItemButton, 
  ListItemText, 
  Box, 
  Button, 
  Stack, 
  IconButton,
  Typography,
  Chip
} from '@mui/material';
import { Add, Edit, Delete, Email } from '@mui/icons-material';
import { CustomerDialog } from './dialogs/CustomerDialog';

const CUSTOMERS = gql`query Customers { customers { id name description } }`;
const CREATE_CUSTOMER = gql`mutation CreateCustomer($input:CustomerInput!){ createCustomer(input:$input){ id name description } }`;
const UPDATE_CUSTOMER = gql`mutation UpdateCustomer($id:ID!,$input:CustomerInput!){ updateCustomer(id:$id,input:$input){ id name description } }`;
const DELETE_CUSTOMER = gql`mutation DeleteCustomer($id:ID!){ deleteCustomer(id:$id) }`;

interface Props { onSelect: (id: string)=>void }
export const CustomersPanel: React.FC<Props> = ({ onSelect }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [dialogTitle, setDialogTitle] = useState('');

  const { data, refetch } = useQuery(CUSTOMERS);
  const [createCustomer] = useMutation(CREATE_CUSTOMER, { onCompleted: () => refetch() });
  const [updateCustomer] = useMutation(UPDATE_CUSTOMER, { onCompleted: () => refetch() });
  const [deleteCustomer] = useMutation(DELETE_CUSTOMER, { onCompleted: () => refetch() });
  
  const list = data?.customers || [];

  const handleAdd = () => {
    setEditingCustomer(null);
    setDialogTitle('Add Customer');
    setDialogOpen(true);
  };

  const handleEdit = (customer: any) => {
    setEditingCustomer(customer);
    setDialogTitle('Edit Customer');
    setDialogOpen(true);
  };

  const handleSave = async (formData: any) => {
    if (editingCustomer) {
      await updateCustomer({ 
        variables: { 
          id: editingCustomer.id, 
          input: formData 
        } 
      });
    } else {
      await createCustomer({ variables: { input: formData } });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Delete customer "${name}"?`)) {
      await deleteCustomer({ variables: { id } });
    }
  };

  return (
    <Box>
      <Stack direction="row" spacing={1} px={1} pt={1}>
        <Button 
          size="small" 
          variant="outlined" 
          startIcon={<Add />} 
          onClick={handleAdd}
        >
          Add Customer
        </Button>
      </Stack>
      
      <List dense>
        {list.map((c: any) => (
          <ListItemButton 
            key={c.id} 
            onClick={() => onSelect(c.id)}
            sx={{ 
              '&:hover .action-buttons': { opacity: 1 },
              borderRadius: 1,
              mx: 0.5,
              mb: 0.5
            }}
          >
            <ListItemText 
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" fontWeight="medium">
                    {c.name}
                  </Typography>
                  {c.description && (
                    <Chip 
                      label={c.description} 
                      size="small" 
                      variant="outlined"
                      sx={{ fontSize: '0.7rem', height: 18 }}
                    />
                  )}
                </Box>
              }
              secondary={
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">
                    Customer ID: {c.id}
                  </Typography>
                  <Box 
                    className="action-buttons" 
                    sx={{ opacity: 0, transition: 'opacity 0.2s', display: 'flex', gap: 0.5 }}
                  >
                    <IconButton
                      size="small"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        handleEdit(c);
                      }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        handleDelete(c.id, c.name);
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              }
            />
          </ListItemButton>
        ))}
      </List>

      <CustomerDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        customer={editingCustomer}
        title={dialogTitle}
      />
    </Box>
  );
};
