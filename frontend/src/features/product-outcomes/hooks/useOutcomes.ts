import { gql, useQuery } from '@apollo/client';

export const OUTCOMES_QUERY = gql`
  query ProductOutcomes($productId: ID) {
    outcomes(productId: $productId) {
      id
      name
      product {
        id
        name
      }
    }
  }
`;

export function useOutcomes(productId?: string) {
    const { data, loading, error, refetch } = useQuery(OUTCOMES_QUERY, {
        variables: { productId },
        skip: !productId,
        errorPolicy: 'all'
    });

    return {
        outcomes: data?.outcomes || [],
        loading,
        error,
        refetch
    };
}
