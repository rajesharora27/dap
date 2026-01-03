---
description: Full release workflow - commit workflow + minor version bump + production deployment
---

When the user says "release", perform the following steps:

## Part 1: Commit Workflow
Follow all steps in `/commit` workflow first:
1. Cleanup
2. Consolidate
3. Update documentation
4. Stage (`git add -A`)
5. Commit
6. Push

## Part 2: Version Bump (Minor Release)

1. **Bump minor version in package.json files**
   ```bash
   cd /Users/rajarora/Library/CloudStorage/OneDrive-nmvm/Develop/dap
   # Get current version, bump minor, update both package.json files
   ```

2. **Commit version bump**
   ```bash
   git add package.json backend/package.json frontend/package.json
   git commit -m "chore: bump version to X.Y.0"
   git push
   ```

3. **Create git tag**
   ```bash
   git tag -a vX.Y.0 -m "Release vX.Y.0"
   git push origin vX.Y.0
   ```

## Part 3: Deploy to Production

1. **Run production deployment script**
   ```bash
   ./deploy-to-production.sh
   ```

2. **Verify deployment**
   - Check that production is accessible
   - Verify key functionality

3. **Notify user of completion**
   - Show version deployed
   - Show deployment status
