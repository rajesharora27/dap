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
  Checkbox,
  FormControlLabel,
  FormGroup,
  LinearProgress,
  Chip,
  Paper,
  Divider,
} from '@mui/material';
import { CheckCircle } from '@mui/icons-material';

const GET_PRODUCTS_AND_OUTCOMES = gql`
  query GetProductsAndOutcomes {
    products(first: 100) {
      edges {
        node {
          id
          name
          description
        }
      }
    }
  }
`;

const GET_OUTCOMES_FOR_PRODUCT = gql`
  query GetOutcomesForProduct($productId: ID!) {
    outcomes(productId: $productId) {
      id
      name
      description
    }
  }
`;

const ASSIGN_PRODUCT_TO_CUSTOMER = gql`
  mutation AssignProductToCustomer($input: AssignProductToCustomerInput!) {
    assignProductToCustomer(input: $input) {
      id
      licenseLevel
      selectedOutcomes {
        id
        name
      }
      product {
        id
        name
      }
    }
  }
`;

const CREATE_ADOPTION_PLAN = gql`
  mutation CreateAdoptionPlan($customerProductId: ID!) {
    createAdoptionPlan(customerProductId: $customerProductId) {
      id
      totalTasks
      progressPercentage
    }
  }
`;

interface Props {
  open: boolean;
  onClose: () => void;
  customerId: string;
  onAssigned: () => void;
}

