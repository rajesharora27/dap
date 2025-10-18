# ✅ Configuration Complete - Ready for Internal Reverse Proxy

## Your Setup Summary

**User Access URL:**
```
https://dap-8321890.ztna.sse.cisco.io
```

**Internal Server:**
- IP: `172.22.156.32`
- Frontend Port: `5173`
- Backend Port: `4000`

**Routing (handled by your reverse proxy):**
```
https://dap-8321890.ztna.sse.cisco.io/        → http://172.22.156.32:5173/
https://dap-8321890.ztna.sse.cisco.io/graphql → http://172.22.156.32:4000/graphql
```

## ✅ What's Been Updated

### Environment Files Configured:

1. **`/data/dap/.env`** ✅
   - Frontend URL: `https://dap-8321890.ztna.sse.cisco.io`
   - GraphQL Endpoint: `https://dap-8321890.ztna.sse.cisco.io/graphql`
   - CORS: Allows your proxy domain
   - Binds to `0.0.0.0` (accessible from network)

2. **`/data/dap/frontend/.env.development`** ✅
   - Configured to use reverse proxy URL
   - API calls go through proxy

## 🚀 How to Start

```bash
cd /data/dap
./dap start
```

That's it! The services will start on:
- Frontend: `0.0.0.0:5173`
- Backend: `0.0.0.0:4000`

## 🔍 Verification

### Check Services Running:
```bash
sudo netstat -tlnp | grep :5173  # Should show: 0.0.0.0:5173
sudo netstat -tlnp | grep :4000  # Should show: 0.0.0.0:4000
```

### Test Direct Access:
```bash
# Frontend
curl http://172.22.156.32:5173

# Backend
curl http://172.22.156.32:4000/graphql
```

### Test Through Reverse Proxy:
```bash
# This is what users will access
curl https://dap-8321890.ztna.sse.cisco.io
```

## 👥 User Access

**Users simply navigate to:**
```
https://dap-8321890.ztna.sse.cisco.io
```

**No special setup needed!**
- ✅ No hosts file changes
- ✅ No port numbers in URL
- ✅ HTTPS (secure)
- ✅ Works from anywhere your reverse proxy allows

## ⚙️ Reverse Proxy Requirements

Your reverse proxy must route:

| Path | Destination |
|------|-------------|
| `/` | `http://172.22.156.32:5173` |
| `/graphql` | `http://172.22.156.32:4000/graphql` |

Example config (if it's nginx):
```nginx
location / {
    proxy_pass http://172.22.156.32:5173;
}

location /graphql {
    proxy_pass http://172.22.156.32:4000/graphql;
}
```

## 🐛 Troubleshooting

### CORS Errors?
The `.env` file already includes the proxy URL in `ALLOWED_ORIGINS`. If you still see CORS errors, restart the backend:
```bash
cd /data/dap && ./dap stop && ./dap start
```

### GraphQL API Not Working?
Check that your reverse proxy routes `/graphql` to port `4000`:
```bash
# Test direct: should work
curl http://172.22.156.32:4000/graphql

# Test through proxy: should also work
curl https://dap-8321890.ztna.sse.cisco.io/graphql
```

### Frontend Loads but Can't Connect to API?
Check browser console (F12). If you see API errors, verify:
```bash
cat frontend/.env.development | grep VITE_GRAPHQL_ENDPOINT
# Should show: https://dap-8321890.ztna.sse.cisco.io/graphql
```

## 📚 Documentation

- **[REVERSE_PROXY_CONFIG.md](REVERSE_PROXY_CONFIG.md)** - Detailed setup guide
- **[DEV_TESTING_SETUP.md](DEV_TESTING_SETUP.md)** - General testing setup
- **[SINGLE_PORT_DEPLOYMENT.md](SINGLE_PORT_DEPLOYMENT.md)** - Production deployment

## 📋 Configuration Summary

```bash
# Current Configuration
Server IP:      172.22.156.32
Frontend Port:  5173
Backend Port:   4000
Public URL:     https://dap-8321890.ztna.sse.cisco.io
Protocol:       HTTPS (via reverse proxy)
SSL:            Handled by your reverse proxy
Accessible:     Via internal network + reverse proxy
```

## ✨ Next Steps

1. **Start the services:**
   ```bash
   cd /data/dap && ./dap start
   ```

2. **Test locally:**
   ```bash
   curl http://172.22.156.32:5173
   ```

3. **Test through proxy:**
   ```bash
   curl https://dap-8321890.ztna.sse.cisco.io
   ```

4. **Share with users:**
   Just give them the URL: `https://dap-8321890.ztna.sse.cisco.io`

---

**Status:** ✅ Ready to Use  
**Access:** https://dap-8321890.ztna.sse.cisco.io  
**Setup:** Complete - No user configuration needed!
