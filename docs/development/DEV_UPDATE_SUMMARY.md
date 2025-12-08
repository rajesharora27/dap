# 🛠️ DAP Development Environment Update

I have cleaned up and updated the `dap` script to support a robust development environment startup.

## ✅ Changes Made

1.  **Added `dev` command to `./dap`**:
    - You can now run `./dap dev` to start the development environment.
    - This replaces the standalone `./dev` script which had compatibility issues.

2.  **Robust Startup**:
    - Uses `docker compose` to start the database (avoiding image name issues).
    - Installs dependencies automatically if missing.
    - Runs database migrations automatically.
    - Starts Backend and Frontend in the foreground with color-coded logs.
    - Handles `Ctrl+C` gracefully to stop all services.

3.  **Removed `./dev`**:
    - The old script has been removed to avoid confusion.

## 🚀 How to Run

Simply run:

```bash
./dap dev
```

This will:
1.  Start PostgreSQL (in Docker)
2.  Start Backend (port 4000)
3.  Start Frontend (port 5173)
4.  Show logs from both services in your terminal

Press `Ctrl+C` to stop everything.
