# Quick Deploy Guide - DEV to PROD

## 🚀 Standard Release (Recommended)

### On DEV (centos1):

```bash
cd /data/dap

# Step 1: Create release package
./deploy/create-release.sh
# Follow prompts to enter version and description

# Step 2: Deploy to production
./deploy/release-to-prod.sh releases/release-YYYYMMDD-HHMMSS.tar.gz
# Type 'yes' to confirm
```

**Done!** The script handles everything automatically.

---

## ⚡ Quick Patch (For Small Fixes)

### For quick fixes without full release process:

```bash
cd /data/dap

# Use the patch script
./APPLY_RBAC_PATCH.sh
```

This transfers only changed files and restarts services.

---

## 🔧 Manual Deployment (Advanced)

### If scripts fail, deploy manually:

#### 1. On DEV (centos1) - Build and prepare:
```bash
cd /data/dap

# Build backend
cd backend && npm run build

# Build frontend
cd ../frontend && npm run build
```

#### 2. Transfer files to PROD:
```bash
# Backend source
scp -r backend/src rajarora@centos2.rajarora.csslab:/data/dap/backend/

# Frontend dist
scp -r frontend/dist/* rajarora@centos2.rajarora.csslab:/data/dap/frontend/dist/

# Scripts (if updated)
scp scripts/*.js rajarora@centos2.rajarora.csslab:/data/dap/scripts/
```

#### 3. On PROD (centos2) - Apply changes:
```bash
ssh rajarora@centos2.rajarora.csslab

cd /data/dap

# Build backend
cd backend
npm run build

# Restart services
cd /data/dap
pkill -f "node.*src/server"
nohup npm --prefix backend start > backend.log 2>&1 &
sleep 5

sudo systemctl restart httpd
```

#### 4. Verify:
```bash
# Test backend
curl -s http://localhost:4000/graphql -X POST \
  -H "Content-Type: application/json" \
  -d '{"query":"{ products { totalCount } }"}' | jq .

# Test frontend
curl -s http://localhost/dap/ | grep index-
```

---

## 📊 Deployment Matrix

| Method | Use Case | Time | Risk |
|--------|----------|------|------|
| **Standard Release** | Major updates, new features | 5-10 min | Low |
| **Quick Patch** | Bug fixes, small changes | 3-5 min | Low |
| **Manual** | Script failures, custom needs | 10-15 min | Medium |

---

## ✅ Verification Checklist

After any deployment:

- [ ] Backend responds to GraphQL queries
- [ ] Frontend loads in browser
- [ ] Login works for all user types
- [ ] Products dropdown shows items (CSS/SME users)
- [ ] Solutions dropdown shows items (CSS/SME users)
- [ ] Dialogs are functional
- [ ] No errors in backend.log
- [ ] No errors in Apache error_log
- [ ] No errors in browser console

---

## 🆘 Troubleshooting

### Backend not starting
```bash
# Check logs
tail -50 /data/dap/backend.log

# Check if port is in use
lsof -i :4000

# Kill and restart
pkill -f "node.*src/server"
cd /data/dap && ./dap restart
```

### Frontend not updating
```bash
# Check bundle name
curl -s http://localhost/dap/ | grep -o 'index-[^.]*\.js'

# Clear Apache cache
sudo systemctl restart httpd

# Force browser cache clear
# Visit: https://myapps.cxsaaslab.com/dap/force-refresh.html
```

### Database connection issues
```bash
# Check if PostgreSQL is running
ps aux | grep postgres

# Check if container is running
podman ps | grep dap_db

# Restart database
cd /data/dap && ./dap restart
```

---

## 📞 Support

**DEV Server**: centos1.rajarora.csslab (172.22.156.32)  
**PROD Server**: centos2.rajarora.csslab  
**Backend Logs**: `/data/dap/backend.log`  
**Apache Logs**: `/var/log/httpd/error_log`

---

**Version**: 1.0  
**Last Updated**: December 1, 2025

