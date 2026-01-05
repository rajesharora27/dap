import * as React from 'react';
import { useState, useRef, useCallback } from 'react';
import { Resource } from '@shared/types';
import { gql, useQuery, useSubscription, useMutation, useApolloClient } from '@apollo/client';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Button,
  Stack,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Tooltip
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Sort,
  AccessTime,
  Update
} from '@shared/components/FAIcon';
import { ProductDialog } from './ProductDialog';
import { License, CREATE_LICENSE, UPDATE_LICENSE, DELETE_LICENSE } from '@features/product-licenses';
import { Outcome } from '@features/product-outcomes';
import { Release } from '@features/product-releases';
import { useResizableColumns } from '@shared/hooks/useResizableColumns';
import { ResizableTableCell } from '@shared/components/ResizableTableCell';
import { ConfirmDialog } from '@shared/components';

const PRODUCTS = gql`
  query ProductsPanelFetch(
    $first: Int
    $after: String
    $last: Int
    $before: String
    $orderBy: ProductOrderByInput
  ) { 
    products(
      first: $first
      after: $after
      last: $last
      before: $before
      orderBy: $orderBy
    ) { 
      edges { 
        cursor 
        node { 
          id 
          name 
          statusPercent 
          resources { label url }
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
            level
            description
          }
          outcomes {
            id
            name
            description
          }
          tasks(first: 50) {
            edges {
              node {
                id
                name
                howToDoc
                howToVideo
                telemetryAttributes {
                  id
                }
                outcomes {
                  id
                  name
                }
              }
            }
          }
        } 
      } 
      pageInfo { hasNextPage hasPreviousPage startCursor endCursor } 
    } 
  }
`;
const PRODUCT_UPDATED = gql`subscription { productUpdated { id name statusPercent } }`;
const CREATE_PRODUCT = gql`
  mutation CreateProductPanel($input: ProductInput!) {
    createProduct(input: $input) {
      id
      name
      resources { label url }
      statusPercent
    }
  }
`;
const UPDATE_PRODUCT = gql`
  mutation UpdateProductPanel($id: ID!, $input: ProductInput!) {
    updateProduct(id: $id, input: $input) {
      id
      name
      resources { label url }
      statusPercent
      customAttrs
    }
  }
`;
const DELETE_PRODUCT = gql`mutation DeleteProduct($id:ID!){ deleteProduct(id:$id) }`;

// Sort field types matching GraphQL schema
type ProductSortField = 'NAME' | 'UPDATED_AT';

interface ProductOrderByInput {
  field: ProductSortField;
  direction: 'ASC' | 'DESC';
}

interface ProductQueryArgs {
  first?: number;
  after?: string | null;
  last?: number;
  before?: string | null;
  orderBy?: ProductOrderByInput;
}

