import * as React from 'react';
import { useQuery } from '@apollo/client';
import { CUSTOMERS } from '../graphql/queries';

export function useCustomerData(selectedCustomerId?: string | null) {
    const { data, loading, error, refetch } = useQuery(CUSTOMERS, {
        fetchPolicy: 'cache-and-network',
    });

    const selectedCustomer = React.useMemo(() =>
        data?.customers?.find((c: any) => c.id === selectedCustomerId),
        [data?.customers, selectedCustomerId]
    );

    const overviewMetrics = React.useMemo(() => {
        if (!selectedCustomer) {
            return {
                adoption: 0,
                velocity: 0,
                totalTasks: 0,
                completedTasks: 0,
                productsCount: 0,
                solutionsCount: 0,
                directProductsCount: 0,
                solutionProductsCount: 0
            };
        }

        const products = selectedCustomer.products || [];
        const solutions = selectedCustomer.solutions || [];

        const totalProgress = products.reduce((acc: number, p: any) => acc + (p.adoptionPlan?.progressPercentage || 0), 0);
        const avgAdoption = products.length > 0 ? totalProgress / products.length : 0;

        const totalTasks = products.reduce((acc: number, p: any) => acc + (p.adoptionPlan?.totalTasks || 0), 0);
        const completedTasks = products.reduce((acc: number, p: any) => acc + (p.adoptionPlan?.completedTasks || 0), 0);

        const directProductsCount = products.filter((p: any) => !p.customerSolutionId).length;
        const solutionProductsCount = products.filter((p: any) => !!p.customerSolutionId).length;

        // Note: Velocity (tasks in last 30 days) requires drill-down data not in CUSTOMERS query.
        // For now, calculating based on current summary data if available, else 0.
        // If the backend doesn't provide updatedAt for adoptionPlan or tasks in this query, we can't be precise here.
        const velocity = 0;

        return {
            adoption: avgAdoption,
            velocity,
            totalTasks,
            completedTasks,
            productsCount: products.length,
            solutionsCount: solutions.length,
            directProductsCount,
            solutionProductsCount
        };
    }, [selectedCustomer]);

    return {
        customers: data?.customers || [],
        selectedCustomer,
        overviewMetrics,
        loading,
        error,
        refetch
    };
}
