import React, { useState, useEffect, useMemo } from 'react';
import {
    TextField,
    Box,
    Chip,
    FormControlLabel,
    Switch,
    Typography,
    Divider,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Checkbox,
    ListItemText,
    OutlinedInput,
} from '@mui/material';
import { SortableEntityItem, InlineForm } from './SortableEntityItem';

export interface SolutionLicenseData {
    id?: string;
    name: string;
    level: number;
    description?: string;
    isActive?: boolean;
    isNew?: boolean;
    delete?: boolean;
    customAttrs?: {
        productLicenseMapping?: { [productId: string]: string[] };
    };
}

export interface ProductLicense {
    id: string;
    name: string;
    level: number;
    productId: string;
    productName: string;
    description?: string;
}

const ALL_LICENSES_MARKER = '__ALL_LICENSES__';

interface InlineSolutionLicenseEditorProps {
    license: SolutionLicenseData;
    index: number;
    isEditing: boolean;
    onStartEdit: () => void;
    onSave: (data: SolutionLicenseData) => void;
    onCancel: () => void;
    onDelete: () => void;
    availableProductLicenses: ProductLicense[];
    dragDisabled?: boolean;
}

export function InlineSolutionLicenseEditor({
    license,
    index,
    isEditing,
    onStartEdit,
    onSave,
    onCancel,
    onDelete,
    availableProductLicenses,
    dragDisabled,
}: InlineSolutionLicenseEditorProps) {
    const [name, setName] = useState(license.name || '');
    const [level, setLevel] = useState(license.level || 1);
    const [description, setDescription] = useState(license.description || '');
    const [isActive, setIsActive] = useState(license.isActive !== false);
    const [productLicenseMapping, setProductLicenseMapping] = useState<{ [productId: string]: string[] }>(
        license.customAttrs?.productLicenseMapping || {}
    );

    // Group licenses by product
    const licensesByProduct = useMemo(() => {
        return availableProductLicenses.reduce((acc, lic) => {
            if (!acc[lic.productId]) {
                acc[lic.productId] = {
                    productName: lic.productName,
                    licenses: [],
                };
            }
            acc[lic.productId].licenses.push(lic);
            return acc;
        }, {} as { [productId: string]: { productName: string; licenses: ProductLicense[] } });
    }, [availableProductLicenses]);

    useEffect(() => {
        if (isEditing) {
            setName(license.name || '');
            setLevel(license.level || 1);
            setDescription(license.description || '');
            setIsActive(license.isActive !== false);
            setProductLicenseMapping(license.customAttrs?.productLicenseMapping || {});
        }
    }, [isEditing, license]);

    const handleSave = () => {
        if (!name.trim() || level <= 0) return;
        onSave({
            ...license,
            name: name.trim(),
            level,
            description: description.trim() || undefined,
            isActive,
            customAttrs: { productLicenseMapping },
        });
    };

    const handleLevelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value)) {
            setLevel(value);
        }
    };

    const handleProductLicenseChange = (productId: string, selected: string[]) => {
        const current = productLicenseMapping[productId] || [];
        const wasAll = current.includes(ALL_LICENSES_MARKER);
        const isAll = selected.includes(ALL_LICENSES_MARKER);

        if (!wasAll && isAll) {
            setProductLicenseMapping(prev => ({ ...prev, [productId]: [ALL_LICENSES_MARKER] }));
        } else if (wasAll && !isAll) {
            setProductLicenseMapping(prev => ({ ...prev, [productId]: [] }));
        } else if (wasAll && isAll && selected.length > 1) {
            const newSelection = selected.filter(id => id !== ALL_LICENSES_MARKER);
            setProductLicenseMapping(prev => ({ ...prev, [productId]: newSelection }));
        } else {
            setProductLicenseMapping(prev => ({ ...prev, [productId]: selected }));
        }
    };

    const getSelectedLicenses = (productId: string): string[] => {
        return productLicenseMapping[productId] || [];
    };

    const renderSelectedValues = (productId: string, selected: string[]) => {
        if (selected.includes(ALL_LICENSES_MARKER)) {
            return <Chip label="All Licenses" size="small" color="primary" />;
        }
        const productLicenses = licensesByProduct[productId]?.licenses || [];
        return (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map(licId => {
                    const lic = productLicenses.find(l => l.id === licId);
                    return lic ? <Chip key={licId} label={`${lic.name} (L${lic.level})`} size="small" /> : null;
                })}
            </Box>
        );
    };

    const getMappingInfo = () => {
        const mapping = license.customAttrs?.productLicenseMapping;
        if (!mapping || Object.keys(mapping).length === 0) return null;
        const productCount = Object.keys(mapping).length;
        const totalItems = Object.values(mapping).flat().length;
        const isAll = Object.values(mapping).flat().includes(ALL_LICENSES_MARKER);
        return isAll
            ? `Mapped to All Product Licenses`
            : `Mapped to ${totalItems} Licenses across ${productCount} Product(s)`;
    };

    if (isEditing) {
        return (
            <InlineForm onSave={handleSave} onCancel={onCancel} saveDisabled={!name.trim() || level <= 0}>
                <TextField
                    label="License Name"
                    size="small"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    fullWidth
                    autoFocus
                    required
                    placeholder="e.g., Essential, Professional, Enterprise"
                />
                <TextField
                    label="License Level"
                    size="small"
                    type="number"
                    value={level}
                    onChange={handleLevelChange}
                    fullWidth
                    required
                    inputProps={{ min: 1, step: 1 }}
                />
                <TextField
                    label="Description"
                    size="small"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    fullWidth
                    multiline
                    minRows={2}
                    placeholder="Describe what this license tier includes"
                />
                <FormControlLabel
                    control={<Switch checked={isActive} onChange={e => setIsActive(e.target.checked)} size="small" />}
                    label="Active"
                />

                {Object.keys(licensesByProduct).length > 0 && (
                    <>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            Map to Product Licenses
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Select which product licenses this solution license includes.
                        </Typography>
                        {Object.entries(licensesByProduct).map(([productId, { productName, licenses }]) => (
                            <FormControl key={productId} fullWidth size="small" sx={{ mt: 1 }}>
                                <InputLabel>{productName}</InputLabel>
                                <Select
                                    multiple
                                    value={getSelectedLicenses(productId)}
                                    onChange={e => handleProductLicenseChange(productId, e.target.value as string[])}
                                    input={<OutlinedInput label={productName} />}
                                    renderValue={selected => renderSelectedValues(productId, selected as string[])}
                                >
                                    <MenuItem value={ALL_LICENSES_MARKER}>
                                        <Checkbox checked={getSelectedLicenses(productId).includes(ALL_LICENSES_MARKER)} />
                                        <ListItemText primary="All Licenses" />
                                    </MenuItem>
                                    <Divider />
                                    {licenses.map(lic => (
                                        <MenuItem key={lic.id} value={lic.id}>
                                            <Checkbox checked={getSelectedLicenses(productId).includes(lic.id)} />
                                            <ListItemText primary={`${lic.name} (L${lic.level})`} secondary={lic.description} />
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        ))}
                    </>
                )}
            </InlineForm>
        );
    }

    const mappingInfo = getMappingInfo();

    return (
        <SortableEntityItem
            id={license.id || `new-${index}`}
            primary={`${license.name} (Level ${license.level})`}
            secondary={
                <Box>
                    {license.description && <Typography variant="body2">{license.description}</Typography>}
                    {mappingInfo && (
                        <Chip
                            label={mappingInfo}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }}
                        />
                    )}
                </Box>
            }
            badge={
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {license.isNew && <Chip label="New" size="small" color="success" variant="outlined" />}
                    {!license.isActive && <Chip label="Inactive" size="small" color="warning" variant="outlined" />}
                </Box>
            }
            onEdit={onStartEdit}
            onDelete={onDelete}
            isNew={license.isNew}
            disabled={dragDisabled}
        />
    );
}

