import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  industry?: string;
  size?: string;
  customAttrs?: any;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: { 
    name: string; 
    email?: string; 
    phone?: string;
    company?: string;
    industry?: string;
    size?: string;
    customAttrs?: any 
  }) => Promise<void>;
  customer?: Customer | null;
  title: string;
}

const industries = [
  'Technology',
  'Healthcare',
  'Finance',
  'Manufacturing',
  'Retail',
  'Education',
  'Government',
  'Non-profit',
  'Consulting',
  'Other'
];

const companySizes = [
  'Startup (1-10)',
  'Small (11-50)',
  'Medium (51-200)',
  'Large (201-1000)',
  'Enterprise (1000+)'
];

export const CustomerDialog: React.FC<Props> = ({ open, onClose, onSave, customer, title }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [industry, setIndustry] = useState('');
  const [size, setSize] = useState('');
  const [customAttrs, setCustomAttrs] = useState('{}');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (customer) {
      setName(customer.name || '');
      setEmail(customer.email || '');
      setPhone(customer.phone || '');
      setCompany(customer.company || '');
      setIndustry(customer.industry || '');
      setSize(customer.size || '');
      setCustomAttrs(JSON.stringify(customer.customAttrs || {}, null, 2));
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setCompany('');
      setIndustry('');
      setSize('');
      setCustomAttrs('{\n  "timezone": "UTC",\n  "preferred_contact": "email",\n  "account_manager": ""\n}');
    }
    setError('');
  }, [customer, open]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Customer name is required');
      return;
    }

    if (email.trim() && !validateEmail(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    if (phone.trim() && !validatePhone(phone.trim())) {
      setError('Please enter a valid phone number');
      return;
    }

    let parsedAttrs = {};
    try {
      if (customAttrs.trim()) {
        parsedAttrs = JSON.parse(customAttrs);
      }
    } catch (e) {
      setError('Invalid JSON in custom attributes');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await onSave({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        company: company.trim() || undefined,
        industry: industry || undefined,
        size: size || undefined,
        customAttrs: Object.keys(parsedAttrs).length > 0 ? parsedAttrs : undefined
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      keepMounted
      container={document.getElementById('root')}
      BackdropProps={{
        onClick: onClose
      }}
      slotProps={{
        backdrop: {
          invisible: false
        }
      }}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Box sx={{ flex: "1 1 300px" }}>
              <TextField
                fullWidth
                label="Customer Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                margin="normal"
                required
                autoFocus
                placeholder="e.g., John Smith or ACME Corp"
              />
            </Box>
            <Box sx={{ flex: "1 1 300px" }}>
              <TextField
                fullWidth
                label="Company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                margin="normal"
                placeholder="e.g., ACME Corporation"
              />
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Box sx={{ flex: "1 1 300px" }}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                placeholder="customer@example.com"
              />
            </Box>
            <Box sx={{ flex: "1 1 300px" }}>
              <TextField
                fullWidth
                label="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                margin="normal"
                placeholder="+1-555-0123"
              />
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Box sx={{ flex: "1 1 300px" }}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Industry</InputLabel>
                <Select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  label="Industry"
                >
                  {industries.map((ind) => (
                    <MenuItem key={ind} value={ind}>
                      {ind}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: "1 1 300px" }}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Company Size</InputLabel>
                <Select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  label="Company Size"
                >
                  {companySizes.map((companySize) => (
                    <MenuItem key={companySize} value={companySize}>
                      {companySize}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          <Accordion sx={{ mt: 2 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography>Additional Customer Information</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TextField
                fullWidth
                label="Custom Attributes"
                value={customAttrs}
                onChange={(e) => setCustomAttrs(e.target.value)}
                multiline
                rows={6}
                placeholder='{"timezone": "EST", "preferred_contact": "email", "account_manager": "jane.doe"}'
                helperText="Add customer-specific metadata. Common fields: timezone, preferred_contact, account_manager, billing_address, etc."
              />
            </AccordionDetails>
          </Accordion>

          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Customer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
