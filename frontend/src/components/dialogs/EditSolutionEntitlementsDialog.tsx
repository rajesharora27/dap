import * as React from 'react';
import { useState, useEffect } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
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
  Box,
  Typography,
  Alert,
  TextField
} from '@mui/material';

const GET_CUSTOMER_SOLUTION = gql`
  query GetCustomerSolution($id: ID!) {
    customerSolution(id: $id) {
      id
      name
      licenseLevel
      solution {
        id
        name
      }
    }
  }
`;

const UPDATE_CUSTOMER_SOLUTION = gql`
  mutation UpdateCustomerSolution($id: ID!, $input: UpdateCustomerSolutionInput!) {
    updateCustomerSolution(id: $id, input: $input) {
      id
      licenseLevel
    }
  }
`;

interface Props {
  open: boolean;
  onClose: () => void;
  customerSolutionId: string;
  onSuccess: () => void;
}

export function EditSolutionEntitlementsDialog({
  open,
  onClose,
  customerSolutionId,
  onSuccess,
}: Props) {
  const [licenseLevel, setLicenseLevel] = useState('ESSENTIAL');
  const [name, setName] = useState('');

  const { data, loading } = useQuery(GET_CUSTOMER_SOLUTION, {
    variables: { id: customerSolutionId },
    skip: !customerSolutionId || !open,
  });

  const [updateSolution, { loading: updating }] = useMutation(UPDATE_CUSTOMER_SOLUTION, {
    onCompleted: () => {
      onSuccess();
    },
    onError: (err) => {
      console.error('Error updating solution:', err);
      alert('Failed to update: ' + err.message);
    }
  });

  useEffect(() => {
    if (data?.customerSolution && open) {
      setLicenseLevel(data.customerSolution.licenseLevel);
      setName(data.customerSolution.name);
    }
  }, [data, open]);

  const handleSave = () => {
    updateSolution({
      variables: {
        id: customerSolutionId,
        input: {
          name,
          licenseLevel
        }
      }
    });
  };

  const hasChanges = data?.customerSolution && (
    licenseLevel !== data.customerSolution.licenseLevel ||
    name !== data.customerSolution.name
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Solution Assignment</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            Edit the solution assignment details. Changing the license level will affect all underlying products.
          </Alert>

          {loading ? (
            <Typography>Loading...</Typography>
          ) : (
            <>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                Solution: {data?.customerSolution?.solution?.name}
              </Typography>

              <TextField
                fullWidth
                label="Assignment Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                sx={{ mb: 2 }}
                helperText="Descriptive name for this solution assignment"
              />

              <FormControl fullWidth>
                <InputLabel>License Level</InputLabel>
                <Select
                  value={licenseLevel}
                  onChange={(e) => setLicenseLevel(e.target.value)}
                  label="License Level"
                >
                  <MenuItem value="ESSENTIAL">Essential</MenuItem>
                  <MenuItem value="ADVANTAGE">Advantage</MenuItem>
                  <MenuItem value="SIGNATURE">Signature</MenuItem>
                </Select>
              </FormControl>

              <Alert severity="warning" sx={{ mt: 2 }}>
                All underlying products will be updated to match this license level.
              </Alert>
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!hasChanges || updating}
        >
          {updating ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

