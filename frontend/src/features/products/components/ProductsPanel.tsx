import * as React from 'react';
import { useState } from 'react';
import { gql, useQuery, useSubscription, useMutation, useApolloClient } from '@apollo/client';
import {
  List,
  ListItemButton,
  ListItemText,
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
import { License } from '@features/product-licenses';
import { Outcome } from '@features/product-outcomes';
import { Release } from '@features/product-releases';

const PRODUCTS = gql`query Products($first:Int,$after:String,$last:Int,$before:String){ 
  products(first:$first,after:$after,last:$last,before:$before){ 
    edges { 
      cursor 
      node { 
        id 
        name 
        statusPercent 
        description
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
            }
          }
        }
      } 
    } 
    pageInfo { hasNextPage hasPreviousPage startCursor endCursor } 
  } 
}`;
const PRODUCT_UPDATED = gql`subscription { productUpdated { id name statusPercent } }`;
const CREATE_PRODUCT = gql`mutation CreateProduct($input:ProductInput!){ createProduct(input:$input){ id name statusPercent } }`;
const UPDATE_PRODUCT = gql`mutation UpdateProduct($id:ID!,$input:ProductInput!){ updateProduct(id:$id,input:$input){ id name statusPercent } }`;
const DELETE_PRODUCT = gql`mutation DeleteProduct($id:ID!){ deleteProduct(id:$id) }`;

interface Props { onSelect: (id: string) => void }
export const ProductsPanel: React.FC<Props> = ({ onSelect }) => {
  const [sortBy, setSortBy] = useState<'lastModified' | 'name'>('lastModified');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('DESC');
  const [args, setArgs] = useState<{
    first?: number;
    after?: string | null;
    last?: number;
    before?: string | null;
  }>({
    first: 25
  });
  const { data, refetch } = useQuery(PRODUCTS, { variables: args });
  const [createProduct] = useMutation(CREATE_PRODUCT);
  const [updateProduct] = useMutation(UPDATE_PRODUCT);
  const [deleteProduct] = useMutation(DELETE_PRODUCT, { onCompleted: () => refetch() });
  useSubscription(PRODUCT_UPDATED, { onData: () => refetch() });
  const client = useApolloClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const conn = data?.products;

  // Extract timestamp from base64-encoded cursor
  const getCursorTimestamp = (cursor: string) => {
    try {
      const decoded = JSON.parse(atob(cursor));
      return decoded.createdAt ? new Date(decoded.createdAt).getTime() : 0;
    } catch (error) {
      return 0;
    }
  };

  // Client-side sorting of products
  const sortedProducts = React.useMemo(() => {
    if (!conn?.edges) return [];

    const products = [...conn.edges];

    return products.sort((a, b) => {
      if (sortBy === 'name') {
        const aName = a.node.name.toLowerCase();
        const bName = b.node.name.toLowerCase();
        const comparison = aName.localeCompare(bName);
        return sortDirection === 'ASC' ? comparison : -comparison;
      } else if (sortBy === 'lastModified') {
        const aTime = getCursorTimestamp(a.cursor);
        const bTime = getCursorTimestamp(b.cursor);
        return sortDirection === 'DESC' ? bTime - aTime : aTime - bTime;
      }
      return 0;
    });
  }, [conn?.edges, sortBy, sortDirection]);

  const loadNext = () => {
    if (conn?.pageInfo.endCursor) setArgs(prev => ({
      ...prev,
      first: 25,
      after: conn.pageInfo.endCursor,
      last: undefined,
      before: null
    }));
  };
  const loadPrev = () => {
    if (conn?.pageInfo.startCursor) setArgs(prev => ({
      ...prev,
      last: 25,
      before: conn.pageInfo.startCursor,
      first: undefined,
      after: null
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
    description?: string;
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
              description: data.description,
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
                  mutation: gql`mutation DeleteOutcome($id: ID!) { deleteOutcome(id: $id) }`,
                  variables: { id: outcome.id }
                });
                console.log(`Deleted outcome: ${outcome.name}`);
              } else if (outcome.isNew || !outcome.id) {
                // Create new outcome
                console.log(`Creating outcome: ${outcome.name}, productId: ${productId}`);
                const result = await client.mutate({
                  mutation: gql`
                    mutation CreateOutcome($input: OutcomeInput!) {
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
                    mutation UpdateOutcome($id: ID!, $input: OutcomeInput!) {
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
              description: data.description,
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
                    mutation CreateOutcome($input: OutcomeInput!) {
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
                mutation: gql`mutation DeleteLicense($id: ID!) { deleteLicense(id: $id) }`,
                variables: { id: license.id }
              });
              console.log(`Deleted license: ${license.name}`);
            } else if (license.isNew || !license.id) {
              // Create new license
              const licenseLevel = license.level || 1;
              console.log(`Creating license: ${license.name}, level: ${licenseLevel}, productId: ${productId}`);
              const result = await client.mutate({
                mutation: gql`
                  mutation CreateLicense($input: LicenseInput!) {
                    createLicense(input: $input) { id name description level isActive }
                  }
                `,
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
                mutation: gql`
                  mutation UpdateLicense($id: ID!, $input: LicenseInput!) {
                    updateLicense(id: $id, input: $input) { id name description level isActive }
                  }
                `,
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
                mutation: gql`mutation DeleteRelease($id: ID!) { deleteRelease(id: $id) }`,
                variables: { id: release.id }
              });
              console.log(`Deleted release: ${release.name}, result:`, deleteResult);
            } else if (release.isNew || !release.id) {
              // Create new release
              const releaseLevel = release.level !== undefined ? Number(release.level) : 1.0;
              console.log(`Creating release: ${release.name}, level: ${releaseLevel}, productId: ${productId}`);
              const result = await client.mutate({
                mutation: gql`
                  mutation CreateRelease($input: ReleaseInput!) {
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
                  mutation UpdateRelease($id: ID!, $input: ReleaseInput!) {
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

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Delete product "${name}"?`)) {
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
    }
  };
  return <Box>
    <Stack direction="row" spacing={1} px={1} pt={1} alignItems="center">
      <Button size="small" startIcon={<Add />} onClick={openCreateDialog}>Add Product</Button>

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
            onChange={(e) => setSortBy(e.target.value as 'lastModified' | 'name')}
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
            onChange={(e) => setSortDirection(e.target.value as 'ASC' | 'DESC')}
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
    <List dense>
      {sortedProducts.map((e: any) => (<ListItemButton key={e.node.id} onClick={() => onSelect(e.node.id)}>
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              {e.node.name}
              <Chip
                size="small"
                label={`${e.node.statusPercent}%`}
                color={e.node.statusPercent === 100 ? 'success' : e.node.statusPercent > 0 ? 'primary' : 'default'}
              />
            </Box>
          }
          secondary={
            <Box sx={{ mt: 0.5 }}>
              {/* Product info */}
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                <Tooltip title={`Last modified: ${new Date(getCursorTimestamp(e.cursor)).toLocaleString()}`}>
                  <Chip
                    icon={<Update />}
                    size="small"
                    label={`Modified ${formatDate(getCursorTimestamp(e.cursor))}`}
                    variant="outlined"
                    sx={{ fontSize: '0.7rem', height: '20px' }}
                  />
                </Tooltip>
                <Chip
                  size="small"
                  label={`${(e.node.tasks?.edges || []).length} tasks`}
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', height: '20px' }}
                />
                <Chip
                  size="small"
                  label={`${(e.node.licenses || []).length} licenses`}
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', height: '20px' }}
                />
              </Box>

              {/* Action buttons */}
              <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                <IconButton
                  size="small"
                  onClick={(ev) => { ev.stopPropagation(); openEditDialog(e.node); }}
                >
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={(ev) => { ev.stopPropagation(); handleDelete(e.node.id, e.node.name); }}
                  color="error"
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          }
        />
      </ListItemButton>))}
    </List>
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
      availableReleases={[]}
    />
  </Box>;
};
