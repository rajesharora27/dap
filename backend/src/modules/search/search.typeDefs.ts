import gql from 'graphql-tag';

export const searchTypeDefs = gql`
  union SearchResult = Product | Task | Solution | Customer

  extend type Query {
    search(query: String!, first: Int = 20, after: String): [SearchResult!]!
  }
`;
