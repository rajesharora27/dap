import * as React from 'react';
import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Card,
  CardContent,
  TableContainer
} from '@mui/material';
import {
  ArrowBack,
  Add,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileUpload as FileUploadIcon,
  FileDownload as FileDownloadIcon
} from '@mui/icons-material';
import { gql, useQuery, useMutation, useApolloClient } from '@apollo/client';

const OUTCOMES_FOR_PRODUCT = gql`
  query OutcomesForProduct($productId: ID!) {
    outcomes(productId: $productId) {
      id
      name
      description
      product {
        id
        name
      }
    }
  }
`;

const TASKS_FOR_PRODUCT = gql`
  query TasksForProduct($productId: ID!) {
    tasks(productId: $productId, first: 100) {
      edges {
        node {
          id
          name
          licenseLevel
          howToDoc
          howToVideo
          outcomes {
            id
            name
          }
        }
      }
    }
  }
`;

const CREATE_OUTCOME = gql`
  mutation CreateOutcome($input: OutcomeInput!) {
    createOutcome(input: $input) {
      id
      name
      description
      product {
        id
        name
      }
    }
  }
`;

const UPDATE_OUTCOME = gql`
  mutation UpdateOutcome($id: ID!, $input: OutcomeInput!) {
    updateOutcome(id: $id, input: $input) {
      id
      name
      description
      product {
        id
        name
      }
    }
  }
`;

const DELETE_OUTCOME = gql`
  mutation DeleteOutcome($id: ID!) {
    deleteOutcome(id: $id)
  }
`;

const LICENSES_FOR_PRODUCT = gql`
  query LicensesForProduct($productId: ID!) {
    product(id: $productId) {
      id
      licenses {
        id
        name
        description
        level
        isActive
      }
    }
  }
`;

const RELEASES_FOR_PRODUCT = gql`
  query ReleasesForProduct($productId: ID!) {
    product(id: $productId) {
      id
      releases {
        id
        name
        description
        level
        isActive
      }
    }
  }
`;

const CREATE_LICENSE = gql`
  mutation CreateLicense($input: LicenseInput!) {
    createLicense(input: $input) {
      id
      name
      description
      level
      isActive
    }
  }
`;

const UPDATE_LICENSE = gql`
  mutation UpdateLicense($id: ID!, $input: LicenseInput!) {
    updateLicense(id: $id, input: $input) {
      id
      name
      description
      level
      isActive
    }
  }
`;

const DELETE_LICENSE = gql`
  mutation DeleteLicense($id: ID!) {
    deleteLicense(id: $id)
  }
`;

const CREATE_RELEASE = gql`
  mutation CreateRelease($input: ReleaseInput!) {
    createRelease(input: $input) {
      id
      name
      description
      level
      isActive
    }
  }
`;

const UPDATE_RELEASE = gql`
  mutation UpdateRelease($id: ID!, $input: ReleaseInput!) {
    updateRelease(id: $id, input: $input) {
      id
      name
      description
      level
      isActive
    }
  }
`;

const DELETE_RELEASE = gql`
  mutation DeleteRelease($id: ID!) {
    deleteRelease(id: $id)
  }
`;


const UPDATE_TASK = gql`
  mutation UpdateTask($id: ID!, $input: TaskInput!) {
    updateTask(id: $id, input: $input) {
      id
      name
      description  
      weight
      estMinutes
      licenseLevel
      howToDoc
      howToVideo
      availableInReleases {
        id
        name
        level
      }
    }
  }
`;

const DELETE_TASK = gql`
  mutation DeleteTask($id: ID!) {
    deleteTask(id: $id)
  }
`;

const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($id: ID!, $input: ProductInput!) {
    updateProduct(id: $id, input: $input) {
      id
      name
      description
      customAttrs
    }
  }
`;

const CREATE_PRODUCT = gql`
  mutation CreateProduct($input: ProductInput!) {
    createProduct(input: $input) {
      id
      name
      description
      customAttrs
    }
  }
`;

const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: ID!) {
    deleteProduct(id: $id)
  }
`;

interface ProductDetailPageProps {
  product: any;
  onBack: () => void;
}

