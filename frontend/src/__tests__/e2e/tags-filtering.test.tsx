/*
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import { ProductsPage } from '../../pages/ProductsPage';
import { AuthProvider } from '@features/auth';
import { PRODUCTS } from '../../features/products/graphql/products.queries';
import { CREATE_PRODUCT_TAG } from '../../features/products/graphql/products.mutations';

// Mocks
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => jest.fn(),
}));

const mocks = [
    {
        request: {
            query: PRODUCTS,
        },
        result: {
            data: {
                products: {
                    edges: [
                        {
                            node: {
                                id: 'prod-1',
                                name: 'Test Product',
                                description: 'Test Desc',
                                statusPercent: 50,
                                completionPercentage: 50,
                                tags: [],
                                tasks: { edges: [] },
                                outcomes: [],
                                releases: [],
                                licenses: [],
                                solutions: []
                            }
                        }
                    ]
                }
            }
        }
    }
];

describe('Tags and Filtering E2E', () => {
    it('should render products page with tags tab', async () => {
        render(
            <MockedProvider mocks={mocks} addTypename={false}>
                <AuthProvider>
                    <ProductsPage onEditProduct={() => { }} />
                </AuthProvider>
            </MockedProvider>
        );

        // Wait for loading to finish
        // Note: Actual loading might depend on auth state. 
        // This is a placeholder structure. 
        // In a real E2E with AuthProvider mock, we'd need to simulate authenticated state.
    });
});
*/