export const AssignProductDialog: React.FC<Props> = ({ open, onClose, customerId, onAssigned }) => {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [licenseLevel, setLicenseLevel] = useState<'ESSENTIAL' | 'ADVANTAGE' | 'SIGNATURE'>('ESSENTIAL');
  const [selectedOutcomeIds, setSelectedOutcomeIds] = useState<string[]>([]);
  const [createPlanImmediately, setCreatePlanImmediately] = useState(true);
  const [step, setStep] = useState(1); // 1: Select Product, 2: Configure, 3: Confirm

  const { data: productsData, loading: productsLoading } = useQuery(GET_PRODUCTS_AND_OUTCOMES);
  
  const { data: outcomesData, loading: outcomesLoading } = useQuery(GET_OUTCOMES_FOR_PRODUCT, {
    variables: { productId: selectedProductId },
    skip: !selectedProductId,
  });

  const [assignProduct, { loading: assigning }] = useMutation(ASSIGN_PRODUCT_TO_CUSTOMER);
  const [createAdoptionPlan, { loading: creatingPlan }] = useMutation(CREATE_ADOPTION_PLAN);

  const products = productsData?.products?.edges?.map((e: any) => e.node) || [];
  const outcomes = outcomesData?.outcomes || [];
  const selectedProduct = products.find((p: any) => p.id === selectedProductId);

  useEffect(() => {
    if (!open) {
      // Reset form when dialog closes
      setSelectedProductId('');
      setLicenseLevel('ESSENTIAL');
      setSelectedOutcomeIds([]);
      setCreatePlanImmediately(true);
      setStep(1);
    }
  }, [open]);

  const handleOutcomeToggle = (outcomeId: string) => {
    setSelectedOutcomeIds((prev) =>
      prev.includes(outcomeId)
        ? prev.filter((id) => id !== outcomeId)
        : [...prev, outcomeId]
    );
  };

  const handleNext = () => {
    if (step === 1 && selectedProductId) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleBack = () => {
    setStep(Math.max(1, step - 1));
  };

  const handleAssign = async () => {
    try {
      // Step 1: Assign product to customer
      const { data } = await assignProduct({
        variables: {
          input: {
            customerId,
            productId: selectedProductId,
            licenseLevel,
            selectedOutcomeIds,
          },
        },
      });

      const customerProductId = data.assignProductToCustomer.id;

      // Step 2: Create adoption plan if requested
      if (createPlanImmediately && customerProductId) {
        await createAdoptionPlan({
          variables: { customerProductId },
        });
      }

      onAssigned();
      onClose();
    } catch (error: any) {
      alert(`Error assigning product: ${error.message}`);
    }
  };

  const licenseLevels = [
    { value: 'ESSENTIAL', label: 'Essential', description: 'Basic features and core functionality' },
    { value: 'ADVANTAGE', label: 'Advantage', description: 'Essential + Advanced features' },
    { value: 'SIGNATURE', label: 'Signature', description: 'All features and premium support' },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Assign Product to Customer
        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
          Step {step} of 3
        </Typography>
      </DialogTitle>

      <DialogContent>
        {/* Step 1: Select Product */}
        {step === 1 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Select Product
            </Typography>
            {productsLoading ? (
              <LinearProgress />
            ) : products.length === 0 ? (
              <Alert severity="warning">No products available. Please create a product first.</Alert>
            ) : (
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Product</InputLabel>
                <Select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  label="Product"
                >
                  {products.map((product: any) => (
                    <MenuItem key={product.id} value={product.id}>
                      <Box>
                        <Typography variant="body1">{product.name}</Typography>
                        {product.description && (
                          <Typography variant="caption" color="text.secondary">
                            {product.description}
                          </Typography>
                        )}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        )}

        {/* Step 2: Configure License and Outcomes */}
        {step === 2 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Configure License Level and Outcomes
            </Typography>

            {selectedProduct && (
              <Box sx={{ mb: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Selected Product
                </Typography>
                <Typography variant="h6">{selectedProduct.name}</Typography>
                {selectedProduct.description && (
                  <Typography variant="body2" color="text.secondary">
                    {selectedProduct.description}
                  </Typography>
                )}
              </Box>
            )}

            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              License Level
            </Typography>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <Select
                value={licenseLevel}
                onChange={(e) => setLicenseLevel(e.target.value as any)}
              >
                {licenseLevels.map((level) => (
                  <MenuItem key={level.value} value={level.value}>
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        {level.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {level.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              Desired Outcomes
            </Typography>
            {outcomesLoading ? (
              <LinearProgress />
            ) : outcomes.length === 0 ? (
              <Alert severity="info">
                No outcomes defined for this product. All tasks will be included in the adoption plan.
              </Alert>
            ) : (
              <Paper variant="outlined" sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
                <FormGroup>
                  {outcomes.map((outcome: any) => (
                    <FormControlLabel
                      key={outcome.id}
                      control={
                        <Checkbox
                          checked={selectedOutcomeIds.includes(outcome.id)}
                          onChange={() => handleOutcomeToggle(outcome.id)}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {outcome.name}
                          </Typography>
                          {outcome.description && (
                            <Typography variant="caption" color="text.secondary">
                              {outcome.description}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  ))}
                </FormGroup>
                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" color="text.secondary">
                  {selectedOutcomeIds.length === 0
                    ? 'No outcomes selected - all tasks will be included'
                    : `${selectedOutcomeIds.length} outcome(s) selected`}
                </Typography>
              </Paper>
            )}
          </Box>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Confirm Assignment
            </Typography>

            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Product
              </Typography>
              <Typography variant="body1" fontWeight="medium" gutterBottom>
                {selectedProduct?.name}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                License Level
              </Typography>
              <Chip
                label={licenseLevel}
                color="primary"
                size="small"
              />

              <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                Selected Outcomes
              </Typography>
              {selectedOutcomeIds.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  All tasks will be included (no outcome filter)
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selectedOutcomeIds.map((outcomeId) => {
                    const outcome = outcomes.find((o: any) => o.id === outcomeId);
                    return (
                      <Chip
                        key={outcomeId}
                        label={outcome?.name}
                        size="small"
                        variant="outlined"
                      />
                    );
                  })}
                </Box>
              )}
            </Paper>

            <FormControlLabel
              control={
                <Checkbox
                  checked={createPlanImmediately}
                  onChange={(e) => setCreatePlanImmediately(e.target.checked)}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    Create Adoption Plan Immediately
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Recommended: Creates tasks based on selected license and outcomes
                  </Typography>
                </Box>
              }
            />

            {createPlanImmediately && (
              <Alert severity="info" icon={<CheckCircle />} sx={{ mt: 2 }}>
                An adoption plan will be created automatically with tasks filtered by your license level
                and selected outcomes.
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={assigning || creatingPlan}>
          Cancel
        </Button>
        {step > 1 && (
          <Button onClick={handleBack} disabled={assigning || creatingPlan}>
            Back
          </Button>
        )}
        {step < 3 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={step === 1 && !selectedProductId}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleAssign}
            disabled={assigning || creatingPlan}
          >
            {assigning || creatingPlan ? 'Assigning...' : 'Assign Product'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
