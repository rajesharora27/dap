/**
 * Product GraphQL Queries
 */

import { gql } from '@apollo/client';

export const GET_PRODUCTS = gql`
  query GetProducts {
    products {
      id
      name
      description
      statusPercent
      customAttrs
      createdAt
      updatedAt
    }
  }
`;

export const GET_PRODUCT = gql`
  query GetProduct($id: ID!) {
    product(id: $id) {
      id
      name
      description
      statusPercent
      customAttrs
      tasks {
        id
        name
        description
      }
      licenses {
        id
        name
        level
      }
      releases {
        id
        name
        level
      }
      outcomes {
        id
        name
      }
      createdAt
      updatedAt
    }
  }
`;

export const EXPORT_PRODUCT_TO_EXCEL = gql`
  query ExportProductToExcel($productId: ID!) {
    exportProductToExcel(productId: $productId)
  }
`;
