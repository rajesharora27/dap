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

export const PRODUCT_TAGS = gql`
  query ProductTags($productId: ID!) {
   productTags(productId: $productId) {
     id
     name
     color
     description
     displayOrder
   }
  }
`;

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

export const CUSTOMER_PRODUCT_TAGS = gql`
  query CustomerProductTags($customerProductId: ID!) {
    customerProductTags(customerProductId: $customerProductId) {
      id
      name
      color
      description
      displayOrder
    }
  }
`;

export const EXPORT_PRODUCT_V2 = gql`
  query ExportProduct($productId: ID!) {
  exportProduct(productId: $productId) {
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
