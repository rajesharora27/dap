import gql from 'graphql-tag';

export const aiTypeDefs = gql`
  type AIQueryMetadata {
    executionTime: Int!
    rowCount: Int!
    truncated: Boolean!
    cached: Boolean!
    templateUsed: String
    providerUsed: String
  }

  type AIQueryResponse {
    answer: String!
    data: JSON
    query: String
    suggestions: [String!]
    error: String
    metadata: AIQueryMetadata
  }

  type AIAgentAvailability {
    available: Boolean!
    message: String!
  }

  type AIDataContextRefreshResult {
    success: Boolean!
    lastRefreshed: DateTime
    statistics: AIDataContextStatistics
    error: String
  }
  
  type AIDataContextStatistics {
    totalProducts: Int!
    totalSolutions: Int!
    totalCustomers: Int!
    totalTasks: Int!
    totalTasksWithTelemetry: Int!
    totalTasksWithoutTelemetry: Int!
    totalAdoptionPlans: Int!
  }
  
  type AIDataContextStatus {
    initialized: Boolean!
    lastRefreshed: DateTime
    hasDataContext: Boolean!
  }

  extend type Query {
    isAIAgentAvailable: AIAgentAvailability!
    askAI(question: String!, conversationId: String): AIQueryResponse!
    aiDataContextStatus: AIDataContextStatus!
  }

  extend type Mutation {
    refreshAIDataContext: AIDataContextRefreshResult!
  }
`;
