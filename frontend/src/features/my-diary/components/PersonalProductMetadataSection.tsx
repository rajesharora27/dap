import React, { useState } from 'react';

// Reuse shared tables from Products feature to ensure EXACT visual parity
import { OutcomesTable } from '@features/products/components/shared/OutcomesTable';
import { ReleasesTable } from '@features/products/components/shared/ReleasesTable';
import { ResourcesTable } from '@features/products/components/shared/ResourcesTable';
import { TagsTable } from '@features/products/components/shared/TagsTable';
import { LicensesTable } from '@features/products/components/shared/LicensesTable';
import { AttributesTable } from '@features/products/components/shared/AttributesTable';

import { usePersonalProductEditing } from '../hooks/usePersonalProductEditing';

interface Props {
    selectedProduct: any;
    selectedSubSection: string;
    externalAddMode: string | null;
    setExternalAddMode: (mode: string | null) => void;
    tasks: any[];
}

export function PersonalProductMetadataSection({
    selectedProduct,
    selectedSubSection,
    externalAddMode,
    setExternalAddMode,
    tasks
}: Props) {
    const productEditing = usePersonalProductEditing(selectedProduct?.id);

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
                        tasks={tasks}
                    />
                );
            case 'releases':
                // Adapter: PersonalRelease has 'version' (string), Table expects 'level' (number)
                const releaseItems = (selectedProduct.releases || []).map((r: any) => ({
                    ...r,
                    level: parseFloat(r.version) || 0
                }));

                return (
                    <ReleasesTable
                        items={releaseItems}
                        onUpdate={productEditing.handleReleaseUpdate}
                        onDelete={productEditing.handleReleaseDelete}
                        onCreate={productEditing.handleReleaseCreate}
                        onReorder={productEditing.handleReleaseReorder}
                        externalAddMode={externalAddMode === 'releases'}
                        onExternalAddComplete={() => setExternalAddMode(null)}
                        tasks={tasks}
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
                        onCreate={productEditing.handleTagCreate}
                        onUpdate={productEditing.handleTagUpdate}
                        onDelete={productEditing.handleTagDelete}
                        onReorder={productEditing.handleTagReorder}
                        externalAddMode={externalAddMode === 'tags'}
                        onExternalAddComplete={() => setExternalAddMode(null)}
                        tasks={tasks}
                    />
                );
            case 'licenses':
                return (
                    <LicensesTable
                        items={selectedProduct.licenses || []}
                        onCreate={productEditing.handleLicenseCreate}
                        onUpdate={productEditing.handleLicenseUpdate}
                        onDelete={productEditing.handleLicenseDelete}
                        onReorder={productEditing.handleLicenseReorder}
                        externalAddMode={externalAddMode === 'licenses'}
                        onExternalAddComplete={() => setExternalAddMode(null)}
                    />
                );
            case 'customAttributes':
                return (
                    <AttributesTable
                        items={productEditing.getAttributesList()}
                        onCreate={productEditing.handleAttributeCreate}
                        onUpdate={productEditing.handleAttributeUpdate}
                        onDelete={productEditing.handleAttributeDelete}
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
