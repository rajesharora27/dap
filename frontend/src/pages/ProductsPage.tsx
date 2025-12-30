import React from 'react';
import { ProductProvider } from '@features/products/context/ProductContext';
import { ProductsPageContent } from '@features/products/components/ProductsPageContent';

export const ProductsPage: React.FC = () => {
    return (
        <ProductProvider>
            <ProductsPageContent />
        </ProductProvider>
    );
};
