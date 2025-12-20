#!/bin/bash
# Create Release Package
# Creates a versioned release from current dev state (centos1)

set -e
PROJECT_ROOT=$(pwd)

RELEASE_DATE=$(date +%Y%m%d-%H%M%S)
RELEASE_DIR="$(pwd)/releases"
RELEASE_NAME="release-${RELEASE_DATE}"
RELEASE_PATH="${RELEASE_DIR}/${RELEASE_NAME}"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}📦 Creating Release Package${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# Get version from user or env or auto-increment
if [ -z "$VERSION" ]; then
  echo -e "${YELLOW}Enter release version (e.g., 2.1.1) or press Enter for auto:${NC}"
  # For non-interactive use, we skip read if VERSION is already set
  read VERSION || true
fi

if [ -z "$VERSION" ]; then
  # Auto-generate version from date
  VERSION="2.9.${RELEASE_DATE:6:2}"  # Updated to 2.9 baseline
  echo "Auto-generated version: $VERSION"
fi

# Get release notes
if [ -z "$DESCRIPTION" ]; then
  echo ""
  echo -e "${YELLOW}Enter brief description of changes:${NC}"
  read DESCRIPTION || true
fi

if [ -z "$DESCRIPTION" ]; then
  DESCRIPTION="DAP v${VERSION} - UI/UX Refinements and AI Agent update"
fi

# Create release directory
mkdir -p "$RELEASE_DIR"

echo ""
echo -e "${GREEN}[1/8]${NC} Creating release directory..."
mkdir -p "${RELEASE_PATH}"

echo -e "${GREEN}[2/8]${NC} Copying backend source files..."
mkdir -p "${RELEASE_PATH}/backend/src"
cp -r backend/src/* "${RELEASE_PATH}/backend/src/"
cp backend/package.json "${RELEASE_PATH}/backend/"
cp backend/package-lock.json "${RELEASE_PATH}/backend/" 2>/dev/null || true
cp backend/tsconfig.json "${RELEASE_PATH}/backend/"
cp backend/prisma "${RELEASE_PATH}/backend/" -r 2>/dev/null || true

echo -e "${GREEN}[3/8]${NC} Building frontend..."
cd frontend
npm run build > /dev/null 2>&1

echo -e "${GREEN}[4/8]${NC} Copying frontend dist..."
mkdir -p "${RELEASE_PATH}/frontend"
cp -r dist "${RELEASE_PATH}/frontend/"

echo -e "${GREEN}[5/8]${NC} Copying scripts and configs..."
cd "$PROJECT_ROOT"
mkdir -p "${RELEASE_PATH}/scripts"
cp scripts/*.js "${RELEASE_PATH}/scripts/" 2>/dev/null || true
cp scripts/*.sh "${RELEASE_PATH}/scripts/" 2>/dev/null || true

# Copy important docs
mkdir -p "${RELEASE_PATH}/docs"
cp DEPLOYMENT_CONSISTENCY_GUIDE.md "${RELEASE_PATH}/docs/" 2>/dev/null || true
cp PASSWORD_SECURITY_BACKUPS.md "${RELEASE_PATH}/docs/" 2>/dev/null || true
cp CONTEXT.md "${RELEASE_PATH}/docs/" 2>/dev/null || true

echo -e "${GREEN}[6/8]${NC} Generating manifest..."
cd "${RELEASE_PATH}"

# Create manifest
cat > MANIFEST.txt << EOF
DAP Release Manifest
====================
Version: $VERSION
Date: $(date '+%Y-%m-%d %H:%M:%S')
Built On: centos1.rajarora.csslab
Target: centos2.rajarora.csslab

Changed Files:
$(find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | sort)

Total Files: $(find . -type f | wc -l)
Total Size: $(du -sh . | cut -f1)

Backend Bundle: $(ls backend/src/lib/*.ts backend/src/schema/*.ts backend/src/services/*.ts 2>/dev/null | wc -l) files
Frontend Bundle: $(ls frontend/dist/assets/*.js 2>/dev/null)

EOF

echo -e "${GREEN}[7/8]${NC} Creating release notes..."
cat > RELEASE_NOTES.md << EOF
# Release Notes - Version $VERSION

**Release Date**: $(date '+%Y-%m-%d')  
**Build**: ${RELEASE_DATE}

## Changes

${DESCRIPTION}

## Deployment Instructions

See \`DEPLOYMENT_INSTRUCTIONS.md\` for step-by-step deployment guide.

## Testing

- [ ] Backend health check
- [ ] Frontend loads correctly
- [ ] User authentication works
- [ ] RBAC permissions correct
- [ ] All dialogs functional

## Rollback

If issues occur, restore from backup created before deployment.

---
Built from: centos1.rajarora.csslab:/data/dap
Target: centos2.rajarora.csslab:/data/dap
EOF

# Create deployment instructions specific to this release
cat > DEPLOYMENT_INSTRUCTIONS.md << EOF
# Deployment Instructions - Release $VERSION

## Quick Deploy

\`\`\`bash
# On centos2
cd /data/dap
tar xzf /tmp/${RELEASE_NAME}.tar.gz --strip-components=1
cd backend && npm run build
cd /data/dap
./dap restart
sudo systemctl restart httpd
\`\`\`

## Verification

\`\`\`bash
curl -s http://localhost:4000/graphql -X POST \\
  -H "Content-Type: application/json" \\
  -d '{"query":"{ products { totalCount } }"}' | jq .
\`\`\`

Expected: Products query returns successfully

## Rollback

\`\`\`bash
./dap restore [backup-filename.sql]
\`\`\`
EOF

echo -e "${GREEN}[8/8]${NC} Creating release tarball..."
cd "$RELEASE_DIR"
tar czf "${RELEASE_NAME}.tar.gz" "${RELEASE_NAME}/"

# Get tarball size
TARBALL_SIZE=$(ls -lh "${RELEASE_NAME}.tar.gz" | awk '{print $5}')

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}✅ Release Package Created${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "📦 Package: ${RELEASE_NAME}.tar.gz"
echo "📊 Size: ${TARBALL_SIZE}"
echo "📁 Location: ${RELEASE_DIR}/"
echo "📝 Version: $VERSION"
echo ""
echo "📋 Contents:"
echo "  - Backend source code (built)"
echo "  - Frontend distribution bundle"
echo "  - Migration scripts (if any)"
echo "  - Documentation"
echo "  - Manifest and release notes"
echo ""
echo "🚀 Next steps:"
echo "  1. Review: ${RELEASE_DIR}/${RELEASE_NAME}/RELEASE_NOTES.md"
echo "  2. Deploy: ./deploy/release-to-prod.sh ${RELEASE_NAME}.tar.gz"
echo "  3. Or manually transfer to centos2"
echo ""
echo "To deploy to production:"
echo -e "  ${BLUE}cd /data/dap${NC}"
echo -e "  ${BLUE}./deploy/release-to-prod.sh releases/${RELEASE_NAME}.tar.gz${NC}"
echo ""

