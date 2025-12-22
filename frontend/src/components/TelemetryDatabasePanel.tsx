import * as React from 'react';
import { useState } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Alert,
  Chip,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
} from '@mui/material';
import { CheckCircle, Cancel, Edit, Refresh, Download, Upload } from '@shared/components/FAIcon';

const GET_TELEMETRY_DATABASE = gql`
  query GetCustomerTelemetryDatabase($customerId: ID, $customerProductId: ID) {
    customerTelemetryDatabase(customerId: $customerId, customerProductId: $customerProductId) {
      customerId
      customerName
      customerProductId
      productId
      productName
      licenseLevel
      adoptionPlanId
      taskId
      taskName
      taskSequenceNumber
      attributeId
      attributeName
      attributeType
      attributeRequired
      attributeCriteria
      latestValue
      latestValueDate
      criteriaMet
      taskStatus
    }
  }
`;

const GET_CUSTOMERS_SIMPLE = gql`
  query GetCustomersSimple {
    customers {
      id
      name
    }
  }
`;

const EXPORT_CUSTOMER_ADOPTION = gql`
  mutation ExportCustomerAdoption($customerId: ID!, $customerProductId: ID!) {
    exportCustomerAdoptionToExcel(customerId: $customerId, customerProductId: $customerProductId) {
      filename
      content
      mimeType
    }
  }
`;

const IMPORT_CUSTOMER_ADOPTION = gql`
  mutation ImportCustomerAdoption($content: String!) {
    importCustomerAdoptionFromExcel(content: $content) {
      success
      customerName
      productName
      stats {
        telemetryValuesImported
        taskStatusesUpdated
        attributesCreated
      }
      errors {
        row
        field
        message
      }
      warnings {
        row
        field
        message
      }
    }
  }
`;

