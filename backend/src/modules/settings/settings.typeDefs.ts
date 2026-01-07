/**
 * Settings GraphQL Schema
 */

import { gql } from 'graphql-tag';

export const settingsTypeDefs = gql`
    type AppSetting {
        id: ID!
        key: String!
        value: String!
        dataType: String!
        category: String!
        label: String!
        description: String
        isSecret: Boolean!
        updatedAt: DateTime!
        updatedBy: String
    }

    input UpdateSettingInput {
        key: String!
        value: String!
    }

    extend type Query {
        appSettings(category: String): [AppSetting!]!
        appSetting(key: String!): AppSetting
    }

    extend type Mutation {
        updateSetting(input: UpdateSettingInput!): AppSetting!
        resetSetting(key: String!): AppSetting!
    }
`;
