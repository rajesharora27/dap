# 🔧 GUI Showing Old Data? Clear Browser Cache!

If your DAP application GUI is showing old/stale data after restarting the services, the issue is **browser cache**. The backend and frontend are running fresh, but your browser is serving cached content.

## ✅ QUICK FIX (Try this first):

**Press `Ctrl+Shift+R`** (Linux/Windows) or `Cmd+Shift+R` (Mac)

This performs a "hard refresh" and bypasses the browser cache for the current page.

## 🔄 OTHER SOLUTIONS:

### Method 1: Private/Incognito Window
- Press `Ctrl+Shift+N` (Chrome) or `Ctrl+Shift+P` (Firefox)
- Navigate to http://localhost:5173
- Private windows don't use any cache

### Method 2: DevTools Cache Clear
- Press `F12` to open Developer Tools
- Right-click the refresh button
- Select "Empty Cache and Hard Reload"

### Method 3: Developer Mode
- Press `F12` to open Developer Tools
- Go to **Network** tab
- Check "**Disable cache**" checkbox
- Keep DevTools open while browsing

### Method 4: Manual Browser Cache Clear
- **Chrome**: Settings → Privacy and Security → Clear browsing data
- **Firefox**: Settings → Privacy & Security → Clear Data
- Select "Cached images and files" and click Clear

## 🚀 CACHE-BUSTING RESTART:

If you want to clear server-side caches too:

```bash
./cache-restart.sh
```

This script:
1. Stops all services
2. Clears Vite build cache
3. Removes old logs
4. Starts fresh services
5. **Still requires browser cache clearing**

## 🎯 WHY THIS HAPPENS:

- **Frontend**: React/Vite dev server serves cached JavaScript/CSS
- **Browser**: Caches API responses and static assets
- **Vite**: May serve cached build artifacts

The services restart correctly, but browsers aggressively cache web applications for performance.

## ✅ VERIFICATION:

After clearing cache, you should see:
- Current data in the GUI
- Network requests in DevTools (F12 → Network)
- Fresh timestamps in browser console

---

**🌐 Application URLs:**
- Frontend: http://localhost:5173  
- Backend API: http://localhost:4000/graphql