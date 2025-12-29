import { gql } from '@apollo/client';

export const PRODUCTS = gql`
  query Products {
    products {
      edges {
        node {
          id
          name
          resources { label url }
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
      resources { label url }
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

export const PRODUCT_TASK_CONNECTION_FIELDS = gql`
  fragment ProductTaskConnectionFields on TaskConnection {
    edges {
      node {
        id
        name
        description
        status
        priority
        dueDate
        customAttrs
        assignees {
          id
          firstName
          lastName
        }
        tags {
          id
          name
          color
        }
        product {
          id
          name
        }
        release {
          id
          name
        }
        outcome {
          id
          name
        }
      }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
  }
`;

export const TASKS_FOR_PRODUCT = gql`
  query TasksForProductQuery($productId: ID!, $first: Int, $after: String, $last: Int, $before: String) {
    product(id: $productId) {
      id
      name
      tasks(first: $first, after: $after, last: $last, before: $before) {
        ...ProductTaskConnectionFields
      }
    }
  }
  ${PRODUCT_TASK_CONNECTION_FIELDS}
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

export const EXPORT_PRODUCT = gql`
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