export const TelemetryDatabasePanel: React.FC = () => {
  const [filterCustomerId, setFilterCustomerId] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');

  const { data: customersData } = useQuery(GET_CUSTOMERS_SIMPLE);
  const { data, loading, refetch } = useQuery(GET_TELEMETRY_DATABASE, {
    variables: {
      customerId: filterCustomerId || undefined,
    },
    fetchPolicy: 'cache-and-network',
  });

  const [exportAdoption, { loading: exporting }] = useMutation(EXPORT_CUSTOMER_ADOPTION);
  const [importAdoption, { loading: importing }] = useMutation(IMPORT_CUSTOMER_ADOPTION, {
    onCompleted: (result) => {
      if (result.importCustomerAdoptionFromExcel.success) {
        alert(`Import successful!\n${result.importCustomerAdoptionFromExcel.stats.telemetryValuesImported} telemetry values imported\n${result.importCustomerAdoptionFromExcel.stats.taskStatusesUpdated} task statuses updated`);
        refetch();
      } else {
        const errors = result.importCustomerAdoptionFromExcel.errors.map((e: any) => `Row ${e.row}: ${e.message}`).join('\n');
        alert(`Import completed with errors:\n${errors}`);
      }
    },
  });

  const customers = customersData?.customers || [];
  const records = data?.customerTelemetryDatabase || [];

  // Filter records by search text
  const filteredRecords = records.filter((record: any) => {
    if (!searchText) return true;
    const searchLower = searchText.toLowerCase();
    return (
      record.customerName.toLowerCase().includes(searchLower) ||
      record.productName.toLowerCase().includes(searchLower) ||
      record.taskName.toLowerCase().includes(searchLower) ||
      record.attributeName.toLowerCase().includes(searchLower)
    );
  });

  // Group records by customer-product
  const customerProducts = (Array.from(
    new Set(records.map((r: any) => `${r.customerId}:${r.customerProductId}`))
  ) as string[]).map((key) => {
    const [customerId, customerProductId] = key.split(':');
    const record = records.find((r: any) => r.customerId === customerId && r.customerProductId === customerProductId);
    return {
      customerId,
      customerProductId,
      customerName: record.customerName,
      productName: record.productName,
    };
  });

  const handleExport = async (customerProductId: string) => {
    const record = records.find((r: any) => r.customerProductId === customerProductId);
    if (!record) return;

    try {
      const result = await exportAdoption({
        variables: {
          customerId: record.customerId,
          customerProductId,
        },
      });

      const { filename, content, mimeType } = result.data.exportCustomerAdoptionToExcel;
      
      // Download file
      const blob = new Blob([Uint8Array.from(atob(content), c => c.charCodeAt(0))], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      alert(`Error exporting: ${error.message}`);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const content = btoa(String.fromCharCode(...bytes));

      await importAdoption({ variables: { content } });
    } catch (error: any) {
      alert(`Error importing: ${error.message}`);
    }

    // Reset file input
    event.target.value = '';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Telemetry Database
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        View and manage telemetry data across all customer product assignments
      </Typography>

      {/* Filters and Actions */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, mt: 2 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Customer</InputLabel>
          <Select
            value={filterCustomerId}
            onChange={(e) => setFilterCustomerId(e.target.value)}
            label="Filter by Customer"
          >
            <MenuItem value="">All Customers</MenuItem>
            {customers.map((customer: any) => (
              <MenuItem key={customer.id} value={customer.id}>
                {customer.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          placeholder="Search telemetry..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{ flex: 1 }}
        />

        <Tooltip title="Refresh data">
          <IconButton onClick={() => refetch()}>
            <Refresh />
          </IconButton>
        </Tooltip>

        <Button
          component="label"
          startIcon={<Upload />}
          variant="outlined"
          disabled={importing}
        >
          {importing ? 'Importing...' : 'Import Excel'}
          <input type="file" hidden accept=".xlsx" onChange={handleImport} />
        </Button>
      </Box>

      {/* Customer-Product Export Cards */}
      {customerProducts.length > 0 && (
        <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {customerProducts.map((cp: any) => (
            <Paper key={cp.customerProductId} sx={{ p: 2, flex: '0 0 300px' }}>
              <Typography variant="subtitle2" gutterBottom>
                {cp.customerName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {cp.productName}
              </Typography>
              <Button
                startIcon={<Download />}
                size="small"
                onClick={() => handleExport(cp.customerProductId)}
                disabled={exporting}
              >
                Export
              </Button>
            </Paper>
          ))}
        </Box>
      )}

      {/* Telemetry Table */}
      {loading ? (
        <LinearProgress />
      ) : filteredRecords.length === 0 ? (
        <Alert severity="info">
          No telemetry data found. Telemetry attributes are created when adoption plans are
          generated from products with telemetry attributes.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Customer</TableCell>
                <TableCell>Product</TableCell>
                <TableCell>License</TableCell>
                <TableCell>Task</TableCell>
                <TableCell>Attribute</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Required</TableCell>
                <TableCell>Current Value</TableCell>
                <TableCell>Last Updated</TableCell>
                <TableCell>Criteria Met</TableCell>
                <TableCell>Task Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRecords.map((record: any, index: number) => (
                <TableRow key={index} hover>
                  <TableCell>{record.customerName}</TableCell>
                  <TableCell>{record.productName}</TableCell>
                  <TableCell>
                    <Chip label={record.licenseLevel} size="small" />
                  </TableCell>
                  <TableCell>
                    #{record.taskSequenceNumber} {record.taskName}
                  </TableCell>
                  <TableCell>{record.attributeName}</TableCell>
                  <TableCell>{record.attributeType}</TableCell>
                  <TableCell>
                    {record.attributeRequired && <Chip label="Yes" size="small" color="primary" />}
                  </TableCell>
                  <TableCell>
                    {record.latestValue ? (
                      typeof record.latestValue === 'object'
                        ? JSON.stringify(record.latestValue)
                        : String(record.latestValue)
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        No value
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {record.latestValueDate
                      ? new Date(record.latestValueDate).toLocaleDateString()
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {record.criteriaMet === true && (
                      <Chip label="Yes" size="small" color="success" icon={<CheckCircle />} />
                    )}
                    {record.criteriaMet === false && (
                      <Chip label="No" size="small" color="error" icon={<Cancel />} />
                    )}
                    {record.criteriaMet === null && '-'}
                  </TableCell>
                  <TableCell>
                    <Chip label={record.taskStatus} size="small" variant="outlined" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};
