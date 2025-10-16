import * as React from 'react';
import { useState, useEffect } from 'react';
import { gql, useQuery } from '@apollo/client';
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
  Checkbox,
  FormControlLabel,
  Alert,
  Chip,
} from '@mui/material';

const GET_OUTCOMES_FOR_PRODUCT = gql`
  query GetOutcomesForProduct($productId: ID!) {
    outcomes(productId: $productId) {
      id
      name
      description
    }
  }
`;

const GET_PRODUCT_DETAILS = gql`
  query GetProductDetails($productId: ID!) {
    product(id: $productId) {
      id
      name
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

interface EditEntitlementsDialogProps {
  open: boolean;
  onClose: () => void;
  customerProductId: string;
  productId: string;
  currentLicenseLevel: string;
  currentSelectedOutcomes: Array<{ id: string; name: string }>;
  currentSelectedReleases: Array<{ id: string; name: string }>;
  onSave: (licenseLevel: string, selectedOutcomeIds: string[], selectedReleaseIds: string[]) => void;
}

export function EditEntitlementsDialog({
  open,
  onClose,
  customerProductId,
  productId,
  currentLicenseLevel,
  currentSelectedOutcomes,
  currentSelectedReleases,
  onSave,
}: EditEntitlementsDialogProps) {
  // Helper function to extract license level enum from full license name
  const extractLicenseLevel = (licenseName: string): string => {
    if (licenseName.includes('Signature')) return 'Signature';
    if (licenseName.includes('Advantage')) return 'Advantage';
    if (licenseName.includes('Essential')) return 'Essential';
    return licenseName; // Fallback to original name
  };

  const [licenseLevel, setLicenseLevel] = useState(currentLicenseLevel);
  const [selectedOutcomeIds, setSelectedOutcomeIds] = useState<string[]>(
    currentSelectedOutcomes.map(o => o.id)
  );
  const [selectedReleaseIds, setSelectedReleaseIds] = useState<string[]>(
    currentSelectedReleases.map(r => r.id)
  );

  const { data: outcomesData, loading: outcomesLoading } = useQuery(GET_OUTCOMES_FOR_PRODUCT, {
    variables: { productId },
    skip: !productId,
  });

  const { data: productData, loading: productLoading } = useQuery(GET_PRODUCT_DETAILS, {
    variables: { productId },
    skip: !productId,
  });

  const { data: releasesData, loading: releasesLoading } = useQuery(GET_RELEASES_FOR_PRODUCT, {
    variables: { productId },
    skip: !productId,
  });

  const availableLicenses = productData?.product?.licenses?.filter((l: any) => l.isActive) || [];
  const releases = releasesData?.releases || [];

  // Reset form when dialog opens or data changes
  useEffect(() => {
    if (open) {
      setLicenseLevel(currentLicenseLevel);
      setSelectedOutcomeIds(currentSelectedOutcomes.map(o => o.id));
      setSelectedReleaseIds(currentSelectedReleases.map(r => r.id));
    }
  }, [open, currentLicenseLevel, currentSelectedOutcomes, currentSelectedReleases]);

  const handleToggleOutcome = (outcomeId: string) => {
    setSelectedOutcomeIds((prev) =>
      prev.includes(outcomeId)
        ? prev.filter((id) => id !== outcomeId)
        : [...prev, outcomeId]
    );
  };

  const handleToggleRelease = (releaseId: string) => {
    setSelectedReleaseIds((prev) =>
      prev.includes(releaseId)
        ? prev.filter((id) => id !== releaseId)
        : [...prev, releaseId]
    );
  };

  const handleSave = () => {
    onSave(licenseLevel, selectedOutcomeIds, selectedReleaseIds);
  };

  const outcomes = outcomesData?.outcomes || [];
  const currentOutcomeIds = currentSelectedOutcomes.map(o => o.id);
  const currentReleaseIds = currentSelectedReleases.map(r => r.id);
  const hasChanges =
    licenseLevel !== currentLicenseLevel ||
    JSON.stringify([...selectedOutcomeIds].sort()) !== JSON.stringify([...currentOutcomeIds].sort()) ||
    JSON.stringify([...selectedReleaseIds].sort()) !== JSON.stringify([...currentReleaseIds].sort());

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Product Entitlements</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Alert severity="warning" sx={{ mb: 3 }}>
            <strong>Warning:</strong> Changing the license, outcomes, or releases will regenerate the entire adoption plan.
            All task progress will be reset. This action cannot be undone.
          </Alert>

          {productLoading ? (
            <Typography>Loading license options...</Typography>
          ) : availableLicenses.length === 0 ? (
            <Alert severity="warning" sx={{ mb: 3 }}>
              No active licenses configured for this product.
            </Alert>
          ) : (
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>License Level</InputLabel>
              <Select
                value={licenseLevel}
                onChange={(e) => setLicenseLevel(e.target.value)}
                label="License Level"
              >
                {availableLicenses.map((license: any) => (
                  <MenuItem key={license.id} value={extractLicenseLevel(license.name)}>
                    <Box>
                      <Typography variant="body1">{license.name}</Typography>
                      {license.description && (
                        <Typography variant="caption" color="text.secondary">
                          {license.description}
                        </Typography>
                      )}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Typography variant="h6" gutterBottom>
            Outcomes
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select the outcomes this customer wants to achieve:
          </Typography>

          {outcomesLoading ? (
            <Typography>Loading outcomes...</Typography>
          ) : outcomes.length === 0 ? (
            <Alert severity="warning">No outcomes available for this product.</Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {outcomes.map((outcome: any) => (
                <FormControlLabel
                  key={outcome.id}
                  control={
                    <Checkbox
                      checked={selectedOutcomeIds.includes(outcome.id)}
                      onChange={() => handleToggleOutcome(outcome.id)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1">{outcome.name}</Typography>
                      {outcome.description && (
                        <Typography variant="body2" color="text.secondary">
                          {outcome.description}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              ))}
            </Box>
          )}

          <Typography variant="subtitle1" fontWeight="medium" gutterBottom sx={{ mt: 3 }}>
            Product Releases
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Select the releases this customer wants to include:
          </Typography>

          {releasesLoading ? (
            <Typography>Loading releases...</Typography>
          ) : releases.length === 0 ? (
            <Alert severity="warning">No releases available for this product.</Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {releases.map((release: any) => (
                <FormControlLabel
                  key={release.id}
                  control={
                    <Checkbox
                      checked={selectedReleaseIds.includes(release.id)}
                      onChange={() => handleToggleRelease(release.id)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1">{release.name}</Typography>
                      {release.description && (
                        <Typography variant="body2" color="text.secondary">
                          {release.description}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              ))}
            </Box>
          )}

          {hasChanges && (
            <Alert severity="error" sx={{ mt: 3 }}>
              <Typography variant="body2">
                <strong>Warning!</strong> Saving these changes will regenerate the entire adoption plan.
                All task progress will be reset. This cannot be undone.
              </Typography>
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!hasChanges}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}
