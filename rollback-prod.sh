#!/bin/bash
# One-Click Rollback Script for Production

set -e

PROD_HOST="prod.rajarora.csslab"
PROD_USER="rajarora"

TIMESTAMP="$1"

if [ -z "$TIMESTAMP" ]; then
    echo "Usage: ./rollback-prod.sh <TIMESTAMP>"
    echo "Example: ./rollback-prod.sh 20251220-120000"
    exit 1
fi

echo "========================================="
echo "⏪ ROLLBACK PROCEDURE INITIATED"
echo "Target: $PROD_HOST"
echo "Restore Point: $TIMESTAMP"
echo "========================================="
echo ""
read -p "Are you SUPER sure you want to revert Production to this state? (y/N) " confirm
if [[ $confirm != [yY] && $confirm != [yY][eE][sS] ]]; then
    echo "Aborted."
    exit 1
fi

echo "⏳ Reverting system..."

ssh $PROD_USER@$PROD_HOST << ENDSSH
# Ensure restore script is there (it should be from deployment, but copy if needed)
# scp scripts/restore-full.sh ... (omitted for speed, reliable loc assumed)

echo "📝 Executing restore as dap user..."
sudo -u dap bash << 'DAPCMDS'
set -e
# Ensure script is executable
chmod +x /data/dap/scripts/restore-full.sh
/data/dap/scripts/restore-full.sh "$TIMESTAMP"
DAPCMDS

echo "✅ App and DB Restore operations completed."
ENDSSH

echo ""
echo "========================================="
echo "✅ ROLLBACK COMPLETE"
echo "========================================="
