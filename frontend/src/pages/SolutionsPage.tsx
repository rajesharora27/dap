import React from 'react';
import { SolutionProvider } from '@features/solutions/context/SolutionContext';
import { SolutionsPageContent } from '@features/solutions/components/SolutionsPageContent';

export const SolutionsPage: React.FC = () => {
    return (
        <SolutionProvider>
            <SolutionsPageContent />
        </SolutionProvider>
    );
};
