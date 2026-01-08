/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GRAPHQL_ENDPOINT: string;
  readonly VITE_FRONTEND_URL: string;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const __APP_VERSION__: string;
declare const __BUILD_TIMESTAMP__: string;

// Apollo Upload Client module declaration
declare module 'apollo-upload-client/createUploadLink.mjs' {
  import { ApolloLink } from '@apollo/client';
  
  interface UploadLinkOptions {
    uri?: string;
    fetch?: typeof fetch;
    fetchOptions?: RequestInit;
    headers?: Record<string, string>;
    includeExtensions?: boolean;
    credentials?: string;
  }
  
  export default function createUploadLink(options?: UploadLinkOptions): ApolloLink;
}