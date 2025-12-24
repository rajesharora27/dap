#!/bin/bash
# setup-permissions.sh
# Ensures the 'dap' user has full OS and Database access for backup and restore operations.
# Usage: sudo ./setup-permissions.sh [database_name]

set -e

DB_NAME=${1:-dap}
DB_USER="dap"

# Determine OS User
if [[ "$OSTYPE" == "darwin"* ]]; then
    # On Mac, use the actual user (developer) for OS permissions
    OS_USER="${SUDO_USER:-$(whoami)}"
    echo "ℹ️  Detecting Mac environment: OS_USER=$OS_USER, DB_USER=$DB_USER"
else
    # On Linux, enforce 'dap' user
    OS_USER="dap"
fi

echo "========================================="
echo "🛡️  DAP Permissions Setup"
echo "========================================="

# 1. OS Permissions
echo "Step 1: Ensuring OS ownership for '$OS_USER'..."

if [[ "$OS_USER" == "dap" ]]; then
    # Create dap user if missing (Linux only logic essentially)
    if ! id "$OS_USER" >/dev/null 2>&1; then
        echo "⚠️  User '$OS_USER' not recognized by system. Creating..."
        sudo useradd -r -m -s /bin/bash "$OS_USER" || true
    else
        echo "✅ OS user '$OS_USER' exists."
    fi
else
    echo "✅ Using current user '$OS_USER' for OS permissions."
fi

# Determine Data Root based on OS and writability
if [[ "$OSTYPE" == "darwin"* ]]; then
    # Modern Mac has read-only root. Use /Users/Shared or /usr/local/var
    DATA_ROOT="/Users/Shared/dap"
else
    DATA_ROOT="/data/dap"
fi

# Standard Directories
for dir in "$DATA_ROOT" "$DATA_ROOT/backups" "$DATA_ROOT/logs" "$DATA_ROOT/app"; do
    if [ ! -d "$dir" ]; then
        echo "ℹ️  Creating directory $dir..."
        sudo mkdir -p "$dir"
    fi
    sudo chown -R $OS_USER "$dir"
    echo "✅ Ownership set to '$OS_USER' for $dir"
done

# Ensure current project directory is owned by the developer (SUDO_USER)
# We do NOT want 'dap' to own the source code, as that blocks the developer from editing.
CURRENT_PROJ=$(pwd)
if [[ "$CURRENT_PROJ" == *"/dap"* ]]; then
    REAL_USER="${SUDO_USER:-$(whoami)}"
    if [ "$REAL_USER" != "root" ] && [ "$REAL_USER" != "$DAP_USER" ]; then
        echo "ℹ️  Ensuring source code is owned by developer: $REAL_USER"
        sudo chown -R "$REAL_USER" "$CURRENT_PROJ"
        # Ensure group is writable just in case
        sudo chmod -R g+w "$CURRENT_PROJ"
    fi
fi

# 2. Database Permissions
echo "Step 2: Configuring Database role '$DB_USER'..."

# Find psql
PSQL_CMD="psql"
if ! command -v psql &> /dev/null; then
    # Try common paths
    if [ -f "/usr/pgsql-16/bin/psql" ]; then
        PSQL_CMD="/usr/pgsql-16/bin/psql"
    elif [ -f "/opt/homebrew/bin/psql" ]; then
        PSQL_CMD="/opt/homebrew/bin/psql"
    fi
fi

# Determine how to run psql (as root, current user, or postgres user)
# On macOS, the sudo user is usually the pg superuser.
# On Linux, 'postgres' is the standard superuser.
RUN_PG=""
if [[ "$OSTYPE" == "darwin"* ]]; then
    if [ ! -z "$SUDO_USER" ] && [ "$EUID" -eq 0 ]; then
        # Running via sudo on Mac, use the original user
        RUN_PG="sudo -u $SUDO_USER"
    fi
else
    # Linux logic
    if id "postgres" >/dev/null 2>&1; then
        RUN_PG="sudo -u postgres"
    fi
fi

# If DATABASE_URL is provided, use it for connection but we still need superuser role
# We only use DATABASE_URL if it doesn't contain localhost/127.0.0.1 or we are testing access
PG_CONN_ARGS=""
if [ ! -z "$DATABASE_URL" ]; then
    # Strip potential query params
    CLEAN_URL=$(echo "$DATABASE_URL" | cut -d '?' -f1)
    PG_CONN_ARGS="-d $CLEAN_URL"
    echo "ℹ️  Using provided DATABASE_URL for connection."
else
    # Default to 'postgres' database for administrative commands if no URL provided
    # This prevents psql from trying to connect to a database named after the user (e.g., 'rajarora')
    PG_CONN_ARGS="-d postgres"
fi

echo "ℹ️  Granting superuser privileges to '$DB_USER'..."
# Run the role creation/update
$RUN_PG $PSQL_CMD $PG_CONN_ARGS -c "DO \$\$ 
BEGIN 
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DB_USER') THEN
        CREATE ROLE $DB_USER WITH LOGIN PASSWORD 'DAP123!!!';
    END IF;
    ALTER ROLE $DB_USER WITH SUPERUSER REPLICATION CREATEDB;
END \$\$;"

echo "✅ Role '$DB_USER' configured with SUPERUSER privileges."

# 3. Database Ownership
echo "Step 3: Ensuring '$DB_USER' owns target databases..."
for db in "$DB_NAME" "${DB_NAME}_test"; do
    $RUN_PG $PSQL_CMD -c "SELECT 1" -d "$db" >/dev/null 2>&1 && {
        $RUN_PG $PSQL_CMD $PG_CONN_ARGS -c "ALTER DATABASE \"$db\" OWNER TO $DB_USER;"
        echo "✅ Ownership fixed for database '$db'"
    } || echo "ℹ️  Database '$db' does not exist yet, skipping."
done

echo ""
echo "========================================="
echo "✅ Permissions setup complete!"
echo "========================================="
echo "The '$OS_USER' OS user and '$DB_USER' DB user are now configured."
