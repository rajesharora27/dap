import { gql } from '@apollo/client';

export const PRODUCTS = gql`
  query Products {
    products {
      edges {
        node {
          id
          name
          description
          statusPercent
          customAttrs
          licenses {
            id
            name
            description
            level
            isActive
          }
          releases {
            id
            name
            description
            level
            isActive
            customAttrs
          }
          outcomes {
            id
            name
            description
          }
        }
      }
    }
  }
`;

export const PRODUCT = gql`
  query ProductDetail($id: ID!) {
    product(id: $id) {
      id
      name
      description
      statusPercent
      customAttrs
      licenses {
        id
        name
        description
        level
        isActive
        customAttrs
      }
      releases {
        id
        name
        description
        level
        isActive
        customAttrs
      }
      outcomes {
        id
        name
        description
      }
      tags {
        id
        name
        color
        description
        displayOrder
      }
    }
  }
`;

export const EXPORT_PRODUCT_TO_EXCEL = gql`
  query ExportProductToExcel($productName: String!) {
    exportProductToExcel(productName: $productName) {
      filename
      content
      mimeType
      size
      stats {
        tasksExported
        customAttributesExported
        licensesExported
        outcomesExported
        releasesExported
        telemetryAttributesExported
      }
    }
  }
`;

// Aliases for transition
export const GET_PRODUCTS = PRODUCTS;
export const GET_PRODUCT = PRODUCT;

export const OUTCOMES = gql`
  query Outcomes($productId: ID) {
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