// Add form for solution licenses
interface AddSolutionLicenseFormProps {
    onSave: (data: Omit<SolutionLicenseData, 'id'>) => void;
    onCancel: () => void;
    availableProductLicenses: ProductLicense[];
}

export function AddSolutionLicenseForm({ onSave, onCancel, availableProductLicenses }: AddSolutionLicenseFormProps) {
    const [name, setName] = useState('');
    const [level, setLevel] = useState(1);
    const [description, setDescription] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [productLicenseMapping, setProductLicenseMapping] = useState<{ [productId: string]: string[] }>({});

    // Group licenses by product
    const licensesByProduct = useMemo(() => {
        const grouped = availableProductLicenses.reduce((acc, lic) => {
            if (!acc[lic.productId]) {
                acc[lic.productId] = {
                    productName: lic.productName,
                    licenses: [],
                };
            }
            acc[lic.productId].licenses.push(lic);
            return acc;
        }, {} as { [productId: string]: { productName: string; licenses: ProductLicense[] } });

        // Initialize default mapping to all licenses
        const defaultMapping: { [productId: string]: string[] } = {};
        Object.keys(grouped).forEach(productId => {
            defaultMapping[productId] = [ALL_LICENSES_MARKER];
        });
        if (Object.keys(productLicenseMapping).length === 0 && Object.keys(defaultMapping).length > 0) {
            setProductLicenseMapping(defaultMapping);
        }

        return grouped;
    }, [availableProductLicenses]);

    const handleSave = () => {
        if (!name.trim() || level <= 0) return;
        onSave({
            name: name.trim(),
            level,
            description: description.trim() || undefined,
            isActive,
            isNew: true,
            customAttrs: { productLicenseMapping },
        });
    };

    const handleLevelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value)) {
            setLevel(value);
        }
    };

    const handleProductLicenseChange = (productId: string, selected: string[]) => {
        const current = productLicenseMapping[productId] || [];
        const wasAll = current.includes(ALL_LICENSES_MARKER);
        const isAll = selected.includes(ALL_LICENSES_MARKER);

        if (!wasAll && isAll) {
            setProductLicenseMapping(prev => ({ ...prev, [productId]: [ALL_LICENSES_MARKER] }));
        } else if (wasAll && !isAll) {
            setProductLicenseMapping(prev => ({ ...prev, [productId]: [] }));
        } else if (wasAll && isAll && selected.length > 1) {
            const newSelection = selected.filter(id => id !== ALL_LICENSES_MARKER);
            setProductLicenseMapping(prev => ({ ...prev, [productId]: newSelection }));
        } else {
            setProductLicenseMapping(prev => ({ ...prev, [productId]: selected }));
        }
    };

    const getSelectedLicenses = (productId: string): string[] => {
        return productLicenseMapping[productId] || [];
    };

    const renderSelectedValues = (productId: string, selected: string[]) => {
        if (selected.includes(ALL_LICENSES_MARKER)) {
            return <Chip label="All Licenses" size="small" color="primary" />;
        }
        const productLicenses = licensesByProduct[productId]?.licenses || [];
        return (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map(licId => {
                    const lic = productLicenses.find(l => l.id === licId);
                    return lic ? <Chip key={licId} label={`${lic.name} (L${lic.level})`} size="small" /> : null;
                })}
            </Box>
        );
    };

    return (
        <InlineForm onSave={handleSave} onCancel={onCancel} saveDisabled={!name.trim() || level <= 0} saveLabel="Add License">
            <TextField
                label="License Name"
                size="small"
                value={name}
                onChange={e => setName(e.target.value)}
                fullWidth
                autoFocus
                required
                placeholder="e.g., Essential, Professional, Enterprise"
            />
            <TextField
                label="License Level"
                size="small"
                type="number"
                value={level}
                onChange={handleLevelChange}
                fullWidth
                required
                inputProps={{ min: 1, step: 1 }}
            />
            <TextField
                label="Description"
                size="small"
                value={description}
                onChange={e => setDescription(e.target.value)}
                fullWidth
                multiline
                minRows={2}
                placeholder="Describe what this license tier includes"
            />
            <FormControlLabel
                control={<Switch checked={isActive} onChange={e => setIsActive(e.target.checked)} size="small" />}
                label="Active"
            />

            {Object.keys(licensesByProduct).length > 0 && (
                <>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Map to Product Licenses
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Select which product licenses this solution license includes.
                    </Typography>
                    {Object.entries(licensesByProduct).map(([productId, { productName, licenses }]) => (
                        <FormControl key={productId} fullWidth size="small" sx={{ mt: 1 }}>
                            <InputLabel>{productName}</InputLabel>
                            <Select
                                multiple
                                value={getSelectedLicenses(productId)}
                                onChange={e => handleProductLicenseChange(productId, e.target.value as string[])}
                                input={<OutlinedInput label={productName} />}
                                renderValue={selected => renderSelectedValues(productId, selected as string[])}
                            >
                                <MenuItem value={ALL_LICENSES_MARKER}>
                                    <Checkbox checked={getSelectedLicenses(productId).includes(ALL_LICENSES_MARKER)} />
                                    <ListItemText primary="All Licenses" />
                                </MenuItem>
                                <Divider />
                                {licenses.map(lic => (
                                    <MenuItem key={lic.id} value={lic.id}>
                                        <Checkbox checked={getSelectedLicenses(productId).includes(lic.id)} />
                                        <ListItemText primary={`${lic.name} (L${lic.level})`} secondary={lic.description} />
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    ))}
                </>
            )}
        </InlineForm>
    );
}
