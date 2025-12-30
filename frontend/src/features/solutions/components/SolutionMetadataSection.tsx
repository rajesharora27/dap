import React from 'react';
import { useSolutionContext } from '../context/SolutionContext';
import { useSolutionEditing } from '../hooks/useSolutionEditing';

import { OutcomesTable } from '@features/products/components/shared/OutcomesTable';
import { TagsTable } from '@features/products/components/shared/TagsTable';
import { ResourcesTable } from '@features/products/components/shared/ResourcesTable';
import { ReleasesTable } from '@features/products/components/shared/ReleasesTable';
import { LicensesTable } from '@features/products/components/shared/LicensesTable';
import { AttributesTable } from '@features/products/components/shared/AttributesTable';

export function SolutionMetadataSection() {
    const {
        selectedSolution,
        selectedSubSection,
        externalAddMode,
        setExternalAddMode
    } = useSolutionContext();

    const solutionEditing = useSolutionEditing(selectedSolution?.id || null);

    if (!selectedSolution) return null;

    const renderContent = () => {
        switch (selectedSubSection) {
            case 'outcomes':
                return (
                    <OutcomesTable
                        items={selectedSolution.outcomes || []}
                        onUpdate={solutionEditing.handleOutcomeUpdate}
                        onDelete={solutionEditing.handleOutcomeDelete}
                        onCreate={solutionEditing.handleOutcomeCreate}
                        onReorder={solutionEditing.handleOutcomeReorder}
                        externalAddMode={externalAddMode === 'outcomes'}
                        onExternalAddComplete={() => setExternalAddMode(null)}
                    />
                );
            case 'releases':
                return (
                    <ReleasesTable
                        items={selectedSolution.releases || []}
                        onUpdate={solutionEditing.handleReleaseUpdate}
                        onDelete={solutionEditing.handleReleaseDelete}
                        onCreate={solutionEditing.handleReleaseCreate}
                        // Solution releases are not reorderable in the same persistent way or handled differently currently, 
                        // but useSolutionEditing does not export reorderReleases so passing undefined (or implement if needed)
                        // Wait, SolutionsPage has no release reordering, so we skip it.
                        onReorder={() => { }}
                        externalAddMode={externalAddMode === 'releases'}
                        onExternalAddComplete={() => setExternalAddMode(null)}
                    />
                );
            case 'licenses':
                return (
                    <LicensesTable
                        items={selectedSolution.licenses || []}
                        onUpdate={solutionEditing.handleLicenseUpdate}
                        onDelete={solutionEditing.handleLicenseDelete}
                        onCreate={solutionEditing.handleLicenseCreate}
                        // Solution licenses are not reorderable via mutation in useSolutionEditing
                        onReorder={() => { }}
                        externalAddMode={externalAddMode === 'licenses'}
                        onExternalAddComplete={() => setExternalAddMode(null)}
                    />
                );
            case 'resources':
                return (
                    <ResourcesTable
                        items={selectedSolution.resources || []}
                        onUpdate={solutionEditing.handleResourceUpdate}
                        onDelete={solutionEditing.handleResourceDelete}
                        onCreate={solutionEditing.handleResourceCreate}
                        onReorder={solutionEditing.handleResourceReorder}
                        externalAddMode={externalAddMode === 'resources'}
                        onExternalAddComplete={() => setExternalAddMode(null)}
                    />
                );
            case 'tags':
                return (
                    <TagsTable
                        items={selectedSolution.tags || []}
                        onUpdate={solutionEditing.handleTagUpdate}
                        onDelete={solutionEditing.handleTagDelete}
                        onCreate={solutionEditing.handleTagCreate}
                        onReorder={solutionEditing.handleTagReorder}
                        externalAddMode={externalAddMode === 'tags'}
                        onExternalAddComplete={() => setExternalAddMode(null)}
                    />
                );
            case 'customAttributes':
                return (
                    <AttributesTable
                        items={solutionEditing.getAttributesList(selectedSolution.customAttrs)}
                        onUpdate={solutionEditing.handleAttributeUpdate}
                        onDelete={solutionEditing.handleAttributeDelete}
                        onCreate={solutionEditing.handleAttributeCreate}
                        onReorder={solutionEditing.handleAttributeReorder}
                        externalAddMode={externalAddMode === 'customAttributes'}
                        onExternalAddComplete={() => setExternalAddMode(null)}
                    />
                );
            default:
                return null;
        }
    };

    return renderContent();
}
