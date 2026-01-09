
# Viewer Role Security Verification

## 1. Role Capabilities
| Feature | Viewer Status | Implementation |
|---------|---------------|----------------|
| **Navigation** | ✅ Visible | Read-only access to Products, Solutions, Customers |
| **View Data** | ✅ Allowed | `checkUserPermission` grants READ access for VIEWER |
| **Edit/Delete Tasks** | ❌ Blocked | `ensureRole(['ADMIN', 'SME'])` on mutations |
| **Edit/Delete Telemetry** | ❌ Blocked | `ensureRole(['ADMIN', 'SME'])` on mutations |
| **Manage Outcomes** | ❌ Blocked | `ensureRole(['ADMIN', 'SME'])` on mutations |
| **Import/Export** | ❌ Blocked | `ensureRole(['ADMIN', 'SME'])` on mutations |
| **Solution Tasks** | ❌ Blocked | `ensureRole(['ADMIN', 'CSS'])` on mutations |

## 2. Technical Changes
- **Backend Auth**: `src/lib/auth.ts` now enforces RBAC strictly (throws error instead of warning).
- **Resolver Security**: Added explicit `ensureRole` checks to all critical mutations in `index.ts`, `telemetry/resolvers.ts`, and `solutionAdoption.ts`.
- **Role Cleanup**: Removed `CS` role references, standardized on `CSS`.

## 3. Verification Command
To verify yourself, log in as a Viewer and run these checks:

```bash
# 1. Login as Viewer
TOKEN=$(curl -s http://localhost:4000/graphql -X POST -H "Content-Type: application/json" -d '{"query":"mutation { simpleLogin(username: \"rouser\", password: \"DAP123\") }"}' | jq -r '.data.simpleLogin')

# 2. Check Read Access (Should return data)
curl -s http://localhost:4000/graphql -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"query":"{ products { totalCount } }"}'

# 3. Check Write Block (Should return "Access denied")
curl -s http://localhost:4000/graphql -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"query":"mutation { updateTask(id: \"t1\", input: { name: \"test\" }) { id } }"}'
```
