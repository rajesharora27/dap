import { gql } from '@apollo/client';

export const CREATE_LICENSE = gql`
  mutation CreateLicense($input: LicenseInput!) {
    createLicense(input: $input) {
      id
      name
      description
      level
      isActive
      customAttrs
    }
  }
`;

export const UPDATE_LICENSE = gql`
  mutation UpdateLicense($id: ID!, $input: LicenseInput!) {
    updateLicense(id: $id, input: $input) {
      id
      name
      description
      level
      isActive
      customAttrs
    }
  }
`;

export const DELETE_LICENSE = gql`
  mutation DeleteLicense($id: ID!) {
    deleteLicense(id: $id)
  }
`;