export function ProductDetailPage({ product, onBack }: ProductDetailPageProps) {
  const [addOutcomeDialog, setAddOutcomeDialog] = useState(false);
  const [editOutcomeDialog, setEditOutcomeDialog] = useState(false);
  const [newOutcome, setNewOutcome] = useState({ name: '', description: '' });
  const [editingOutcome, setEditingOutcome] = useState<any>(null);

  // License states
  const [addLicenseDialog, setAddLicenseDialog] = useState(false);
  const [editLicenseDialog, setEditLicenseDialog] = useState(false);
  const [newLicense, setNewLicense] = useState({ name: '', description: '', level: 1 });
  const [editingLicense, setEditingLicense] = useState<any>(null);

  // Release states
  const [addReleaseDialog, setAddReleaseDialog] = useState(false);
  const [editReleaseDialog, setEditReleaseDialog] = useState(false);
  const [newRelease, setNewRelease] = useState({ name: '', description: '', level: 1.0 });
  const [editingRelease, setEditingRelease] = useState<any>(null);

  // Task states (edit only)
  const [editTaskDialog, setEditTaskDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  // Custom Attributes states
  const [editCustomAttributesDialog, setEditCustomAttributesDialog] = useState(false);
  const [customAttributesText, setCustomAttributesText] = useState('');

  // Product management states
  const [addProductDialog, setAddProductDialog] = useState(false);
  const [editProductDialog, setEditProductDialog] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', description: '', customAttrs: {} });
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // GraphQL queries

  // Custom Attributes states
  const [addCustomAttrDialog, setAddCustomAttrDialog] = useState(false);
  const [newCustomAttr, setNewCustomAttr] = useState({ key: '', value: '' });
  const [customAttributes, setCustomAttributes] = useState<any>(product.customAttrs || {});

  // Queries and mutations
  const { data: outcomesData, loading: outcomesLoading, refetch: refetchOutcomes } = useQuery(OUTCOMES_FOR_PRODUCT, {
    variables: { productId: product.id },
    errorPolicy: 'all'
  });

  const { data: tasksData, loading: tasksLoading, refetch: refetchTasks } = useQuery(TASKS_FOR_PRODUCT, {
    variables: { productId: product.id },
    errorPolicy: 'all'
  });

  const { data: licensesData, loading: licensesLoading, refetch: refetchLicenses } = useQuery(LICENSES_FOR_PRODUCT, {
    variables: { productId: product.id },
    errorPolicy: 'all'
  });

  const { data: releasesData, loading: releasesLoading, refetch: refetchReleases } = useQuery(RELEASES_FOR_PRODUCT, {
    variables: { productId: product.id },
    errorPolicy: 'all',
    onCompleted: (data) => {
      console.log('RELEASES_FOR_PRODUCT completed:', data);
    },
    onError: (error) => {
      console.log('RELEASES_FOR_PRODUCT error:', error);
    }
  });

  const [createOutcome] = useMutation(CREATE_OUTCOME, {
    errorPolicy: 'all',
    onError: (error) => {
      console.error('=== CREATE_OUTCOME mutation onError ===', error);
    },
    onCompleted: (data) => {
      console.log('=== CREATE_OUTCOME mutation onCompleted ===', data);
    }
  });
  const [updateOutcome] = useMutation(UPDATE_OUTCOME);
  const [deleteOutcome] = useMutation(DELETE_OUTCOME);

  const [createLicense] = useMutation(CREATE_LICENSE);
  const [updateLicense] = useMutation(UPDATE_LICENSE);
  const [deleteLicense] = useMutation(DELETE_LICENSE);

  const [createRelease] = useMutation(CREATE_RELEASE);
  const [updateRelease] = useMutation(UPDATE_RELEASE);
  const [deleteRelease] = useMutation(DELETE_RELEASE);

  const [updateTask] = useMutation(UPDATE_TASK);
  const [deleteTask] = useMutation(DELETE_TASK);
  const [updateProduct] = useMutation(UPDATE_PRODUCT);
  const [createProduct] = useMutation(CREATE_PRODUCT);
  const [deleteProduct] = useMutation(DELETE_PRODUCT);

  const outcomes = outcomesData?.outcomes || [];
  const licenses = licensesData?.product?.licenses || [];
  const releases = releasesData?.product?.releases || [];
  
  // Debug logging
  console.log('Product ID:', product.id);
  console.log('Releases data:', releasesData);
  console.log('Releases:', releases);
  console.log('Releases loading:', releasesLoading);
  const tasks = tasksData?.tasks?.edges?.map((e: any) => e.node) || [];

  const handleCreateOutcome = async () => {
    if (!newOutcome.name.trim()) {
      alert('Please enter an outcome name');
      return;
    }

    // Check if outcome name already exists
    const existingOutcome = outcomes.find((outcome: any) =>
      outcome.name.toLowerCase() === newOutcome.name.trim().toLowerCase()
    );

    if (existingOutcome) {
      alert(`An outcome with the name "${newOutcome.name}" already exists. Please choose a different name.`);
      return;
    }

    try {
      const result = await createOutcome({
        variables: {
          input: {
            name: newOutcome.name.trim(),
            description: newOutcome.description.trim(),
            productId: product.id
          }
        },
        refetchQueries: ['OutcomesForProduct'],
        awaitRefetchQueries: true
      });

      if (result.data?.createOutcome) {
        setNewOutcome({ name: '', description: '' });
        setAddOutcomeDialog(false);
        await refetchOutcomes();
      } else {
        throw new Error('No data returned from mutation');
      }
    } catch (error: any) {
      console.error('Error creating outcome:', error);

      // Extract user-friendly error message
      let errorMessage = 'Unknown error occurred';
      if (error?.graphQLErrors?.length > 0) {
        errorMessage = error.graphQLErrors[0].message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      alert('Failed to create outcome: ' + errorMessage);
    }
  };

  const handleUpdateOutcome = async () => {
    if (!editingOutcome?.name?.trim()) {
      alert('Please enter an outcome name');
      return;
    }

    // Check if outcome name already exists (excluding current outcome)
    const existingOutcome = outcomes.find((outcome: any) =>
      outcome.id !== editingOutcome.id &&
      outcome.name.toLowerCase() === editingOutcome.name.trim().toLowerCase()
    );

    if (existingOutcome) {
      alert(`An outcome with the name "${editingOutcome.name}" already exists. Please choose a different name.`);
      return;
    }

    try {
      await updateOutcome({
        variables: {
          id: editingOutcome.id,
          input: {
            name: editingOutcome.name.trim(),
            description: editingOutcome.description.trim(),
            productId: product.id
          }
        }
      });

      setEditOutcomeDialog(false);
      setEditingOutcome(null);
      await refetchOutcomes();
    } catch (error: any) {
      console.error('Error updating outcome:', error);

      // Extract user-friendly error message
      let errorMessage = 'Unknown error occurred';
      if (error?.graphQLErrors?.length > 0) {
        errorMessage = error.graphQLErrors[0].message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      alert('Failed to update outcome: ' + errorMessage);
    }
  };

  const handleDeleteOutcome = async (outcomeId: string) => {
    if (!confirm('Are you sure you want to delete this outcome?')) return;

    try {
      await deleteOutcome({
        variables: { id: outcomeId }
      });

      await refetchOutcomes();
    } catch (error: any) {
      console.error('Error deleting outcome:', error);
      alert('Failed to delete outcome: ' + (error?.message || 'Unknown error'));
    }
  };

  const handleEditOutcome = (outcome: any) => {
    setEditingOutcome({ ...outcome });
    setEditOutcomeDialog(true);
  };

  // License handlers
  const handleCreateLicense = async () => {
    if (!newLicense.name.trim()) {
      alert('Please enter a license name');
      return;
    }

    // Check if license name already exists
    const existingLicense = licenses.find((license: any) =>
      license.name.toLowerCase() === newLicense.name.trim().toLowerCase()
    );

    if (existingLicense) {
      alert(`A license with the name "${newLicense.name}" already exists. Please choose a different name.`);
      return;
    }

    // Validate license level (must be 1, 2, or 3)
    const level = Number(newLicense.level);
    if (![1, 2, 3].includes(level)) {
      alert('License level must be 1 (Essential), 2 (Advantage), or 3 (Signature)');
      return;
    }

    // Check if license level already exists
    const existingLevelLicense = licenses.find((license: any) => license.level === level);
    if (existingLevelLicense) {
      const levelNames = { 1: 'Essential', 2: 'Advantage', 3: 'Signature' };
      alert(`A ${levelNames[level as keyof typeof levelNames]} license already exists for this product. Please choose a different level.`);
      return;
    }

    try {
      const result = await createLicense({
        variables: {
          input: {
            name: newLicense.name.trim(),
            description: newLicense.description.trim(),
            level: level,
            productId: product.id,
            isActive: true
          }
        }
      });

      if (result.data?.createLicense) {
        setNewLicense({ name: '', description: '', level: 1 });
        setAddLicenseDialog(false);
        await refetchLicenses();
      } else {
        throw new Error('No data returned from mutation');
      }
    } catch (error: any) {
      console.error('Error creating license:', error);

      let errorMessage = 'Unknown error occurred';
      if (error?.graphQLErrors?.length > 0) {
        errorMessage = error.graphQLErrors[0].message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      alert('Failed to create license: ' + errorMessage);
    }
  };

  const handleUpdateLicense = async () => {
    if (!editingLicense?.name?.trim()) {
      alert('Please enter a license name');
      return;
    }

    // Check if license name already exists (excluding current license)
    const existingLicense = licenses.find((license: any) =>
      license.id !== editingLicense.id &&
      license.name.toLowerCase() === editingLicense.name.trim().toLowerCase()
    );

    if (existingLicense) {
      alert(`A license with the name "${editingLicense.name}" already exists. Please choose a different name.`);
      return;
    }

    // Validate license level
    const level = Number(editingLicense.level);
    if (![1, 2, 3].includes(level)) {
      alert('License level must be 1 (Essential), 2 (Advantage), or 3 (Signature)');
      return;
    }

    // Check if license level already exists (excluding current license)
    const existingLevelLicense = licenses.find((license: any) =>
      license.id !== editingLicense.id && license.level === level
    );
    if (existingLevelLicense) {
      const levelNames = { 1: 'Essential', 2: 'Advantage', 3: 'Signature' };
      alert(`A ${levelNames[level as keyof typeof levelNames]} license already exists for this product. Please choose a different level.`);
      return;
    }

    try {
      await updateLicense({
        variables: {
          id: editingLicense.id,
          input: {
            name: editingLicense.name.trim(),
            description: editingLicense.description.trim(),
            level: level,
            productId: product.id,
            isActive: editingLicense.isActive
          }
        }
      });

      setEditLicenseDialog(false);
      setEditingLicense(null);
      await refetchLicenses();
    } catch (error: any) {
      console.error('Error updating license:', error);

      let errorMessage = 'Unknown error occurred';
      if (error?.graphQLErrors?.length > 0) {
        errorMessage = error.graphQLErrors[0].message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      alert('Failed to update license: ' + errorMessage);
    }
  };

  const handleDeleteLicense = async (licenseId: string) => {
    if (!confirm('Are you sure you want to delete this license? This may affect tasks that reference it.')) return;

    try {
      await deleteLicense({
        variables: { id: licenseId }
      });

      await refetchLicenses();
    } catch (error: any) {
      console.error('Error deleting license:', error);
      alert('Failed to delete license: ' + (error?.message || 'Unknown error'));
    }
  };

  const handleEditLicense = (license: any) => {
    setEditingLicense({ ...license });
    setEditLicenseDialog(true);
  };

  // Release handlers
  const handleCreateRelease = async () => {
    if (!newRelease.name.trim()) {
      alert('Please enter a release name');
      return;
    }

    // Check if release name already exists
    const existingRelease = releases.find((release: any) =>
      release.name.toLowerCase() === newRelease.name.trim().toLowerCase()
    );

    if (existingRelease) {
      alert(`A release with the name "${newRelease.name}" already exists. Please choose a different name.`);
      return;
    }

    // Validate release level (must be a positive decimal)
    const level = Number(newRelease.level);
    if (isNaN(level) || level <= 0) {
      alert('Release level must be a positive number (e.g., 1.0, 1.1, 2.0)');
      return;
    }

    // Check if release level already exists
    const existingLevelRelease = releases.find((release: any) => release.level === level);
    if (existingLevelRelease) {
      alert(`A release with level ${level} already exists for this product. Please choose a different level.`);
      return;
    }

    try {
      const result = await createRelease({
        variables: {
          input: {
            name: newRelease.name.trim(),
            description: newRelease.description.trim(),
            level: level,
            productId: product.id,
            isActive: true
          }
        }
      });

      if (result.data?.createRelease) {
        setNewRelease({ name: '', description: '', level: 1.0 });
        setAddReleaseDialog(false);
        await refetchReleases();
      } else {
        throw new Error('No data returned from mutation');
      }
    } catch (error: any) {
      console.error('Error creating release:', error);

      let errorMessage = 'Unknown error occurred';
      if (error?.graphQLErrors?.length > 0) {
        errorMessage = error.graphQLErrors[0].message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      alert('Failed to create release: ' + errorMessage);
    }
  };

  const handleUpdateRelease = async () => {
    if (!editingRelease?.name?.trim()) {
      alert('Please enter a release name');
      return;
    }

    const level = Number(editingRelease.level);
    if (isNaN(level) || level <= 0) {
      alert('Release level must be a positive number (e.g., 1.0, 1.1, 2.0)');
      return;
    }

    try {
      await updateRelease({
        variables: {
          id: editingRelease.id,
          input: {
            name: editingRelease.name.trim(),
            description: editingRelease.description?.trim() || '',
            level: level,
            productId: product.id,
            isActive: editingRelease.isActive !== false
          }
        }
      });

      setEditReleaseDialog(false);
      setEditingRelease(null);
      await refetchReleases();
    } catch (error: any) {
      console.error('Error updating release:', error);

      let errorMessage = 'Unknown error occurred';
      if (error?.graphQLErrors?.length > 0) {
        errorMessage = error.graphQLErrors[0].message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      alert('Failed to update release: ' + errorMessage);
    }
  };

  const handleDeleteRelease = async (releaseId: string) => {
    if (!confirm('Are you sure you want to delete this release? This may affect tasks that reference it.')) return;

    try {
      await deleteRelease({
        variables: { id: releaseId }
      });

      await refetchReleases();
    } catch (error: any) {
      console.error('Error deleting release:', error);
      alert('Failed to delete release: ' + (error?.message || 'Unknown error'));
    }
  };

  const handleEditRelease = (release: any) => {
    setEditingRelease({ ...release });
    setEditReleaseDialog(true);
  };

  // Import/Export handlers
  const handleExportOutcomes = () => {
    if (outcomes.length === 0) {
      alert('No outcomes to export');
      return;
    }

    const exportData = {
      productId: product.id,
      productName: product.name,
      exportType: 'outcomes',
      exportDate: new Date().toISOString(),
      data: outcomes.map((outcome: any) => ({
        name: outcome.name,
        description: outcome.description
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${product.name}-outcomes-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportOutcomes = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const importData = JSON.parse(text);

        if (importData.exportType !== 'outcomes') {
          alert('Invalid file format. Please select an outcomes export file.');
          return;
        }

        if (!importData.data || !Array.isArray(importData.data)) {
          alert('Invalid file structure. No outcomes data found.');
          return;
        }

        let importedCount = 0;
        for (const outcomeData of importData.data) {
          // Check if outcome already exists
          const exists = outcomes.find((outcome: any) =>
            outcome.name.toLowerCase() === outcomeData.name.toLowerCase()
          );

          if (!exists) {
            try {
              await createOutcome({
                variables: {
                  input: {
                    name: outcomeData.name,
                    description: outcomeData.description || '',
                    productId: product.id
                  }
                }
              });
              importedCount++;
            } catch (error) {
              console.error(`Failed to import outcome: ${outcomeData.name}`, error);
            }
          }
        }

        await refetchOutcomes();
        alert(`Successfully imported ${importedCount} outcomes. Duplicates were skipped.`);
      } catch (error) {
        console.error('Import error:', error);
        alert('Failed to import outcomes. Please check the file format.');
      }
    };
    input.click();
  };

  const handleExportLicenses = () => {
    if (licenses.length === 0) {
      alert('No licenses to export');
      return;
    }

    const exportData = {
      productId: product.id,
      productName: product.name,
      exportType: 'licenses',
      exportDate: new Date().toISOString(),
      data: licenses.map((license: any) => ({
        name: license.name,
        description: license.description,
        level: license.level
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${product.name}-licenses-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportReleases = () => {
    if (releases.length === 0) {
      alert('No releases to export');
      return;
    }

    const exportData = {
      productId: product.id,
      productName: product.name,
      exportType: 'releases',
      exportDate: new Date().toISOString(),
      data: releases.map((release: any) => ({
        name: release.name,
        description: release.description,
        level: release.level
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${product.name}-releases-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportLicenses = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const importData = JSON.parse(text);

        if (importData.exportType !== 'licenses') {
          alert('Invalid file format. Please select a licenses export file.');
          return;
        }

        if (!importData.data || !Array.isArray(importData.data)) {
          alert('Invalid file structure. No licenses data found.');
          return;
        }

        let importedCount = 0;
        for (const licenseData of importData.data) {
          // Check if license name or level already exists
          const nameExists = licenses.find((license: any) =>
            license.name.toLowerCase() === licenseData.name.toLowerCase()
          );
          const levelExists = licenses.find((license: any) =>
            license.level === licenseData.level
          );

          if (!nameExists && !levelExists) {
            try {
              await createLicense({
                variables: {
                  input: {
                    name: licenseData.name,
                    description: licenseData.description || '',
                    level: licenseData.level,
                    productId: product.id,
                    isActive: true
                  }
                }
              });
              importedCount++;
            } catch (error) {
              console.error(`Failed to import license: ${licenseData.name}`, error);
            }
          }
        }

        await refetchLicenses();
        alert(`Successfully imported ${importedCount} licenses. Duplicates were skipped.`);
      } catch (error) {
        console.error('Import error:', error);
        alert('Failed to import licenses. Please check the file format.');
      }
    };
    input.click();
  };

  // Task handlers (edit only)
  const handleUpdateTask = async () => {
    if (!editingTask?.name?.trim()) {
      alert('Please enter a task name');
      return;
    }

    // Check if task name already exists (excluding current task)
    const existingTask = tasks.find((task: any) =>
      task.id !== editingTask.id &&
      task.name.toLowerCase() === editingTask.name.trim().toLowerCase()
    );

    if (existingTask) {
      alert(`A task with the name "${editingTask.name}" already exists. Please choose a different name.`);
      return;
    }

    // Validate weight
    if (editingTask.weight < 0 || editingTask.weight > 100) {
      alert('Task weight must be between 0 and 100');
      return;
    }

    // Validate license level exists
    const licenseExists = licenses.find((license: any) => license.level === editingTask.licenseLevel);
    if (!licenseExists) {
      alert(`No license found for level ${editingTask.licenseLevel}. Please create the license first.`);
      return;
    }

    try {
      await updateTask({
        variables: {
          id: editingTask.id,
          input: {
            name: editingTask.name.trim(),
            description: editingTask.description.trim(),
            weight: parseFloat(editingTask.weight.toString()),
            estMinutes: parseInt(editingTask.estMinutes.toString()),
            licenseLevel: editingTask.licenseLevel,
            productId: product.id,
            releaseIds: editingTask.releaseIds || [],
            howToDoc: (editingTask.howToDoc || '').trim(),
            howToVideo: (editingTask.howToVideo || '').trim(),
            notes: (editingTask.notes || '').trim()
          }
        }
      });

      setEditTaskDialog(false);
      setEditingTask(null);
      await refetchTasks();
    } catch (error: any) {
      console.error('Error updating task:', error);

      let errorMessage = 'Unknown error occurred';
      if (error?.graphQLErrors?.length > 0) {
        errorMessage = error.graphQLErrors[0].message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      alert('Failed to update task: ' + errorMessage);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await deleteTask({
        variables: { id: taskId }
      });

      await refetchTasks();
    } catch (error: any) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task: ' + (error?.message || 'Unknown error'));
    }
  };

  const handleEditTask = (task: any) => {
    setEditingTask({ 
      ...task, 
      releaseIds: task.availableInReleases?.map((release: any) => release.id) || [] 
    });
    setEditTaskDialog(true);
  };

  const handleExportTasks = () => {
    if (tasks.length === 0) {
      alert('No tasks to export');
      return;
    }

    const exportData = {
      productId: product.id,
      productName: product.name,
      exportType: 'tasks',
      exportDate: new Date().toISOString(),
      data: tasks.map((task: any) => ({
        name: task.name,
        description: task.description,
        weight: task.weight,
        estMinutes: task.estMinutes,
        licenseLevel: task.licenseLevel
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${product.name}-tasks-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Custom Attributes handlers
  const handleEditCustomAttributes = () => {
    // Initialize with current custom attributes as formatted JSON
    const currentAttrs = product.customAttrs || {};
    setCustomAttributesText(JSON.stringify(currentAttrs, null, 2));
    setEditCustomAttributesDialog(true);
  };

  const handleUpdateCustomAttributes = async () => {
    try {
      // Parse the JSON text
      const parsedAttrs = customAttributesText.trim() ? JSON.parse(customAttributesText) : {};

      await updateProduct({
        variables: {
          id: product.id,
          input: {
            name: product.name,
            description: product.description,
            customAttrs: parsedAttrs
          }
        }
      });

      setEditCustomAttributesDialog(false);

      // Force a page refresh to show updated custom attributes
      window.location.reload();
    } catch (error: any) {
      if (error.message.includes('JSON')) {
        alert('Invalid JSON format. Please check your syntax.');
      } else {
        console.error('Error updating custom attributes:', error);
        alert('Failed to update custom attributes: ' + (error?.message || 'Unknown error'));
      }
    }
  };

  const handleExportCustomAttributes = () => {
    if (!product.customAttrs || Object.keys(product.customAttrs).length === 0) {
      alert('No custom attributes to export');
      return;
    }

    const exportData = {
      productId: product.id,
      productName: product.name,
      exportType: 'customAttributes',
      exportDate: new Date().toISOString(),
      data: product.customAttrs
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${product.name}-custom-attributes-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCustomAttributes = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const importData = JSON.parse(text);

        if (importData.exportType !== 'customAttributes') {
          alert('Invalid file format. Please select a custom attributes export file.');
          return;
        }

        if (!importData.data) {
          alert('Invalid file structure. No custom attributes data found.');
          return;
        }

        await updateProduct({
          variables: {
            id: product.id,
            input: {
              name: product.name,
              description: product.description,
              customAttrs: importData.data
            }
          }
        });

        alert('Custom attributes imported successfully.');
        window.location.reload();
      } catch (error) {
        console.error('Import error:', error);
        alert('Failed to import custom attributes. Please check the file format.');
      }
    };
    input.click();
  };

  // Product management handlers
  const handleEditProduct = () => {
    setEditingProduct({
      name: product.name,
      description: product.description || '',
      customAttrs: product.customAttrs || {}
    });
    setEditProductDialog(true);
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct?.name?.trim()) {
      alert('Please enter a product name');
      return;
    }

    try {
      await updateProduct({
        variables: {
          id: product.id,
          input: {
            name: editingProduct.name.trim(),
            description: editingProduct.description.trim(),
            customAttrs: editingProduct.customAttrs
          }
        }
      });

      setEditProductDialog(false);
      setEditingProduct(null);

      // Refresh the page to show updated product
      window.location.reload();
    } catch (error: any) {
      console.error('Error updating product:', error);
      alert('Failed to update product: ' + (error?.message || 'Unknown error'));
    }
  };

  const handleCreateProduct = async () => {
    if (!newProduct.name.trim()) {
      alert('Please enter a product name');
      return;
    }

    try {
      const result = await createProduct({
        variables: {
          input: {
            name: newProduct.name.trim(),
            description: newProduct.description.trim(),
            customAttrs: newProduct.customAttrs
          }
        }
      });

      if (result.data?.createProduct) {
        setNewProduct({ name: '', description: '', customAttrs: {} });
        setAddProductDialog(false);
        alert('Product created successfully!');
        // Optionally navigate to the new product
      } else {
        throw new Error('No data returned from mutation');
      }
    } catch (error: any) {
      console.error('Error creating product:', error);
      alert('Failed to create product: ' + (error?.message || 'Unknown error'));
    }
  };

  const handleDeleteProduct = async () => {
    if (!confirm(`Are you sure you want to delete the product "${product.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteProduct({
        variables: { id: product.id }
      });

      alert('Product deleted successfully!');
      onBack(); // Navigate back to the products list
    } catch (error: any) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product: ' + (error?.message || 'Unknown error'));
    }
  };

  const handleExportProduct = () => {
    const exportData = {
      exportType: 'product',
      exportDate: new Date().toISOString(),
      data: {
        name: product.name,
        description: product.description,
        customAttrs: product.customAttrs
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${product.name}-product-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportProduct = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const importData = JSON.parse(text);

        if (importData.exportType !== 'product') {
          alert('Invalid file format. Please select a product export file.');
          return;
        }

        if (!importData.data) {
          alert('Invalid file structure. No product data found.');
          return;
        }

        // Update the current product with imported data
        await updateProduct({
          variables: {
            id: product.id,
            input: {
              name: importData.data.name || product.name,
              description: importData.data.description || product.description,
              customAttrs: importData.data.customAttrs || product.customAttrs
            }
          }
        });

        alert('Product imported successfully.');
        window.location.reload();
      } catch (error) {
        console.error('Import error:', error);
        alert('Failed to import product. Please check the file format.');
      }
    };
    input.click();
  };

  // Safety check for product prop
  if (!product) {
    return (
      <Box>
        <Typography variant="h6" color="error">
          Error: No product data provided
        </Typography>
        <Button onClick={onBack} variant="outlined">
          Back to Products
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={onBack} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4">
            {product.name} - Overview
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" startIcon={<Add />} onClick={() => setAddProductDialog(true)}>
            Add Product
          </Button>
          <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => handleDeleteProduct()}>
            Delete Product
          </Button>
        </Box>
      </Box>

      {/* Product Overview Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Product Information
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FileUploadIcon />}
              onClick={() => handleImportProduct()}
            >
              Import
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FileDownloadIcon />}
              onClick={() => handleExportProduct()}
            >
              Export
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<EditIcon />}
              onClick={() => handleEditProduct()}
            >
              Edit Product
            </Button>
          </Box>
        </Box>

        <Typography variant="body1" gutterBottom>
          <strong>Name:</strong> {product.name}
        </Typography>
        <Typography variant="body1" gutterBottom>
          <strong>Description:</strong> {product.description || 'No description available'}
        </Typography>

        {product.customAttrs && Object.keys(product.customAttrs).length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Custom Attributes:</strong>
            </Typography>
            <Box sx={{ pl: 2 }}>
              {Object.entries(product.customAttrs).map(([key, value]) => (
                <Typography key={key} variant="body2" color="text.secondary">
                  {key}: {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </Typography>
              ))}
            </Box>
          </Box>
        )}
      </Paper>

      {/* Outcomes Section */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            Product Outcomes
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FileUploadIcon />}
              onClick={() => handleImportOutcomes()}
            >
              Import
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FileDownloadIcon />}
              onClick={() => handleExportOutcomes()}
            >
              Export
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setAddOutcomeDialog(true)}
            >
              Add Outcome
            </Button>
          </Box>
        </Box>

        {outcomesLoading ? (
          <Typography>Loading outcomes...</Typography>
        ) : outcomes.length > 0 ? (
          <List>
            {outcomes.map((outcome: any) => (
              <ListItem
                key={outcome.id}
                sx={{
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                  mb: 1,
                  display: 'flex',
                  justifyContent: 'space-between'
                }}
              >
                <ListItemText
                  primary={outcome.name}
                  secondary={outcome.description}
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => handleEditOutcome(outcome)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteOutcome(outcome.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No outcomes defined for this product. Click "Add Outcome" to create one.
          </Typography>
        )}
      </Paper>

      {/* Licenses Section */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            Product Licenses
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FileUploadIcon />}
              onClick={() => handleImportLicenses()}
            >
              Import
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FileDownloadIcon />}
              onClick={() => handleExportLicenses()}
            >
              Export
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setAddLicenseDialog(true)}
            >
              Add License
            </Button>
          </Box>
        </Box>

        {licensesLoading ? (
          <Typography>Loading licenses...</Typography>
        ) : licenses.length > 0 ? (
          <List>
            {[...licenses]
              .sort((a: any, b: any) => a.level - b.level)
              .map((license: any) => {
                const levelNames = { 1: 'Essential', 2: 'Advantage', 3: 'Signature' };
                const levelName = levelNames[license.level as keyof typeof levelNames] || `Level ${license.level}`;

                return (
                  <ListItem
                    key={license.id}
                    sx={{
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      mb: 1,
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1">{license.name}</Typography>
                          <Chip
                            label={levelName}
                            size="small"
                            color={license.level === 1 ? 'default' : license.level === 2 ? 'primary' : 'secondary'}
                          />
                          {!license.isActive && (
                            <Chip label="Inactive" size="small" color="error" variant="outlined" />
                          )}
                        </Box>
                      }
                      secondary={license.description}
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEditLicense(license)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteLicense(license.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </ListItem>
                );
              })}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No licenses defined for this product. Click "Add License" to create one.
            <br />
            <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block' }}>
              Licenses define the access levels: Essential (Level 1), Advantage (Level 2), Signature (Level 3)
            </Typography>
          </Typography>
        )}
      </Paper>

      {/* Releases Section */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            Product Releases
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              size="small"
              onClick={handleExportReleases}
              disabled={releases.length === 0}
            >
              Export
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              size="small"
              onClick={() => setAddReleaseDialog(true)}
            >
              Add Release
            </Button>
          </Box>
        </Box>

        {releasesLoading ? (
          <Typography>Loading releases...</Typography>
        ) : releases.length > 0 ? (
          <List>
            {releases
              .sort((a: any, b: any) => a.level - b.level)
              .map((release: any) => {
                return (
                  <ListItem
                    key={release.id}
                    sx={{
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      mb: 1,
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1">{release.name}</Typography>
                          <Chip
                            label={`v${release.level}`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          {!release.isActive && (
                            <Chip label="Inactive" size="small" color="error" variant="outlined" />
                          )}
                        </Box>
                      }
                      secondary={release.description}
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEditRelease(release)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteRelease(release.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </ListItem>
                );
              })}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No releases defined for this product. Click "Add Release" to create one.
            <br />
            <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block' }}>
              Releases define version levels (e.g., 1.0, 1.1, 2.0). Tasks assigned to lower versions are automatically available in higher versions.
            </Typography>
          </Typography>
        )}
      </Paper>

      {/* Tasks Section */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Product Tasks
          </Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={() => handleExportTasks()}
              sx={{ mr: 1 }}
            >
              Export
            </Button>
          </Box>
        </Box>

        {tasksLoading ? (
          <Typography>Loading tasks...</Typography>
        ) : tasks.length > 0 ? (
          <TableContainer>
            {[...tasks]
              .sort((a: any, b: any) => a.name.localeCompare(b.name))
              .map((task: any) => (
                <Card key={task.id} sx={{ mb: 2, border: '1px solid #e0e0e0' }}>
                  <CardContent sx={{ pb: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="start">
                      <Box flex="1">
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          {task.name}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          {/* Show license level */}
                          {task.licenseLevel && (
                            <Chip
                              label={`License: ${task.licenseLevel}`}
                              size="small"
                              color="info"
                              variant="outlined"
                              sx={{ mr: 1, mb: 1 }}
                            />
                          )}
                          
                          {/* Show outcomes */}
                          {task.outcomes && task.outcomes.length > 0 && (
                            <Box sx={{ display: 'inline-block', mr: 1, mb: 1 }}>
                              {task.outcomes.map((outcome: any) => (
                                <Chip
                                  key={outcome.id}
                                  label={outcome.name}
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                  sx={{ mr: 0.5, mb: 0.5 }}
                                />
                              ))}
                            </Box>
                          )}
                          
                          {/* Show how-to links */}
                          {task.howToDoc && (
                            <Chip
                              label="📄 Documentation"
                              size="small"
                              color="primary"
                              variant="filled"
                              onClick={() => window.open(task.howToDoc, '_blank')}
                              sx={{ cursor: 'pointer', mr: 1, mb: 1 }}
                            />
                          )}
                          {task.howToVideo && (
                            <Chip
                              label="🎥 Video"
                              size="small"
                              color="primary"
                              variant="filled"
                              onClick={() => window.open(task.howToVideo, '_blank')}
                              sx={{ cursor: 'pointer', mr: 1, mb: 1 }}
                            />
                          )}
                        </Box>
                      </Box>
                      <Box sx={{ ml: 2 }}>
                        <IconButton
                          onClick={() => handleEditTask(task)}
                          color="primary"
                          size="small"
                          title="Edit Task"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDeleteTask(task.id)}
                          color="error"
                          size="small"
                          title="Delete Task"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
          </TableContainer>
        ) : (
          <Typography variant="body1" color="text.secondary">
            No tasks defined for this product. Use the Tasks submenu to create tasks.
            <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block' }}>
              Tasks define the work items for this product with weights and time estimates.
            </Typography>
          </Typography>
        )}
      </Paper>

      {/* Custom Attributes Section */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Custom Attributes
          </Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<FileUploadIcon />}
              onClick={() => handleImportCustomAttributes()}
              sx={{ mr: 1 }}
            >
              Import
            </Button>
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={() => handleExportCustomAttributes()}
              sx={{ mr: 1 }}
            >
              Export
            </Button>
            <Button variant="contained" onClick={() => handleEditCustomAttributes()}>
              Edit Attributes
            </Button>
          </Box>
        </Box>

        {product.customAttrs && Object.keys(product.customAttrs).length > 0 ? (
          <Box>
            {Object.entries(product.customAttrs).map(([key, value]) => (
              <Box key={key} sx={{ mb: 1, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  {key}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                </Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography variant="body1" color="text.secondary">
            No custom attributes defined for this product. Click "Edit Attributes" to add some.
            <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block' }}>
              Custom attributes allow you to store additional metadata as key-value pairs for this product.
            </Typography>
          </Typography>
        )}
      </Paper>

      {/* Add Outcome Dialog */}
      <Dialog open={addOutcomeDialog} onClose={() => setAddOutcomeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Outcome</DialogTitle>
        <DialogContent>
          <TextField
            label="Outcome Name"
            value={newOutcome.name}
            onChange={(e) => setNewOutcome({ ...newOutcome, name: e.target.value })}
            fullWidth
            margin="normal"
            helperText="Outcome names must be unique within this product"
          />
          <TextField
            label="Description"
            value={newOutcome.description}
            onChange={(e) => setNewOutcome({ ...newOutcome, description: e.target.value })}
            fullWidth
            margin="normal"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOutcomeDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateOutcome}>
            Add Outcome
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Outcome Dialog */}
      <Dialog open={editOutcomeDialog} onClose={() => setEditOutcomeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Outcome</DialogTitle>
        <DialogContent>
          <TextField
            label="Outcome Name"
            value={editingOutcome?.name || ''}
            onChange={(e) => setEditingOutcome({ ...editingOutcome, name: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Description"
            value={editingOutcome?.description || ''}
            onChange={(e) => setEditingOutcome({ ...editingOutcome, description: e.target.value })}
            fullWidth
            margin="normal"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOutcomeDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateOutcome}>
            Update Outcome
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add License Dialog */}
      <Dialog open={addLicenseDialog} onClose={() => setAddLicenseDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New License</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="License Name"
            value={newLicense.name}
            onChange={(e) => setNewLicense({ ...newLicense, name: e.target.value })}
            fullWidth
            margin="normal"
            helperText="License names must be unique within this product"
          />
          <TextField
            label="Description"
            value={newLicense.description}
            onChange={(e) => setNewLicense({ ...newLicense, description: e.target.value })}
            fullWidth
            margin="normal"
            multiline
            rows={3}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>License Level</InputLabel>
            <Select
              value={newLicense.level}
              label="License Level"
              onChange={(e) => setNewLicense({ ...newLicense, level: Number(e.target.value) })}
            >
              <MenuItem value={1}>1 - Essential</MenuItem>
              <MenuItem value={2}>2 - Advantage</MenuItem>
              <MenuItem value={3}>3 - Signature</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Each product can only have one license per level. Essential (1) is the basic level,
            Advantage (2) includes Essential features plus more, and Signature (3) includes all features.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddLicenseDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateLicense}>
            Add License
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit License Dialog */}
      <Dialog open={editLicenseDialog} onClose={() => setEditLicenseDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit License</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="License Name"
            value={editingLicense?.name || ''}
            onChange={(e) => setEditingLicense({ ...editingLicense, name: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Description"
            value={editingLicense?.description || ''}
            onChange={(e) => setEditingLicense({ ...editingLicense, description: e.target.value })}
            fullWidth
            margin="normal"
            multiline
            rows={3}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>License Level</InputLabel>
            <Select
              value={editingLicense?.level || 1}
              label="License Level"
              onChange={(e) => setEditingLicense({ ...editingLicense, level: Number(e.target.value) })}
            >
              <MenuItem value={1}>1 - Essential</MenuItem>
              <MenuItem value={2}>2 - Advantage</MenuItem>
              <MenuItem value={3}>3 - Signature</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={editingLicense?.isActive || false}
                onChange={(e) => setEditingLicense({ ...editingLicense, isActive: e.target.checked })}
              />
            }
            label="Active License"
            sx={{ mt: 2 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Inactive licenses cannot be assigned to new tasks but existing task assignments remain valid.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditLicenseDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateLicense}>
            Update License
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Release Dialog */}
      <Dialog open={addReleaseDialog} onClose={() => setAddReleaseDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Release</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="Release Name"
            value={newRelease.name}
            onChange={(e) => setNewRelease({ ...newRelease, name: e.target.value })}
            fullWidth
            margin="normal"
            helperText="Release names must be unique within this product (e.g., Version 1.0, Alpha, Beta)"
          />
          <TextField
            label="Description"
            value={newRelease.description}
            onChange={(e) => setNewRelease({ ...newRelease, description: e.target.value })}
            fullWidth
            margin="normal"
            multiline
            rows={3}
          />
          <TextField
            label="Release Level"
            type="number"
            value={newRelease.level}
            onChange={(e) => setNewRelease({ ...newRelease, level: parseFloat(e.target.value) || 1.0 })}
            fullWidth
            margin="normal"
            inputProps={{ step: 0.1, min: 0.1 }}
            helperText="Decimal version number (e.g., 1.0, 1.1, 2.0). Each level must be unique."
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Tasks assigned to lower release levels are automatically available in higher levels.
            For example, tasks in release 1.0 are available in 1.1, 2.0, etc.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddReleaseDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateRelease}>
            Add Release
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Release Dialog */}
      <Dialog open={editReleaseDialog} onClose={() => setEditReleaseDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Release</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="Release Name"
            value={editingRelease?.name || ''}
            onChange={(e) => setEditingRelease({ ...editingRelease, name: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Description"
            value={editingRelease?.description || ''}
            onChange={(e) => setEditingRelease({ ...editingRelease, description: e.target.value })}
            fullWidth
            margin="normal"
            multiline
            rows={3}
          />
          <TextField
            label="Release Level"
            type="number"
            value={editingRelease?.level || 1.0}
            onChange={(e) => setEditingRelease({ ...editingRelease, level: parseFloat(e.target.value) || 1.0 })}
            fullWidth
            margin="normal"
            inputProps={{ step: 0.1, min: 0.1 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={editingRelease?.isActive !== false}
                onChange={(e) => setEditingRelease({ ...editingRelease, isActive: e.target.checked })}
              />
            }
            label="Active Release"
            sx={{ mt: 2 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Inactive releases cannot be assigned to new tasks but existing task assignments remain valid.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditReleaseDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateRelease}>
            Update Release
          </Button>
        </DialogActions>
      </Dialog>


      {/* Edit Task Dialog */}
      <Dialog open={editTaskDialog} onClose={() => setEditTaskDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Task</DialogTitle>
        <DialogContent>
          <TextField
            label="Task Name"
            value={editingTask?.name || ''}
            onChange={(e) => setEditingTask({ ...editingTask, name: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Description"
            value={editingTask?.description || ''}
            onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
            fullWidth
            margin="normal"
            multiline
            rows={3}
          />
          <TextField
            label="Weight (%)"
            type="number"
            value={editingTask?.weight || 0}
            onChange={(e) => setEditingTask({ ...editingTask, weight: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) })}
            fullWidth
            margin="normal"
            inputProps={{ min: 0, max: 100 }}
          />
          <TextField
            label="Estimated Minutes"
            type="number"
            value={editingTask?.estMinutes || 0}
            onChange={(e) => setEditingTask({ ...editingTask, estMinutes: Math.max(0, parseInt(e.target.value) || 0) })}
            fullWidth
            margin="normal"
            inputProps={{ min: 0 }}
          />
          <TextField
            label="License Level"
            select
            value={editingTask?.licenseLevel || 1}
            onChange={(e) => setEditingTask({ ...editingTask, licenseLevel: parseInt(e.target.value) })}
            fullWidth
            margin="normal"
          >
            {[...licenses]
              .filter((license: any) => license.active)
              .sort((a: any, b: any) => a.level - b.level)
              .map((license: any) => (
                <MenuItem key={license.level} value={license.level}>
                  Level {license.level} - {license.name}
                </MenuItem>
              ))
            }
          </TextField>
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Releases</InputLabel>
            <Select
              multiple
              value={editingTask?.releaseIds || []}
              onChange={(e) => setEditingTask({ ...editingTask, releaseIds: e.target.value as string[] })}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((releaseId) => {
                    const release = releases.find((r: any) => r.id === releaseId);
                    return (
                      <Chip 
                        key={releaseId} 
                        label={release ? `${release.name} (v${release.level})` : releaseId}
                        size="small" 
                      />
                    );
                  })}
                </Box>
              )}
            >
              {[...releases]
                .sort((a: any, b: any) => a.level - b.level)
                .map((release: any) => (
                  <MenuItem key={release.id} value={release.id}>
                    {release.name} (v{release.level})
                  </MenuItem>
                ))
              }
            </Select>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              Select releases where this task should be available. Tasks are automatically available in higher release levels.
            </Typography>
          </FormControl>

          <TextField
            label="Notes"
            value={editingTask?.notes || ''}
            onChange={(e) => setEditingTask({ ...editingTask, notes: e.target.value })}
            fullWidth
            margin="normal"
            multiline
            rows={2}
            helperText="Internal notes about this task"
          />
          
          <TextField
            label="How To Documentation"
            value={editingTask?.howToDoc || ''}
            onChange={(e) => setEditingTask({ ...editingTask, howToDoc: e.target.value })}
            fullWidth
            margin="normal"
            multiline
            rows={3}
            helperText="Documentation on how to complete this task"
          />
          
          <TextField
            label="How To Video"
            value={editingTask?.howToVideo || ''}
            onChange={(e) => setEditingTask({ ...editingTask, howToVideo: e.target.value })}
            fullWidth
            margin="normal"
            helperText="URL or reference to video instructions"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditTaskDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateTask}>
            Update Task
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Custom Attributes Dialog */}
      <Dialog open={editCustomAttributesDialog} onClose={() => setEditCustomAttributesDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Custom Attributes</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Edit the custom attributes as JSON. Make sure the syntax is valid.
          </Typography>
          <TextField
            label="Custom Attributes (JSON)"
            value={customAttributesText}
            onChange={(e) => setCustomAttributesText(e.target.value)}
            fullWidth
            multiline
            rows={12}
            variant="outlined"
            sx={{ mt: 1, fontFamily: 'monospace' }}
            helperText='Enter valid JSON, e.g., {"category": "analytics", "priority": "high"}'
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditCustomAttributesDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateCustomAttributes}>
            Update Attributes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Product Dialog */}
      <Dialog open={addProductDialog} onClose={() => setAddProductDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Product</DialogTitle>
        <DialogContent>
          <TextField
            label="Product Name"
            value={newProduct.name}
            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
            fullWidth
            margin="normal"
            helperText="Product names should be unique"
          />
          <TextField
            label="Description"
            value={newProduct.description}
            onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
            fullWidth
            margin="normal"
            multiline
            rows={3}
          />
          <TextField
            label="Custom Attributes (JSON)"
            value={JSON.stringify(newProduct.customAttrs, null, 2)}
            onChange={(e) => {
              try {
                const parsed = e.target.value.trim() ? JSON.parse(e.target.value) : {};
                setNewProduct({ ...newProduct, customAttrs: parsed });
              } catch {
                // Invalid JSON, keep the previous value
              }
            }}
            fullWidth
            margin="normal"
            multiline
            rows={4}
            helperText="Enter valid JSON for custom attributes"
            sx={{ fontFamily: 'monospace' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddProductDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateProduct}>
            Add Product
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={editProductDialog} onClose={() => setEditProductDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Product</DialogTitle>
        <DialogContent>
          <TextField
            label="Product Name"
            value={editingProduct?.name || ''}
            onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Description"
            value={editingProduct?.description || ''}
            onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
            fullWidth
            margin="normal"
            multiline
            rows={3}
          />
          <TextField
            label="Custom Attributes (JSON)"
            value={JSON.stringify(editingProduct?.customAttrs || {}, null, 2)}
            onChange={(e) => {
              try {
                const parsed = e.target.value.trim() ? JSON.parse(e.target.value) : {};
                setEditingProduct({ ...editingProduct, customAttrs: parsed });
              } catch {
                // Invalid JSON, keep the previous value
              }
            }}
            fullWidth
            margin="normal"
            multiline
            rows={4}
            helperText="Enter valid JSON for custom attributes"
            sx={{ fontFamily: 'monospace' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditProductDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateProduct}>
            Update Product
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
