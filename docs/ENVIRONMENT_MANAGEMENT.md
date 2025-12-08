# Environment Variable Management

To avoid confusion and conflicting configurations, this project uses a **centralized environment variable strategy**.

## Best Practice Implemented

1.  **Single Source of Truth**: All environment variables are managed in the **root directory**:
    *   `.env.development` (Development configuration)
    *   `.env.production` (Production configuration)

2.  **Consolidated Configurations**:
    *   Frontend variables (prefixed with `VITE_`) and Backend variables are kept in the same file.
    *   This ensures ports, URLs, and secrets are synchronized.

3.  **Synchronization Script**:
    *   A script `scripts/sync-env.sh` copies the master config to the `frontend/` and `backend/` directories.

## Usage

**Switching Environments:**

To switch to **Development** mode (default):
```bash
./scripts/sync-env.sh development
```

To switch to **Production** mode:
```bash
./scripts/sync-env.sh production
```

This command will:
1.  Update `.env` in the root.
2.  Update `backend/.env`.
3.  Update `frontend/.env`.

## Adding New Variables

1.  Add the variable to **both** `root/.env.development` and `root/.env.production`.
2.  Run `./scripts/sync-env.sh <mode>` to apply changes.
3.  **Do not** edit files inside `backend/` or `frontend/` directly, as they will be overwritten.
