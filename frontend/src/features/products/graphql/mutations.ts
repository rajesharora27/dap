/**
 * Product GraphQL Mutations
 */

import { gql } from '@apollo/client';

export const CREATE_PRODUCT = gql`
  mutation CreateProduct($input: ProductInput!) {
    createProduct(input: $input) {
      id
      name
      description
      statusPercent
    }
  }
`;

export const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($id: ID!, $input: ProductInput!) {
    updateProduct(id: $id, input: $input) {
      id
      name
      description
      statusPercent
      customAttrs
    }
  }
`;

export const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: ID!) {
    deleteProduct(id: $id)
  }
`;

export const IMPORT_PRODUCT_FROM_EXCEL = gql`
  mutation ImportProductFromExcel($content: String!, $mode: ImportMode!) {
    importProductFromExcel(content: $content, mode: $mode) {
      success
      productId
      productName
      stats {
        tasksImported
        outcomesImported
        releasesImported
        licensesImported
        customAttributesImported
        telemetryAttributesImported
      }
      errors {
        sheet
        row
        column
        field
        message
        severity
      }
      warnings {
        sheet
        row
        column
        field
        message
        severity
      }
    }
  }
`;

// Product Tag Mutations
export const CREATE_PRODUCT_TAG = gql`
  mutation CreateProductTag($input: ProductTagInput!) {
    createProductTag(input: $input) {
      id
      productId
      name
      color
      description
      displayOrder
    }
  }
`;

export const UPDATE_PRODUCT_TAG = gql`
  mutation UpdateProductTag($id: ID!, $input: ProductTagUpdateInput!) {
    updateProductTag(id: $id, input: $input) {
      id
      productId
      name
      color
      description
      displayOrder
    }
  }
`;

export const DELETE_PRODUCT_TAG = gql`
  mutation DeleteProductTag($id: ID!) {
    deleteProductTag(id: $id)
  }
`;
