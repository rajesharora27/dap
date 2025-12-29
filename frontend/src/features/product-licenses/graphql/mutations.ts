import { gql } from '@apollo/client';

export const CREATE_LICENSE = gql`
  mutation CreateLicenseCore($input: LicenseInput!) {
    createLicense(input: $input) {
      id
      name
      description
      level
      isActive
      productId
      solutionId
      customAttrs
    }
  }
`;

export const UPDATE_LICENSE = gql`
  mutation UpdateLicenseCore($id: ID!, $input: LicenseInput!) {
    updateLicense(id: $id, input: $input) {
      id
      name
      description
      level
      isActive
      productId
      solutionId
      customAttrs
    }
  }
`;

export const DELETE_LICENSE = gql`
  mutation DeleteLicense($id: ID!) {
    deleteLicense(id: $id)
  }
`;

export const REORDER_LICENSES = gql`
  mutation ReorderLicenses($productId: ID, $solutionId: ID, $licenseIds: [ID!]!) {
    reorderLicenses(productId: $productId, solutionId: $solutionId, licenseIds: $licenseIds) {
      id
      name
      description
      level
      isActive
      displayOrder
    }
  }
`;
