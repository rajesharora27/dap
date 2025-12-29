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
  TextField,
} from '@mui/material';
import { CheckCircle } from '@shared/components/FAIcon';
import { ALL_OUTCOMES_ID, ALL_RELEASES_ID } from '@features/tasks';

const GET_PRODUCTS_AND_OUTCOMES = gql`
  query GetProductsAndOutcomes {
    products(first: 100) {
      edges {
        node {
          id
          name
          resources { label url }
          licenses {
            id
            name
            level
            isActive
          }
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

const GET_RELEASES_FOR_PRODUCT = gql`
  query GetReleasesForProduct($productId: ID!) {
    releases(productId: $productId) {
      id
      name
      level
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
      selectedReleases {
        id
        name
      }
      product {
        id
        name
      }
      adoptionPlan {
        id
        progressPercentage
        totalTasks
        completedTasks
      }
    }
  }
`;

const CREATE_ADOPTION_PLAN = gql`
  mutation CreateAdoptionPlan($customerProductId: ID!) {
    createAdoptionPlan(customerProductId: $customerProductId) {
      id
      totalTasks
      completedTasks
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
  const [productName, setProductName] = useState('');
  const [licenseLevel, setLicenseLevel] = useState<'Essential' | 'Advantage' | 'Signature'>('Essential');
  const [selectedOutcomeIds, setSelectedOutcomeIds] = useState<string[]>([]);
  const [selectedReleaseIds, setSelectedReleaseIds] = useState<string[]>([]);
  const [createPlanImmediately, setCreatePlanImmediately] = useState(true);
  const [step, setStep] = useState(1); // 1: Select Product, 2: Configure, 3: Confirm

  const { data: productsData, loading: productsLoading, error: productsError } = useQuery(GET_PRODUCTS_AND_OUTCOMES);

  const { data: outcomesData, loading: outcomesLoading } = useQuery(GET_OUTCOMES_FOR_PRODUCT, {
    variables: { productId: selectedProductId },
    skip: !selectedProductId,
  });

  const { data: releasesData, loading: releasesLoading } = useQuery(GET_RELEASES_FOR_PRODUCT, {
    variables: { productId: selectedProductId },
    skip: !selectedProductId,
  });

  // Debug logging - Enhanced
  useEffect(() => {
    if (productsError) {
      console.error('❌ Products loading error:', productsError);
    }
    if (productsData) {
      if (productsData.products?.edges) {
        productsData.products.edges.forEach((edge: any, idx: number) => {
          console.log(`Edge ${idx}:`, edge);
        });
      }
    }
  }, [productsData, productsError]);

  const [assignProduct, { loading: assigning }] = useMutation(ASSIGN_PRODUCT_TO_CUSTOMER, {
    refetchQueries: ['GetCustomers'],
    awaitRefetchQueries: true,
  });
  const [createAdoptionPlan, { loading: creatingPlan }] = useMutation(CREATE_ADOPTION_PLAN, {
    refetchQueries: ['GetCustomers'],
    awaitRefetchQueries: true,
  });

  // Map products from edges, filtering out any null/undefined nodes
  // CRITICAL FIX: Handle both edge.node structure and direct array structure
  const products = React.useMemo(() => {
    if (!productsData?.products) {
      console.log('⚠️ No products data found');
      return [];
    }

    // Handle connection-style response (edges with nodes)
    if (productsData.products.edges) {
      const mapped = productsData.products.edges
        .map((e: any, index: number) => {
          // Handle case where edge itself might be the product
          if (e && e.id && !e.node) {
            console.log(`Edge ${index} is direct product:`, e.id);
            return e;
          }
          // Handle standard edge.node structure
          if (e && e.node) {
            if (!e.node.id) {
              console.warn(`⚠️ Edge ${index} node missing id:`, e.node);
              return null;
            }
            return e.node;
          }
          console.warn(`⚠️ Edge ${index} is invalid:`, e);
          return null;
        })
        .filter((node: any) => {
          const isValid = node != null && node.id;
          if (!isValid && node !== null) {
            console.warn('⚠️ Filtered out invalid node:', node);
          }
          return isValid;
        });
      if (mapped.length > 0) {
        console.log('📝 Sample product:', mapped[0]);
      } else {
        console.warn('⚠️ No valid products after mapping!');
        console.warn('Raw edges data:', productsData.products.edges);
      }
      return mapped;
    }

    // Handle direct array response (fallback)
    if (Array.isArray(productsData.products)) {
      console.log('📦 Products is direct array, count:', productsData.products.length);
      return productsData.products.filter((p: any) => p && p.id);
    }

    console.warn('⚠️ Unknown products data structure:', productsData.products);
    return [];
  }, [productsData]);

  // Additional debug effect
  useEffect(() => {
    if (products.length > 0) {
    }
  }, [products]);
  const outcomes = outcomesData?.outcomes || [];
  const releases = releasesData?.releases || [];
  const selectedProduct = products.find((p: any) => p.id === selectedProductId);

  // Get available licenses for selected product
  const availableLicenses = selectedProduct?.licenses?.filter((l: any) => l.isActive) || [];

  // Helper function to extract license level enum from license name
  const extractLicenseLevel = (licenseName: string): 'Essential' | 'Advantage' | 'Signature' => {
    const name = licenseName.toLowerCase();
    if (name.includes('signature')) return 'Signature';
    if (name.includes('advantage')) return 'Advantage';
    return 'Essential'; // Default fallback
  };

  useEffect(() => {
    if (!open) {
      // Reset form when dialog closes
      setSelectedProductId('');
      setProductName('');
      setLicenseLevel('Essential');
      setSelectedOutcomeIds([]);
      setSelectedReleaseIds([]);
      setCreatePlanImmediately(true);
      setStep(1);
    }
  }, [open]);

  // Reset license level when product changes
  useEffect(() => {
    if (selectedProductId && availableLicenses.length > 0) {
      // Extract license level from first available license name
      setLicenseLevel(extractLicenseLevel(availableLicenses[0].name));
    }
  }, [selectedProductId, availableLicenses.length]);

  const handleOutcomeToggle = (outcomeId: string) => {
    if (outcomeId === ALL_OUTCOMES_ID) {
      // Toggle "All" - if selected, deselect all; if not selected, select only "All"
      if (selectedOutcomeIds.includes(ALL_OUTCOMES_ID)) {
        setSelectedOutcomeIds([]);
      } else {
        setSelectedOutcomeIds([ALL_OUTCOMES_ID]);
      }
    } else {
      // Toggle individual outcome
      setSelectedOutcomeIds((prev) => {
        // Remove "All" if present
        const withoutAll = prev.filter(id => id !== ALL_OUTCOMES_ID);
        // Toggle the clicked outcome
        return withoutAll.includes(outcomeId)
          ? withoutAll.filter((id) => id !== outcomeId)
          : [...withoutAll, outcomeId];
      });
    }
  };

  const handleReleaseToggle = (releaseId: string) => {
    if (releaseId === ALL_RELEASES_ID) {
      // Toggle "All" - if selected, deselect all; if not selected, select only "All"
      if (selectedReleaseIds.includes(ALL_RELEASES_ID)) {
        setSelectedReleaseIds([]);
      } else {
        setSelectedReleaseIds([ALL_RELEASES_ID]);
      }
    } else {
      // Toggle individual release
      setSelectedReleaseIds((prev) => {
        // Remove "All" if present
        const withoutAll = prev.filter(id => id !== ALL_RELEASES_ID);
        // Toggle the clicked release
        return withoutAll.includes(releaseId)
          ? withoutAll.filter((id) => id !== releaseId)
          : [...withoutAll, releaseId];
      });
    }
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
      // Filter out special "All" markers before sending to backend
      // If "All" is selected, send empty array (backend treats this as "applies to all")
      const filteredOutcomes = selectedOutcomeIds.filter(id => id !== ALL_OUTCOMES_ID);
      const filteredReleases = selectedReleaseIds.filter(id => id !== ALL_RELEASES_ID);

      // Step 1: Assign product to customer
      const { data } = await assignProduct({
        variables: {
          input: {
            customerId,
            productId: selectedProductId,
            name: productName.trim(), // Required field
            licenseLevel,
            selectedOutcomeIds: filteredOutcomes,
            selectedReleaseIds: filteredReleases,
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          maxHeight: '90vh', // Limit dialog height
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <DialogTitle>
        Assign Product to Customer
        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
          Step {step} of 3
        </Typography>
      </DialogTitle>

      <DialogContent
        sx={{
          flex: 1,
          overflowY: 'auto', // Allow scrolling
          overflowX: 'hidden',
          pb: 2, // Padding at bottom
        }}
      >
        {/* Step 1: Select Product */}
        {step === 1 && (
          <Box sx={{ mt: 2, position: 'relative', zIndex: 1 }}>
            <Typography variant="h6" gutterBottom>
              Select Product
            </Typography>
            {productsLoading ? (
              <Box sx={{ mt: 2 }}>
                <LinearProgress />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Loading products...
                </Typography>
              </Box>
            ) : productsError ? (
              <Alert severity="error" sx={{ mt: 2 }}>
                Error loading products: {productsError.message}
              </Alert>
            ) : products.length === 0 ? (
              <Alert severity="warning" sx={{ mt: 2 }}>
                No products available. Please create a product first.
              </Alert>
            ) : (
              <Box sx={{ mt: 2 }}>
                <Alert severity="success" icon={false} sx={{ mb: 2, py: 0.5 }}>
                  ✅ {products.length} products available
                </Alert>

                {/* Simple Select Dropdown with forced visibility */}
                <FormControl fullWidth required>
                  <InputLabel id="product-label">Product</InputLabel>
                  <Select
                    labelId="product-label"
                    id="product-select"
                    value={selectedProductId}
                    label="Product"
                    onChange={(e) => {
                      setSelectedProductId(e.target.value);
                    }}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 300,
                        },
                      },
                      anchorOrigin: {
                        vertical: 'bottom',
                        horizontal: 'left',
                      },
                      transformOrigin: {
                        vertical: 'top',
                        horizontal: 'left',
                      },
                      disablePortal: false,
                    }}
                  >
                    {products.map((product: any) => {
                      return (
                        <MenuItem
                          key={product.id}
                          value={product.id}
                        >
                          <Box sx={{ width: '100%' }}>
                            <Typography variant="body1" fontWeight={500}>
                              {product.name}
                            </Typography>
                            {product.resources && product.resources.length > 0 && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                {product.resources.length} resources
                              </Typography>
                            )}
                          </Box>
                        </MenuItem>
                      );
                    })}
                  </Select>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    {products.length} products available
                  </Typography>
                </FormControl>
              </Box>
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
                {selectedProduct.resources && selectedProduct.resources.length > 0 && (
                  <Typography variant="body2" color="text.secondary">
                    {selectedProduct.resources.length} resources
                  </Typography>
                )}
              </Box>
            )}

            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              Assignment Name *
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Give this product assignment a name to distinguish it from other assignments of the same product (e.g., "Production", "Development", "QA Environment")
            </Typography>
            <TextField
              fullWidth
              required
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g., Production Environment"
              sx={{ mb: 3 }}
              size="small"
              error={productName.trim() === ''}
              helperText={productName.trim() === '' ? 'Assignment name is required' : ''}
            />

            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              License Level
            </Typography>
            {availableLicenses.length === 0 ? (
              <Alert severity="warning" sx={{ mb: 3 }}>
                No active licenses configured for this product. Please configure licenses first.
              </Alert>
            ) : (
              <FormControl fullWidth sx={{ mb: 3 }}>
                <Select
                  value={licenseLevel}
                  onChange={(e) => setLicenseLevel(e.target.value as any)}
                >
                  {availableLicenses.map((license: any) => {
                    const levelEnum = extractLicenseLevel(license.name);
                    return (
                      <MenuItem key={license.id} value={levelEnum}>
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {license.name}
                          </Typography>
                          {license.description && (
                            <Typography variant="caption" color="text.secondary">
                              {license.description}
                            </Typography>
                          )}
                        </Box>
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            )}

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
                  {/* "All Outcomes" option */}
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedOutcomeIds.includes(ALL_OUTCOMES_ID)}
                        onChange={() => handleOutcomeToggle(ALL_OUTCOMES_ID)}
                        sx={{
                          color: selectedOutcomeIds.includes(ALL_OUTCOMES_ID) ? 'success.main' : 'default',
                          '&.Mui-checked': {
                            color: 'success.main',
                          }
                        }}
                      />
                    }
                    label={
                      <Box sx={{ borderBottom: selectedOutcomeIds.includes(ALL_OUTCOMES_ID) ? '2px solid' : '2px solid', borderColor: selectedOutcomeIds.includes(ALL_OUTCOMES_ID) ? 'success.main' : 'divider', pb: 1, mb: 1 }}>
                        <Typography variant="body2" fontWeight={700} color={selectedOutcomeIds.includes(ALL_OUTCOMES_ID) ? 'success.main' : 'text.primary'}>
                          All Outcomes
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Include tasks for all outcomes (wildcard)
                        </Typography>
                      </Box>
                    }
                  />

                  {/* Individual outcomes */}
                  {outcomes.map((outcome: any) => (
                    <FormControlLabel
                      key={outcome.id}
                      control={
                        <Checkbox
                          checked={selectedOutcomeIds.includes(outcome.id)}
                          onChange={() => handleOutcomeToggle(outcome.id)}
                          disabled={selectedOutcomeIds.includes(ALL_OUTCOMES_ID)}
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
                  {selectedOutcomeIds.includes(ALL_OUTCOMES_ID)
                    ? 'All outcomes selected (wildcard)'
                    : selectedOutcomeIds.length === 0
                      ? 'No outcomes selected - all tasks will be included'
                      : `${selectedOutcomeIds.length} outcome(s) selected`}
                </Typography>
              </Paper>
            )}

            <Typography variant="subtitle1" fontWeight="medium" gutterBottom sx={{ mt: 3 }}>
              Product Releases
            </Typography>
            {releasesLoading ? (
              <LinearProgress />
            ) : releases.length === 0 ? (
              <Alert severity="info">
                No releases defined for this product. All tasks will be included in the adoption plan.
              </Alert>
            ) : (
              <Paper variant="outlined" sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
                <FormGroup>
                  {/* "All Releases" option */}
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedReleaseIds.includes(ALL_RELEASES_ID)}
                        onChange={() => handleReleaseToggle(ALL_RELEASES_ID)}
                        sx={{
                          color: selectedReleaseIds.includes(ALL_RELEASES_ID) ? 'primary.main' : 'default',
                          '&.Mui-checked': {
                            color: 'primary.main',
                          }
                        }}
                      />
                    }
                    label={
                      <Box sx={{ borderBottom: selectedReleaseIds.includes(ALL_RELEASES_ID) ? '2px solid' : '2px solid', borderColor: selectedReleaseIds.includes(ALL_RELEASES_ID) ? 'primary.main' : 'divider', pb: 1, mb: 1 }}>
                        <Typography variant="body2" fontWeight={700} color={selectedReleaseIds.includes(ALL_RELEASES_ID) ? 'primary.main' : 'text.primary'}>
                          All Releases
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Include tasks for all releases (wildcard)
                        </Typography>
                      </Box>
                    }
                  />

                  {/* Individual releases */}
                  {releases.map((release: any) => (
                    <FormControlLabel
                      key={release.id}
                      control={
                        <Checkbox
                          checked={selectedReleaseIds.includes(release.id)}
                          onChange={() => handleReleaseToggle(release.id)}
                          disabled={selectedReleaseIds.includes(ALL_RELEASES_ID)}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {release.name}
                          </Typography>
                          {release.description && (
                            <Typography variant="caption" color="text.secondary">
                              {release.description}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  ))}
                </FormGroup>
                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" color="text.secondary">
                  {selectedReleaseIds.includes(ALL_RELEASES_ID)
                    ? 'All releases selected (wildcard)'
                    : selectedReleaseIds.length === 0
                      ? 'No releases selected - all tasks will be included'
                      : `${selectedReleaseIds.length} release(s) selected`}
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

              {productName && (
                <>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                    Assignment Name
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {productName}
                  </Typography>
                </>
              )}

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
              {selectedOutcomeIds.length === 0 || selectedOutcomeIds.includes(ALL_OUTCOMES_ID) ? (
                <Chip
                  label={selectedOutcomeIds.includes(ALL_OUTCOMES_ID) ? "All Outcomes (Wildcard)" : "All tasks (no filter)"}
                  color="success"
                  size="small"
                  sx={{ fontWeight: selectedOutcomeIds.includes(ALL_OUTCOMES_ID) ? 700 : 400 }}
                />
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

              <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                Selected Releases
              </Typography>
              {selectedReleaseIds.length === 0 || selectedReleaseIds.includes(ALL_RELEASES_ID) ? (
                <Chip
                  label={selectedReleaseIds.includes(ALL_RELEASES_ID) ? "All Releases (Wildcard)" : "All tasks (no filter)"}
                  color="primary"
                  size="small"
                  sx={{ fontWeight: selectedReleaseIds.includes(ALL_RELEASES_ID) ? 700 : 400 }}
                />
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selectedReleaseIds.map((releaseId) => {
                    const release = releases.find((r: any) => r.id === releaseId);
                    return (
                      <Chip
                        key={releaseId}
                        label={release?.name}
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
                An adoption plan will be created automatically with tasks filtered by your license level,
                selected outcomes, and selected releases.
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          borderTop: 1,
          borderColor: 'divider',
          px: 3,
          py: 2,
          position: 'sticky',
          bottom: 0,
          backgroundColor: 'background.paper',
          zIndex: 1,
        }}
      >
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
            disabled={(step === 1 && !selectedProductId) || (step === 2 && productName.trim() === '')}
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