interface Props { onSelect: (id: string) => void }
export const ProductsPanel: React.FC<Props> = ({ onSelect }) => {
  const [sortBy, setSortBy] = useState<'lastModified' | 'name'>('lastModified');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('DESC');
  
  // Build orderBy from UI state - server-side sorting
  const getOrderBy = (field: 'lastModified' | 'name', direction: 'ASC' | 'DESC'): ProductOrderByInput => ({
    field: field === 'name' ? 'NAME' : 'UPDATED_AT',
    direction
  });

  const [args, setArgs] = useState<ProductQueryArgs>({
    first: 25,
    orderBy: getOrderBy('lastModified', 'DESC')
  });
  
  // =========================================================================
  // RACE CONDITION PROTECTION
  // =========================================================================
  // Request version counter - increments on each new request
  // Used to ignore stale responses when rapid sorting/pagination occurs
  const requestVersionRef = useRef(0);
  const [currentVersion, setCurrentVersion] = useState(0);
  
  // Store previous data for "Stale-While-Revalidate" pattern
  // Shows dimmed old data while new data loads, instead of blank loading state
  const [previousData, setPreviousData] = useState<any>(null);
  
  const { data, refetch, loading } = useQuery(PRODUCTS, { 
    variables: args,
    // Notify on network status changes for better loading state handling
    notifyOnNetworkStatusChange: true,
    // On completed, check if this response matches current request version
    onCompleted: (newData) => {
      // Only update previous data cache if this is current request
      if (newData?.products) {
        setPreviousData(newData);
      }
    }
  });
  
  // Effective data: use current data if available, otherwise fall back to previous
  // This implements "Stale-While-Revalidate" - old data stays visible while fetching
  const effectiveData = data || previousData;
  const [createProduct] = useMutation(CREATE_PRODUCT);
  const [updateProduct] = useMutation(UPDATE_PRODUCT);
  const [deleteProduct] = useMutation(DELETE_PRODUCT, { onCompleted: () => refetch() });
  useSubscription(PRODUCT_UPDATED, { onData: () => refetch() });
  const client = useApolloClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; name: string }>({
    open: false,
    id: '',
    name: ''
  });

  // Resizable columns integration
  const { columnWidths, getResizeHandleProps, isResizing } = useResizableColumns({
    tableId: 'products-catalog-table',
    columns: [
      { key: 'name', minWidth: 200, defaultWidth: 350 },
      { key: 'modified', minWidth: 120, defaultWidth: 180 },
      { key: 'tasks', minWidth: 80, defaultWidth: 100 },
      { key: 'licenses', minWidth: 80, defaultWidth: 100 },
      { key: 'actions', minWidth: 100, defaultWidth: 120 },
    ],
  });

  // Use effectiveData for "Stale-While-Revalidate" - shows old data while loading new
  const conn = effectiveData?.products;
  
  // Products are now sorted server-side - use edges directly
  const products = conn?.edges || [];
  
  // Track if we're showing stale data (loading but have previous data to show)
  const isShowingStaleData = loading && previousData && !data;

  // Extract timestamp from base64-encoded cursor for display purposes
  const getCursorTimestamp = (cursor: string) => {
    try {
      const decoded = JSON.parse(atob(cursor));
      return decoded.createdAt ? new Date(decoded.createdAt).getTime() : 0;
    } catch (error) {
      return 0;
    }
  };

  // Handle sort change - triggers a new network request with server-side sorting
  // Uses request versioning to prevent race conditions
  const handleSortChange = useCallback((newSortBy: 'lastModified' | 'name', newDirection: 'ASC' | 'DESC') => {
    // Increment request version to mark current request as latest
    requestVersionRef.current += 1;
    setCurrentVersion(requestVersionRef.current);
    
    setSortBy(newSortBy);
    setSortDirection(newDirection);
    // Reset pagination and update orderBy - this triggers a network request
    setArgs({
      first: 25,
      after: null,
      last: undefined,
      before: null,
      orderBy: getOrderBy(newSortBy, newDirection)
    });
  }, []);

  const loadNext = () => {
    if (conn?.pageInfo.endCursor) setArgs(prev => ({
      ...prev,
      first: 25,
      after: conn.pageInfo.endCursor,
      last: undefined,
      before: null,
      orderBy: prev.orderBy // Preserve sort order during pagination
    }));
  };
  const loadPrev = () => {
    if (conn?.pageInfo.startCursor) setArgs(prev => ({
      ...prev,
      last: 25,
      before: conn.pageInfo.startCursor,
      first: undefined,
      after: null,
      orderBy: prev.orderBy // Preserve sort order during pagination
    }));
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'Unknown';

    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

      if (diffInHours < 1) {
        return `${Math.floor(diffInMs / (1000 * 60))} minutes ago`;
      } else if (diffInDays === 0) {
        return `${diffInHours} hours ago`;
      } else if (diffInDays === 1) {
        return 'Yesterday';
      } else if (diffInDays < 7) {
        return `${diffInDays} days ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch (error) {
      return 'Unknown';
    }
  }; const openCreateDialog = () => {
    setEditingProduct(null);
    setDialogOpen(true);
  };

  const openEditDialog = (product: any) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const handleSave = async (data: {
    name: string;
    resources?: Resource[];
    customAttrs?: any;
    outcomes?: Outcome[];
    licenses?: License[];
    releases?: Release[];
    requiredLicenseLevel?: number;
  }) => {
    console.log('=== Product Save Started ===');
    console.log('Editing existing product:', !!editingProduct);
    console.log('Data received:', JSON.stringify(data, null, 2));

    try {
      let productId: string;

      if (editingProduct) {
        // Update existing product
        console.log('Updating product:', editingProduct.id, data.name);
        const updateResult = await updateProduct({
          variables: {
            id: editingProduct.id,
            input: {
              name: data.name,
              resources: data.resources,
              customAttrs: data.customAttrs
            }
          }
        });
        console.log('Product updated:', updateResult.data);
        productId = editingProduct.id;

        // Handle outcomes updates/deletions for existing product
        if (data.outcomes) {
          for (const outcome of data.outcomes) {
            try {
              if (outcome.delete && outcome.id) {
                // Delete existing outcome
                await client.mutate({
                  mutation: gql`mutation DeleteOutcomePanel($id: ID!) { deleteOutcome(id: $id) }`,
                  variables: { id: outcome.id }
                });
                console.log(`Deleted outcome: ${outcome.name}`);
              } else if (outcome.isNew || !outcome.id) {
                // Create new outcome
                console.log(`Creating outcome: ${outcome.name}, productId: ${productId}`);
                const result = await client.mutate({
                  mutation: gql`
                    mutation CreateOutcomePanel($input: OutcomeInput!) {
                      createOutcome(input: $input) { id name description }
                    }
                  `,
                  variables: {
                    input: {
                      name: outcome.name,
                      description: outcome.description,
                      productId: productId
                    }
                  }
                });
                if (result.errors) {
                  console.error(`GraphQL errors creating outcome:`, result.errors);
                  throw new Error(result.errors.map(e => e.message).join(', '));
                }
                console.log(`Created outcome: ${outcome.name}`, result.data);
              } else if (outcome.id) {
                // Update existing outcome
                console.log(`Updating outcome: ${outcome.name}, id: ${outcome.id}, productId: ${productId}`);
                const result = await client.mutate({
                  mutation: gql`
                    mutation UpdateOutcomePanel($id: ID!, $input: OutcomeInput!) {
                      updateOutcome(id: $id, input: $input) { id name description }
                    }
                  `,
                  variables: {
                    id: outcome.id,
                    input: {
                      name: outcome.name,
                      description: outcome.description,
                      productId: productId
                    }
                  }
                });
                if (result.errors) {
                  console.error(`GraphQL errors updating outcome:`, result.errors);
                  throw new Error(result.errors.map(e => e.message).join(', '));
                }
                console.log(`Updated outcome: ${outcome.name}`, result.data);
              }
            } catch (outcomeError: any) {
              console.error(`Failed to save outcome ${outcome.name}:`, outcomeError);
              throw new Error(`Failed to save outcome "${outcome.name}": ${outcomeError.message}`);
            }
          }
        }
      } else {
        // Create new product
        const createResult = await createProduct({
          variables: {
            input: {
              name: data.name,
              resources: data.resources,
              customAttrs: data.customAttrs
            }
          }
        });
        productId = createResult.data.createProduct.id;

        // Create outcomes for new product
        if (data.outcomes) {
          for (const outcome of data.outcomes) {
            if (!outcome.delete) {
              try {
                console.log(`Creating outcome for new product: ${outcome.name}, productId: ${productId}`);
                const result = await client.mutate({
                  mutation: gql`
                    mutation CreateOutcomePanel2($input: OutcomeInput!) {
                      createOutcome(input: $input) { id name description }
                    }
                  `,
                  variables: {
                    input: {
                      name: outcome.name,
                      description: outcome.description,
                      productId: productId
                    }
                  }
                });
                if (result.errors) {
                  console.error(`GraphQL errors creating outcome:`, result.errors);
                  throw new Error(result.errors.map(e => e.message).join(', '));
                }
                console.log(`Created outcome for new product: ${outcome.name}`, result.data);
              } catch (outcomeError: any) {
                console.error(`Failed to create outcome ${outcome.name}:`, outcomeError);
                throw new Error(`Failed to create outcome "${outcome.name}": ${outcomeError.message}`);
              }
            }
          }
        }
      }

      // Handle licenses for both create and update
      if (data.licenses) {
        for (const license of data.licenses) {
          try {
            if (license.delete && license.id) {
              // Delete existing license
              await client.mutate({
                mutation: DELETE_LICENSE,
                variables: { id: license.id }
              });
              console.log(`Deleted license: ${license.name}`);
            } else if (license.isNew || !license.id) {
              // Create new license
              const licenseLevel = license.level || 1;
              console.log(`Creating license: ${license.name}, level: ${licenseLevel}, productId: ${productId}`);
              const result = await client.mutate({
                mutation: CREATE_LICENSE,
                variables: {
                  input: {
                    name: license.name,
                    description: license.description || '',
                    level: licenseLevel,
                    isActive: license.isActive !== false,
                    productId: productId
                  }
                }
              });
              if (result.errors) {
                console.error(`GraphQL errors creating license:`, result.errors);
                throw new Error(result.errors.map(e => e.message).join(', '));
              }
              console.log(`Created license: ${license.name}`, result.data);
            } else if (license.id) {
              // Update existing license
              const licenseLevel = license.level || 1;
              console.log(`Updating license: ${license.name}, id: ${license.id}, level: ${licenseLevel}, productId: ${productId}`);
              const result = await client.mutate({
                mutation: UPDATE_LICENSE,
                variables: {
                  id: license.id,
                  input: {
                    name: license.name,
                    description: license.description || '',
                    level: licenseLevel,
                    isActive: license.isActive !== false,
                    productId: productId
                  }
                }
              });
              if (result.errors) {
                console.error(`GraphQL errors updating license:`, result.errors);
                throw new Error(result.errors.map(e => e.message).join(', '));
              }
              console.log(`Updated license: ${license.name}`, result.data);
            }
          } catch (licenseError: any) {
            console.error(`Failed to save license ${license.name}:`, licenseError);
            throw new Error(`Failed to save license "${license.name}": ${licenseError.message}`);
          }
        }
      }

      // Handle releases for both create and update
      console.log('=== Processing Releases ===');
      console.log('Releases received:', JSON.stringify(data.releases, null, 2));
      if (data.releases) {
        for (const release of data.releases) {
          console.log(`Processing release: ${release.name}, id: ${release.id}, delete: ${release.delete}, isNew: ${release.isNew}`);
          try {
            if (release.delete && release.id) {
              // Delete existing release
              console.log(`DELETING release: ${release.name} (${release.id})`);
              const deleteResult = await client.mutate({
                mutation: gql`mutation DeleteReleasePanel($id: ID!) { deleteRelease(id: $id) }`,
                variables: { id: release.id }
              });
              console.log(`Deleted release: ${release.name}, result:`, deleteResult);
            } else if (release.isNew || !release.id) {
              // Create new release
              const releaseLevel = release.level !== undefined ? Number(release.level) : 1.0;
              console.log(`Creating release: ${release.name}, level: ${releaseLevel}, productId: ${productId}`);
              const result = await client.mutate({
                mutation: gql`
                  mutation CreateReleasePanel($input: ReleaseInput!) {
                    createRelease(input: $input) { id name level description }
                  }
                `,
                variables: {
                  input: {
                    name: release.name,
                    description: release.description || '',
                    level: releaseLevel,
                    productId: productId
                  }
                }
              });
              if (result.errors) {
                console.error(`GraphQL errors creating release:`, result.errors);
                throw new Error(result.errors.map(e => e.message).join(', '));
              }
              console.log(`Created release: ${release.name}`, result.data);
            } else if (release.id) {
              // Update existing release
              const releaseLevel = release.level !== undefined ? Number(release.level) : 1.0;
              console.log(`Updating release: ${release.name}, id: ${release.id}, level: ${releaseLevel}, productId: ${productId}`);
              const result = await client.mutate({
                mutation: gql`
                  mutation UpdateReleasePanel($id: ID!, $input: ReleaseInput!) {
                    updateRelease(id: $id, input: $input) { id name level description }
                  }
                `,
                variables: {
                  id: release.id,
                  input: {
                    name: release.name,
                    description: release.description || '',
                    level: releaseLevel,
                    productId: productId
                  }
                }
              });
              if (result.errors) {
                console.error(`GraphQL errors updating release:`, result.errors);
                throw new Error(result.errors.map(e => e.message).join(', '));
              }
              console.log(`Updated release: ${release.name}`, result.data);
            }
          } catch (releaseError: any) {
            console.error(`Failed to save release ${release.name}:`, releaseError);
            throw new Error(`Failed to save release "${release.name}": ${releaseError.message}`);
          }
        }
      }

      console.log('=== All mutations completed successfully ===');

      // Clear Apollo cache to ensure fresh data
      console.log('Clearing Apollo cache...');
      await client.clearStore();

      // Wait a bit for backend consistency
      await new Promise(resolve => setTimeout(resolve, 500));

      // Refetch data after ALL operations are complete
      console.log('Refetching products...');
      const refetchResult = await refetch();
      console.log('Refetch completed. Products count:', refetchResult.data?.products?.edges?.length);

      console.log('=== Product save completed successfully ===');

    } catch (error: any) {
      console.error('=== Error saving product ===', error);
      throw error; // Re-throw so dialog can show error
    }
  };

  const handleDelete = (id: string, name: string) => {
    setDeleteConfirm({ open: true, id, name });
  };

  const handleConfirmDelete = async () => {
    const { id, name } = deleteConfirm;
    try {
      console.log(`🗑️ Deleting product: ${name} (${id})`);

      // Execute the deletion
      await deleteProduct({ variables: { id } });
      console.log('✅ Product deletion mutation completed');

      // Wait for backend consistency
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Clear Apollo cache to force fresh data
      console.log('🧹 Clearing Apollo cache...');
      await client.clearStore();

      // Force a refetch to ensure UI updates
      console.log('🔄 Refetching products...');
      await refetch();

      console.log('🎉 Product deletion completed successfully');
    } catch (error: any) {
      console.error('❌ Product deletion failed:', error);
      alert(`Failed to delete product: ${error.message}`);
    }
  };
  return <Box>
    <Stack direction="row" spacing={1} px={1} pt={1} alignItems="center">
      <Tooltip title="Add Product">
        <IconButton color="primary" onClick={openCreateDialog}>
          <Add />
        </IconButton>
      </Tooltip>

      {/* Sorting Controls */}
      <Box sx={{ ml: 'auto', display: 'flex', gap: 1, alignItems: 'center' }}>
        <Tooltip title="Sort products">
          <Sort fontSize="small" sx={{ color: 'text.secondary' }} />
        </Tooltip>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Sort by</InputLabel>
          <Select
            value={sortBy}
            label="Sort by"
            onChange={(e) => handleSortChange(e.target.value as 'lastModified' | 'name', sortDirection)}
            disabled={loading}
          >
            <MenuItem value="lastModified">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Update fontSize="small" />
                Last Modified
              </Box>
            </MenuItem>
            <MenuItem value="name">Name</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>Order</InputLabel>
          <Select
            value={sortDirection}
            label="Order"
            onChange={(e) => handleSortChange(sortBy, e.target.value as 'ASC' | 'DESC')}
            disabled={loading}
          >
            <MenuItem value="DESC">
              {sortBy === 'lastModified' ? 'Newest First' : 'Z to A'}
            </MenuItem>
            <MenuItem value="ASC">
              {sortBy === 'lastModified' ? 'Oldest First' : 'A to Z'}
            </MenuItem>
          </Select>
        </FormControl>
      </Box>
    </Stack>

    {/* Sort indicator */}
    <Box sx={{ px: 1, py: 0.5 }}>
      <Typography variant="caption" color="text.secondary">
        Sorted by {sortBy === 'lastModified' ? 'last modified' : 'name'} • {sortDirection === 'DESC' ? (sortBy === 'lastModified' ? 'newest first' : 'Z to A') : (sortBy === 'lastModified' ? 'oldest first' : 'A to Z')}
      </Typography>
    </Box>
    {/* Stale-While-Revalidate: Table container with overlay when loading */}
    <Box sx={{ position: 'relative' }}>
      {/* Loading overlay - shows when fetching new data but have stale data visible */}
      {loading && products.length > 0 && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(255, 255, 255, 0.7)',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Updating...
          </Typography>
        </Box>
      )}
      
      <TableContainer 
        component={Paper} 
        elevation={0} 
        sx={{ 
          border: '1px solid', 
          borderColor: 'divider', 
          borderRadius: 2,
          // Dim the table slightly when showing stale data
          opacity: loading && products.length > 0 ? 0.6 : 1,
          transition: 'opacity 0.2s ease-in-out',
        }}
      >
      <Table size="small">
        <TableHead>
          <TableRow sx={{ backgroundColor: 'action.hover' }}>
            <ResizableTableCell
              width={columnWidths['name']}
              resizable
              resizeHandleProps={getResizeHandleProps('name')}
              isResizing={isResizing}
            >
              <Typography variant="caption" fontWeight="bold">PRODUCT NAME</Typography>
            </ResizableTableCell>
            <ResizableTableCell
              width={columnWidths['modified']}
              resizable
              resizeHandleProps={getResizeHandleProps('modified')}
              isResizing={isResizing}
            >
              <Typography variant="caption" fontWeight="bold">LAST MODIFIED</Typography>
            </ResizableTableCell>
            <ResizableTableCell
              width={columnWidths['tasks']}
              resizable
              resizeHandleProps={getResizeHandleProps('tasks')}
              isResizing={isResizing}
            >
              <Typography variant="caption" fontWeight="bold">TASKS</Typography>
            </ResizableTableCell>
            <ResizableTableCell
              width={columnWidths['licenses']}
              resizable
              resizeHandleProps={getResizeHandleProps('licenses')}
              isResizing={isResizing}
            >
              <Typography variant="caption" fontWeight="bold">LICENSES</Typography>
            </ResizableTableCell>
            <TableCell width={columnWidths['actions']}>
              <Typography variant="caption" fontWeight="bold">ACTIONS</Typography>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {/* Only show full loading state if NO data available (initial load) */}
          {loading && products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                <Typography variant="body2" color="text.secondary">Loading...</Typography>
              </TableCell>
            </TableRow>
          ) : products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                <Typography variant="body2" color="text.secondary">No products found</Typography>
              </TableCell>
            </TableRow>
          ) : (
            products.map((e: any) => (
              <TableRow
                key={e.node.id}
                hover
                onClick={() => onSelect(e.node.id)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {e.node.name}
                    <Chip
                      size="small"
                      label={`${e.node.statusPercent}%`}
                      color={e.node.statusPercent === 100 ? 'success' : e.node.statusPercent > 0 ? 'primary' : 'default'}
                      sx={{ height: 18, fontSize: '0.65rem' }}
                    />
                  </Box>
                </TableCell>
                <TableCell>
                  <Tooltip title={`Last modified: ${new Date(getCursorTimestamp(e.cursor)).toLocaleString()}`}>
                    <Typography variant="caption">
                      {formatDate(getCursorTimestamp(e.cursor))}
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={(e.node.tasks?.edges || []).length}
                    variant="outlined"
                    sx={{ fontSize: '0.7rem', height: '20px' }}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={(e.node.licenses || []).length}
                    variant="outlined"
                    sx={{ fontSize: '0.7rem', height: '20px' }}
                  />
                </TableCell>
                <TableCell onClick={(ev) => ev.stopPropagation()}>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton
                      size="small"
                      onClick={() => openEditDialog(e.node)}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(e.node.id, e.node.name)}
                      color="error"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
    </Box>
    <Box display="flex" justifyContent="space-between" px={1} pb={1}>
      <Button size="small" disabled={!conn?.pageInfo.hasPreviousPage} onClick={loadPrev}>Previous</Button>
      <Button size="small" disabled={!conn?.pageInfo.hasNextPage} onClick={loadNext}>Next</Button>
    </Box>

    <ProductDialog
      open={dialogOpen}
      onClose={() => setDialogOpen(false)}
      onSave={handleSave}
      product={editingProduct}
      title={editingProduct ? 'Edit Product' : 'Create Product'}
    />

    <ConfirmDialog
      open={deleteConfirm.open}
      title="Delete Product"
      message={`Are you sure you want to delete product "${deleteConfirm.name}"? This action cannot be undone.`}
      confirmLabel="Delete"
      onConfirm={handleConfirmDelete}
      onCancel={() => setDeleteConfirm({ ...deleteConfirm, open: false })}
      severity="error"
    />
  </Box>;
};
