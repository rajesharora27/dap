---
description: Full commit workflow - cleanup, consolidate, update docs, checkin, commit, push
---

When the user says "commit", perform the following steps:

1. **Cleanup**
   - Remove any temporary/test files created during development
   - Check for and remove any debugging console.log statements added during the session
   - Verify no accidental large files or sensitive data

2. **Consolidate**
   - Ensure all related changes are grouped logically
   - Review changes across multiple files to ensure consistency

3. **Update @context.md**
   - Update `/Users/rajarora/Library/CloudStorage/OneDrive-nmvm/Develop/dap/context.md` with:
     - Summary of changes made in this session
     - Any new features or bug fixes
     - Architecture decisions if applicable

4. **Update Documentation**
   - Update relevant documentation in `/docs/` if applicable
   - Update README.md if there are user-facing changes
   - Update any API documentation if GraphQL schema changed

5. **Checkin (Stage)**
   // turbo
   ```bash
   cd /Users/rajarora/Library/CloudStorage/OneDrive-nmvm/Develop/dap && git add -A
   ```

6. **Commit**
   ```bash
   git commit -m "<descriptive commit message based on changes>"
   ```

7. **Push**
   ```bash
   git push
   ```

Note: Always show the user a summary of what was changed before pushing.
