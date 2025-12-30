import React from 'react';

import { useProductContext } from '../context/ProductContext';
import { useProductEditing } from '../hooks/useProductEditing';

import { OutcomesTable } from './shared/OutcomesTable';
import { TagsTable } from './shared/TagsTable';
import { ResourcesTable } from './shared/ResourcesTable';
import { ReleasesTable } from './shared/ReleasesTable';
import { LicensesTable } from './shared/LicensesTable';
import { AttributesTable } from './shared/AttributesTable';

export function ProductMetadataSection() {
    const {
        selectedProduct,
        selectedSubSection,
        externalAddMode,
        setExternalAddMode
    } = useProductContext();

    const productEditing = useProductEditing(selectedProduct?.id || null);

    if (!selectedProduct) return null;

    const renderContent = () => {
        switch (selectedSubSection) {
            case 'outcomes':
                return (
                    <OutcomesTable
                        items={selectedProduct.outcomes || []}
                        onUpdate={productEditing.handleOutcomeUpdate}
                        onDelete={productEditing.handleOutcomeDelete}
                        onCreate={productEditing.handleOutcomeCreate}
                        onReorder={productEditing.handleOutcomeReorder}
                        externalAddMode={externalAddMode === 'outcomes'}
                        onExternalAddComplete={() => setExternalAddMode(null)}
                    />
                );
            case 'releases':
                return (
                    <ReleasesTable
                        items={selectedProduct.releases || []}
                        onUpdate={productEditing.handleReleaseUpdate}
                        onDelete={productEditing.handleReleaseDelete}
                        onCreate={productEditing.handleReleaseCreate}
                        onReorder={productEditing.handleReleaseReorder}
                        externalAddMode={externalAddMode === 'releases'}
                        onExternalAddComplete={() => setExternalAddMode(null)}
                    />
                );
            case 'licenses':
                return (
                    <LicensesTable
                        items={selectedProduct.licenses || []}
                        onUpdate={productEditing.handleLicenseUpdate}
                        onDelete={productEditing.handleLicenseDelete}
                        onCreate={productEditing.handleLicenseCreate}
                        onReorder={productEditing.handleLicenseReorder}
                        externalAddMode={externalAddMode === 'licenses'}
                        onExternalAddComplete={() => setExternalAddMode(null)}
                    />
                );
            case 'resources':
                return (
                    <ResourcesTable
                        items={selectedProduct.resources || []}
                        onUpdate={productEditing.handleResourceUpdate}
                        onDelete={productEditing.handleResourceDelete}
                        onCreate={productEditing.handleResourceCreate}
                        onReorder={productEditing.handleResourceReorder}
                        externalAddMode={externalAddMode === 'resources'}
                        onExternalAddComplete={() => setExternalAddMode(null)}
                    />
                );
            case 'tags':
                return (
                    <TagsTable
                        items={selectedProduct.tags || []}
                        onUpdate={productEditing.handleTagUpdate}
                        onDelete={productEditing.handleTagDelete}
                        onCreate={productEditing.handleTagCreate}
                        onReorder={productEditing.handleTagReorder}
                        externalAddMode={externalAddMode === 'tags'}
                        onExternalAddComplete={() => setExternalAddMode(null)}
                    />
                );
            case 'customAttributes':
                return (
                    <AttributesTable
                        items={productEditing.getAttributesList(selectedProduct.customAttrs)}
                        onUpdate={productEditing.handleAttributeUpdate}
                        onDelete={productEditing.handleAttributeDelete}
                        onCreate={productEditing.handleAttributeCreate}
                        onReorder={productEditing.handleAttributeReorder}
                        externalAddMode={externalAddMode === 'customAttributes'}
                        onExternalAddComplete={() => setExternalAddMode(null)}
                    />
                );
            default:
                return null;
        }
    };

    if (selectedSubSection === 'summary' || selectedSubSection === 'tasks') {
        return null;
    }

    return renderContent();
}
