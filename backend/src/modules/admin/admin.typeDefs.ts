import gql from 'graphql-tag';

export const adminTypeDefs = gql`
  type UserWithPermissions {
    id: ID!
    email: String!
    username: String!
    fullName: String
    role: Role!
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
    permissions: [Permission!]!
    roles: [RoleWithPermissions!]!
  }

  type UserExtended {
    id: ID!
    email: String!
    username: String!
    fullName: String
    role: Role!
    isAdmin: Boolean!
    isActive: Boolean!
    mustChangePassword: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
    permissions: [Permission!]!
    roles: [String!]!
  }

  type Permission {
    id: ID!
    resourceType: String!
    resourceId: String
    permissionLevel: String!
  }

  type RolePermission {
    resourceType: String!
    resourceId: String
    permissionLevel: String!
  }

  type RoleWithPermissions {
    id: ID!
    name: String!
    description: String
    userCount: Int
    users: [UserBasic!]
    permissions: [RolePermission!]!
  }

  type UserBasic {
    id: ID!
    username: String!
    fullName: String
    email: String!
  }

  type AvailableResource {
    id: ID!
    name: String!
    type: String!
  }

  input ResourcePermissionInput {
    resourceType: String!
    resourceId: String
    permissionLevel: String!
  }

  input CreateRoleInput {
    name: String!
    description: String
    permissions: [ResourcePermissionInput!]
  }

  input UpdateRoleInput {
    name: String
    description: String
    permissions: [ResourcePermissionInput!]
  }

  input GrantPermissionInput {
    userId: ID!
    resourceType: String!
    resourceId: ID
    permissionLevel: String!
  }

  input ChangePasswordInput {
    userId: ID!
    oldPassword: String
    newPassword: String!
  }

  type AuditLogEntry {
    id: ID!
    userId: ID
    action: String!
    resourceType: String
    resourceId: ID
    details: String
    ipAddress: String
    createdAt: String!
  }

  extend type Query {
    me: UserExtended
    users: [UserExtended!]!
    user(id: ID!): UserWithPermissions
    myPermissions: [Permission!]!
    roles: [RoleWithPermissions!]!
    role(id: ID!): RoleWithPermissions
    userRoles(userId: ID!): [RoleWithPermissions!]!
    availableResources(resourceType: String): [AvailableResource!]!
  }

  extend type Mutation {
    loginExtended(username: String!, password: String!): LoginResponse!
    logout: Boolean!
    refreshToken(refreshToken: String!): AuthTokens!
    createUser(input: CreateUserInput!): UserExtended!
    updateUser(userId: ID!, input: UpdateUserInput!): UserExtended!
    deleteUser(userId: ID!): Boolean!
    changePassword(input: ChangePasswordInput!): Boolean!
    resetPasswordToDefault(userId: ID!): Boolean!
    createRole(input: CreateRoleInput!): RoleWithPermissions!
    updateRole(roleId: ID!, input: UpdateRoleInput!): RoleWithPermissions!
    deleteRole(roleId: ID!): Boolean!
    assignRoleToUser(userId: ID!, roleId: ID!): Boolean!
    removeRoleFromUser(userId: ID!, roleId: ID!): Boolean!
    grantPermission(input: GrantPermissionInput!): Boolean!
    revokePermission(userId: ID!, resourceType: String!, resourceId: ID): Boolean!
    activateUser(userId: ID!): Boolean!
    deactivateUser(userId: ID!): Boolean!
    updateRolePermissions(roleId: ID, roleName: String, permissions: [ResourcePermissionInput!]!): RoleWithPermissions!
  }

  type LoginResponse {
    token: String!
    refreshToken: String!
    user: UserExtended!
  }

  type AuthTokens {
    token: String!
    refreshToken: String!
  }

  input CreateUserInput {
    email: String!
    username: String!
    password: String!
    fullName: String
    role: Role = USER
  }

  input UpdateUserInput {
    email: String
    username: String
    fullName: String
    role: Role
  }
`;
