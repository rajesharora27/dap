# DAP SSH Tunnel - Quick Reference Card

## 🚀 Quick Connect

### For End Users:
```bash
ssh -L 5173:172.22.156.32:5173 -L 4000:172.22.156.32:4000 user@JUMP_HOST
```
Then browse to: **http://localhost:5173**

---

## 📋 Common Commands

### Start Tunnel (Interactive)
```bash
ssh -L 5173:172.22.156.32:5173 -L 4000:172.22.156.32:4000 user@jumphost
```

### Start Tunnel (Background)
```bash
ssh -fNL 5173:172.22.156.32:5173 -L 4000:172.22.156.32:4000 user@jumphost
```

### Stop Background Tunnel
```bash
pkill -f "ssh.*5173"
```

### Check Tunnel is Running
```bash
ss -tln | grep -E ':(5173|4000)'
# Should show 127.0.0.1:5173 and 127.0.0.1:4000
```

### Test Connection
```bash
curl http://localhost:4000/health
# Should return: {"status":"ok",...}
```

---

## 🔧 Server Administration

### Check Services are Running
```bash
ss -tlnp | grep -E ':(4000|5173)'
# Should show 0.0.0.0:5173 and 0.0.0.0:4000
```

### Restart Application
```bash
cd /data/dap && ./dap restart
```

### View Logs
```bash
tail -f /data/dap/frontend.log
tail -f /data/dap/backend.log
```

### Check Backend Health
```bash
curl http://localhost:4000/health
```

---

## 🌐 Network Details

| Service  | Port | Listen Address | Protocol |
|----------|------|----------------|----------|
| Frontend | 5173 | 0.0.0.0       | HTTP     |
| Backend  | 4000 | 0.0.0.0       | HTTP/WS  |
| Database | 5432 | localhost      | PostgreSQL |

**Server IP:** 172.22.156.32

---

## 📝 SSH Config Template

Add to `~/.ssh/config`:
```
Host dap
    HostName 172.22.156.32
    User YOUR_USERNAME
    ProxyJump jumphost
    LocalForward 5173 localhost:5173
    LocalForward 4000 localhost:4000
```

Then connect with: `ssh dap`

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Connection refused | Check jump host is accessible |
| Port already in use | `pkill -f "ssh.*5173"` and retry |
| Application won't load | Check both 5173 and 4000 are forwarded |
| Backend errors | `curl http://localhost:4000/health` |
| Tunnel keeps dying | Add `-o ServerAliveInterval=60` |

---

## ✅ Success Checklist

- [ ] SSH to jump host works
- [ ] Can create SSH tunnel without errors
- [ ] `ss -tln | grep 5173` shows 127.0.0.1:5173
- [ ] `curl http://localhost:4000/health` returns OK
- [ ] Browser opens http://localhost:5173
- [ ] Application interface loads

---

## 📞 Support

If you have issues:
1. Check this guide first
2. Verify tunnel is running: `ps aux | grep ssh.*5173`
3. Test backend: `curl http://localhost:4000/health`
4. Contact administrator with error messages

---

**Last Updated:** October 14, 2025  
**Server:** 172.22.156.32  
**Documentation:** See SSH_TUNNEL_ACCESS.md for detailed instructions
