# DAP Application Access Guide

## Available Access Methods

The DAP (Digital Adoption Platform) application is now accessible via multiple methods:

### 1. Hostname Access ✅ (VERIFIED WORKING)
- **URL**: http://centos1.rajarora.csslab:5173
- **Backend API**: http://centos1.rajarora.csslab:4000
- **GraphQL Endpoint**: http://centos1.rajarora.csslab:4000/graphql
- **Status**: Accessible from local subnet and external networks

### 2. IP Address Access
- **URL**: http://172.22.156.32:5173
- **Backend API**: http://172.22.156.32:4000
- **GraphQL Endpoint**: http://172.22.156.32:4000/graphql

### 3. Localhost Access
- **URL**: http://localhost:5173
- **Backend API**: http://localhost:4000
- **GraphQL Endpoint**: http://localhost:4000/graphql

### 4. Reverse Proxy Access
- **URL**: https://dap-8321890.ztna.sse.cisco.io
- **Alternative**: https://dap.cxsaaslab.com

## Configuration Details

### Frontend (Vite) Configuration
The frontend is configured to accept connections from:
- `centos1.rajarora.csslab` (direct hostname)
- `*.rajarora.csslab` (all subdomains)
- `dap-8321890.ztna.sse.cisco.io`
- `dap.cxsaaslab.com`
- `*.ztna.sse.cisco.io` (all ZTNA subdomains)
- `*.cxsaaslab.com` (all cxsaaslab.com subdomains)
- `172.22.156.32` (IP address)
- `localhost`

### Backend CORS Configuration
The backend is configured to allow all origins in development mode, making it accessible from any client.

### Network Binding
Both services are bound to `0.0.0.0` (all network interfaces), enabling external access:
- Frontend: Port 5173
- Backend: Port 4000

## Testing Access

You can verify access using:

```bash
# Test frontend
curl -I http://centos1.rajarora.csslab:5173

# Test backend health endpoint
curl http://centos1.rajarora.csslab:4000/health

# Test GraphQL endpoint
curl -X POST http://centos1.rajarora.csslab:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __typename }"}'
```

## Firewall Requirements

Ensure that the following ports are accessible:
- **5173**: Frontend (Vite dev server)
- **4000**: Backend (Express + Apollo GraphQL)
- **5432**: PostgreSQL database (if external access needed)

## Authentication

Currently, authentication is disabled in development mode:
- `DISABLE_AUTH: "true"`
- `NO_AUTH: "true"`

This means you can access all features without logging in.

## Notes

- The application is running in development mode with hot-reload enabled
- Backend uses `ts-node-dev` for automatic restarts on code changes
- Frontend uses Vite for fast development and HMR (Hot Module Replacement)
- All hostname patterns support wildcards for subdomain flexibility

