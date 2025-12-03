# Deployment Instructions - Release 2.1.02

## Quick Deploy

```bash
# On centos2
cd /data/dap
tar xzf /tmp/release-20251202-092306.tar.gz --strip-components=1
cd backend && npm run build
cd /data/dap
./dap restart
sudo systemctl restart httpd
```

## Verification

```bash
curl -s http://localhost:4000/graphql -X POST \
  -H "Content-Type: application/json" \
  -d '{"query":"{ products { totalCount } }"}' | jq .
```

Expected: Products query returns successfully

## Rollback

```bash
./dap restore [backup-filename.sql]
```
