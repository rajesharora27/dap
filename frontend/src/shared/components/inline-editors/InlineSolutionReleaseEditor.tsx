import React, { useState, useEffect, useMemo } from 'react';
import {
    TextField,
    Box,
    Chip,
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

export interface SolutionReleaseData {
    id?: string;
    name: string;
    level: number;
    description?: string;
    isActive?: boolean;
    isNew?: boolean;
    delete?: boolean;
    customAttrs?: {
        productReleaseMapping?: { [productId: string]: string[] };
    };
}

export interface ProductRelease {
    id: string;
    name: string;
    level: number;
    productId: string;
    productName: string;
    description?: string;
}

const ALL_RELEASES_MARKER = '__ALL_RELEASES__';

interface InlineSolutionReleaseEditorProps {
    release: SolutionReleaseData;
    index: number;
    isEditing: boolean;
    onStartEdit: () => void;
    onSave: (data: SolutionReleaseData) => void;
    onCancel: () => void;
    onDelete: () => void;
    availableProductReleases: ProductRelease[];
    dragDisabled?: boolean;
}

export function InlineSolutionReleaseEditor({
    release,
    index,
    isEditing,
    onStartEdit,
    onSave,
    onCancel,
    onDelete,
    availableProductReleases,
    dragDisabled,
}: InlineSolutionReleaseEditorProps) {
    const [name, setName] = useState(release.name || '');
    const [level, setLevel] = useState(release.level || 1.0);
    const [description, setDescription] = useState(release.description || '');
    const [productReleaseMapping, setProductReleaseMapping] = useState<{ [productId: string]: string[] }>(
        release.customAttrs?.productReleaseMapping || {}
    );

    // Group releases by product
    const releasesByProduct = useMemo(() => {
        return availableProductReleases.reduce((acc, rel) => {
            if (!acc[rel.productId]) {
                acc[rel.productId] = {
                    productName: rel.productName,
                    releases: [],
                };
            }
            acc[rel.productId].releases.push(rel);
            return acc;
        }, {} as { [productId: string]: { productName: string; releases: ProductRelease[] } });
    }, [availableProductReleases]);

    useEffect(() => {
        if (isEditing) {
            setName(release.name || '');
            setLevel(release.level || 1.0);
            setDescription(release.description || '');
            setProductReleaseMapping(release.customAttrs?.productReleaseMapping || {});
        }
    }, [isEditing, release]);

    const handleSave = () => {
        if (!name.trim() || level <= 0) return;
        onSave({
            ...release,
            name: name.trim(),
            level,
            description: description.trim() || undefined,
            customAttrs: { productReleaseMapping },
        });
    };

    const handleLevelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value);
        if (!isNaN(value)) {
            setLevel(value);
        }
    };

    const handleProductReleaseChange = (productId: string, selected: string[]) => {
        if (selected.includes(ALL_RELEASES_MARKER)) {
            setProductReleaseMapping(prev => ({ ...prev, [productId]: [ALL_RELEASES_MARKER] }));
        } else {
            setProductReleaseMapping(prev => ({ ...prev, [productId]: selected }));
        }
    };

    const getSelectedReleases = (productId: string): string[] => {
        return productReleaseMapping[productId] || [];
    };

    const renderSelectedValues = (productId: string, selected: string[]) => {
        if (selected.includes(ALL_RELEASES_MARKER)) {
            return <Chip label="All Releases" size="small" color="primary" />;
        }
        const productReleases = releasesByProduct[productId]?.releases || [];
        return (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map(relId => {
                    const rel = productReleases.find(r => r.id === relId);
                    return rel ? <Chip key={relId} label={`${rel.name} (v${rel.level})`} size="small" /> : null;
                })}
            </Box>
        );
    };

    const getMappingInfo = () => {
        const mapping = release.customAttrs?.productReleaseMapping;
        if (!mapping || Object.keys(mapping).length === 0) return null;
        const productCount = Object.keys(mapping).length;
        const totalItems = Object.values(mapping).flat().length;
        const isAll = Object.values(mapping).flat().includes(ALL_RELEASES_MARKER);
        return isAll
            ? `Mapped to All Product Releases`
            : `Mapped to ${totalItems} Releases across ${productCount} Product(s)`;
    };

    if (isEditing) {
        return (
            <InlineForm onSave={handleSave} onCancel={onCancel} saveDisabled={!name.trim() || level <= 0}>
                <TextField
                    label="Solution Release Name"
                    size="small"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    fullWidth
                    autoFocus
                    required
                    placeholder="e.g., Enterprise Bundle v2.0"
                />
                <TextField
                    label="Release Level"
                    size="small"
                    type="number"
                    value={level}
                    onChange={handleLevelChange}
                    fullWidth
                    required
                    inputProps={{ min: 0.1, step: 0.1 }}
                    helperText="Version number (e.g., 1.0, 2.5)"
                />
                <TextField
                    label="Description"
                    size="small"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    fullWidth
                    multiline
                    minRows={2}
                    placeholder="Describe this solution release..."
                />

                {Object.keys(releasesByProduct).length > 0 && (
                    <>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            Map to Product Releases
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Select which product releases this solution release includes.
                        </Typography>
                        {Object.entries(releasesByProduct).map(([productId, { productName, releases }]) => (
                            <FormControl key={productId} fullWidth size="small" sx={{ mt: 1 }}>
                                <InputLabel>{productName}</InputLabel>
                                <Select
                                    multiple
                                    value={getSelectedReleases(productId)}
                                    onChange={e => handleProductReleaseChange(productId, e.target.value as string[])}
                                    input={<OutlinedInput label={productName} />}
                                    renderValue={selected => renderSelectedValues(productId, selected as string[])}
                                >
                                    <MenuItem value={ALL_RELEASES_MARKER}>
                                        <Checkbox checked={getSelectedReleases(productId).includes(ALL_RELEASES_MARKER)} />
                                        <ListItemText primary="All Releases" />
                                    </MenuItem>
                                    <Divider />
                                    {releases.map(rel => (
                                        <MenuItem
                                            key={rel.id}
                                            value={rel.id}
                                            disabled={getSelectedReleases(productId).includes(ALL_RELEASES_MARKER)}
                                        >
                                            <Checkbox
                                                checked={getSelectedReleases(productId).includes(rel.id)}
                                                disabled={getSelectedReleases(productId).includes(ALL_RELEASES_MARKER)}
                                            />
                                            <ListItemText primary={`${rel.name} (v${rel.level})`} secondary={rel.description} />
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
            id={release.id || `new-${index}`}
            primary={release.name}
            secondary={
                <Box>
                    <Typography variant="body2">Level: {release.level}{release.description ? ` - ${release.description}` : ''}</Typography>
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
            badge={release.isNew ? <Chip label="New" size="small" color="success" variant="outlined" /> : undefined}
            onEdit={onStartEdit}
            onDelete={onDelete}
            isNew={release.isNew}
            disabled={dragDisabled}
        />
    );
}

// Add form for solution releases
interface AddSolutionReleaseFormProps {
    onSave: (data: Omit<SolutionReleaseData, 'id'>) => void;
    onCancel: () => void;
    availableProductReleases: ProductRelease[];
}

export function AddSolutionReleaseForm({ onSave, onCancel, availableProductReleases }: AddSolutionReleaseFormProps) {
    const [name, setName] = useState('');
    const [level, setLevel] = useState(1.0);
    const [description, setDescription] = useState('');
    const [productReleaseMapping, setProductReleaseMapping] = useState<{ [productId: string]: string[] }>({});

    // Group releases by product
    const releasesByProduct = useMemo(() => {
        const grouped = availableProductReleases.reduce((acc, rel) => {
            if (!acc[rel.productId]) {
                acc[rel.productId] = {
                    productName: rel.productName,
                    releases: [],
                };
            }
            acc[rel.productId].releases.push(rel);
            return acc;
        }, {} as { [productId: string]: { productName: string; releases: ProductRelease[] } });

        // Initialize default mapping to all releases
        const defaultMapping: { [productId: string]: string[] } = {};
        Object.keys(grouped).forEach(productId => {
            defaultMapping[productId] = [ALL_RELEASES_MARKER];
        });
        if (Object.keys(productReleaseMapping).length === 0 && Object.keys(defaultMapping).length > 0) {
            setProductReleaseMapping(defaultMapping);
        }

        return grouped;
    }, [availableProductReleases]);

    const handleSave = () => {
        if (!name.trim() || level <= 0) return;
        onSave({
            name: name.trim(),
            level,
            description: description.trim() || undefined,
            isNew: true,
            isActive: true,
            customAttrs: { productReleaseMapping },
        });
    };

    const handleLevelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value);
        if (!isNaN(value)) {
            setLevel(value);
        }
    };

    const handleProductReleaseChange = (productId: string, selected: string[]) => {
        if (selected.includes(ALL_RELEASES_MARKER)) {
            setProductReleaseMapping(prev => ({ ...prev, [productId]: [ALL_RELEASES_MARKER] }));
        } else {
            setProductReleaseMapping(prev => ({ ...prev, [productId]: selected }));
        }
    };

    const getSelectedReleases = (productId: string): string[] => {
        return productReleaseMapping[productId] || [];
    };

    const renderSelectedValues = (productId: string, selected: string[]) => {
        if (selected.includes(ALL_RELEASES_MARKER)) {
            return <Chip label="All Releases" size="small" color="primary" />;
        }
        const productReleases = releasesByProduct[productId]?.releases || [];
        return (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map(relId => {
                    const rel = productReleases.find(r => r.id === relId);
                    return rel ? <Chip key={relId} label={`${rel.name} (v${rel.level})`} size="small" /> : null;
                })}
            </Box>
        );
    };

    return (
        <InlineForm onSave={handleSave} onCancel={onCancel} saveDisabled={!name.trim() || level <= 0} saveLabel="Add Release">
            <TextField
                label="Solution Release Name"
                size="small"
                value={name}
                onChange={e => setName(e.target.value)}
                fullWidth
                autoFocus
                required
                placeholder="e.g., Enterprise Bundle v2.0"
            />
            <TextField
                label="Release Level"
                size="small"
                type="number"
                value={level}
                onChange={handleLevelChange}
                fullWidth
                required
                inputProps={{ min: 0.1, step: 0.1 }}
                helperText="Version number (e.g., 1.0, 2.5)"
            />
            <TextField
                label="Description"
                size="small"
                value={description}
                onChange={e => setDescription(e.target.value)}
                fullWidth
                multiline
                minRows={2}
                placeholder="Describe this solution release..."
            />

            {Object.keys(releasesByProduct).length > 0 && (
                <>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Map to Product Releases
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Select which product releases this solution release includes.
                    </Typography>
                    {Object.entries(releasesByProduct).map(([productId, { productName, releases }]) => (
                        <FormControl key={productId} fullWidth size="small" sx={{ mt: 1 }}>
                            <InputLabel>{productName}</InputLabel>
                            <Select
                                multiple
                                value={getSelectedReleases(productId)}
                                onChange={e => handleProductReleaseChange(productId, e.target.value as string[])}
                                input={<OutlinedInput label={productName} />}
                                renderValue={selected => renderSelectedValues(productId, selected as string[])}
                            >
                                <MenuItem value={ALL_RELEASES_MARKER}>
                                    <Checkbox checked={getSelectedReleases(productId).includes(ALL_RELEASES_MARKER)} />
                                    <ListItemText primary="All Releases" />
                                </MenuItem>
                                <Divider />
                                {releases.map(rel => (
                                    <MenuItem
                                        key={rel.id}
                                        value={rel.id}
                                        disabled={getSelectedReleases(productId).includes(ALL_RELEASES_MARKER)}
                                    >
                                        <Checkbox
                                            checked={getSelectedReleases(productId).includes(rel.id)}
                                            disabled={getSelectedReleases(productId).includes(ALL_RELEASES_MARKER)}
                                        />
                                        <ListItemText primary={`${rel.name} (v${rel.level})`} secondary={rel.description} />
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
