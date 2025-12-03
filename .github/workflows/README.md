# GitHub Actions CI/CD Setup

This directory contains GitHub Actions workflows for automated testing, security scanning, and deployment.

## Workflows

### 1. CI - Test & Build (`ci.yml`)

**Triggers:** Push to main/develop, Pull Requests

**Jobs:**
- **Backend Tests** - Run Jest tests with PostgreSQL
- **Frontend Tests** - Run React tests
- **Backend Lint** - ESLint checks
- **Frontend Lint** - ESLint checks
- **Backend Build** - TypeScript compilation
- **Frontend Build** - Vite production build

**Features:**
- ✅ Matrix testing on Node 20.x and 22.x
- ✅ PostgreSQL service container for tests
- ✅ Code coverage upload to Codecov
- ✅ Build artifacts retention (7 days)
- ✅ Bundle size analysis

### 2. CodeQL Security Scan (`codeql.yml`)

**Triggers:** Push, Pull Requests, Weekly schedule

**Features:**
- ✅ Automated security vulnerability scanning
- ✅ JavaScript/TypeScript analysis
- ✅ Security-extended queries
- ✅ Weekly scheduled scans

### 3. Dependency Review (`dependency-review.yml`)

**Triggers:** Pull Requests to main

**Features:**
- ✅ Scan for vulnerable dependencies
- ✅ Fail on moderate+ severity
- ✅ Automatic PR comments with findings

### 4. Deploy to Production (`deploy.yml`)

**Triggers:** Version tags (v*.*.*), Manual dispatch

**Features:**
- ✅ Automated deployment to production server
- ✅ Database backup before deployment
- ✅ Health checks after deployment
- ✅ Automatic rollback on failure
- ✅ GitHub Release creation
- ✅ Slack notifications (optional)

---

## Setup Instructions

### Prerequisites

1. GitHub repository with code
2. Access to GitHub repository settings
3. Production server with SSH access

### Step 1: Enable GitHub Actions

1. Go to repository settings
2. Navigate to Actions → General
3. Ensure "Allow all actions and reusable workflows" is selected
4. Save

### Step 2: Configure Secrets

Go to Settings → Secrets and variables → Actions → New repository secret

**Required Secrets:**

```
# Codecov (optional - for coverage reports)
CODECOV_TOKEN=<your-codecov-token>

# Deployment (required for deploy workflow)
DEPLOY_SSH_KEY=<private-ssh-key>
DEPLOY_KNOWN_HOSTS=<output-of-ssh-keyscan-centos2.rajarora.csslab>
DEPLOY_USER=rajarora
DEPLOY_HOST=centos2.rajarora.csslab
DEPLOY_URL=https://myapps.cxsaaslab.com/dap

# Notifications (optional)
SLACK_WEBHOOK=<slack-webhook-url>
```

### Step 3: Generate SSH Key for Deployment

```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions-deploy" -f github-deploy-key

# Copy public key to server
ssh-copy-id -i github-deploy-key.pub rajarora@centos2.rajarora.csslab

# Add private key to GitHub secrets
cat github-deploy-key | pbcopy  # or xclip -sel clip
# Paste into DEPLOY_SSH_KEY secret

# Get known_hosts
ssh-keyscan centos2.rajarora.csslab
# Copy output to DEPLOY_KNOWN_HOSTS secret
```

### Step 4: Set Up Codecov (Optional)

1. Go to https://codecov.io
2. Sign in with GitHub
3. Add repository
4. Copy token to CODECOV_TOKEN secret

### Step 5: Configure Environments

1. Go to Settings → Environments
2. Create "production" environment
3. Add protection rules (optional):
   - Required reviewers
   - Wait timer
   - Deployment branches (only tags)

---

## Usage

### Running Tests on Pull Request

1. Create a branch
2. Make changes
3. Push to GitHub
4. Open Pull Request
5. CI automatically runs ✅

### Deploying to Production

**Method 1: Version Tag (Recommended)**

```bash
# Create and push a version tag
git tag v1.0.0
git push origin v1.0.0

# Deployment workflow automatically triggers
```

**Method 2: Manual Dispatch**

1. Go to Actions tab
2. Select "Deploy to Production"
3. Click "Run workflow"
4. Select branch/tag
5. Click "Run workflow"

### Viewing Results

1. Go to Actions tab
2. Click on workflow run
3. View job details
4. Check logs and artifacts

---

## CI Workflow Details

### Backend Test Job

```yaml
- Checkout code
- Setup Node.js (20.x, 22.x)
- Install dependencies
- Generate Prisma client
- Run migrations
- Run tests with coverage
- Upload coverage to Codecov
```

### Frontend Build Job

```yaml
- Checkout code
- Setup Node.js
- Install dependencies
- Build production bundle
- Upload artifacts
- Analyze bundle size
```

---

## Troubleshooting

### Tests Failing

**Check:**
- Node version compatibility
- Database connection
- Environment variables
- Dependencies installed

**Debug:**
```bash
# Run locally with same Node version
nvm use 22
npm run test:ci
```

### Deployment Failing

**Check:**
- SSH key configured correctly
- Server accessible
- Database migrations valid
- Health check endpoint working

**Rollback:**
```bash
# Automatic rollback on failure
# Or manual:
ssh user@server "cd /data/dap && ./deploy/scripts/rollback.sh"
```

### CodeQL Issues

**Check:**
- Language configuration
- Autobuild success
- Query pack compatibility

---

## Best Practices

### Commit Messages

Use conventional commits for automatic changelog:

```
feat: add user authentication
fix: resolve database connection issue
docs: update README
test: add unit tests for ProductService
```

### Version Tags

Follow semantic versioning:

```
v1.0.0 - Major release
v1.1.0 - Minor release (new features)
v1.1.1 - Patch release (bug fixes)
```

### Pull Requests

- ✅ Wait for CI to pass before merging
- ✅ Review code coverage changes
- ✅ Check bundle size impact
- ✅ Resolve security findings

---

## Maintenance

### Weekly Tasks

- [ ] Review CodeQL security findings
- [ ] Check dependency vulnerabilities
- [ ] Review failed workflow runs

### Monthly Tasks

- [ ] Update workflow dependencies
- [ ] Review and optimize CI time
- [ ] Clean up old artifacts

---

## Metrics

### Current Configuration

- **Test Execution Time:** ~3-5 minutes
- **Build Time:** ~2-3 minutes
- **Total CI Time:** ~8-10 minutes
- **Deployment Time:** ~5 minutes
- **Coverage Threshold:** 70%

### Optimization Tips

1. **Cache Dependencies**
   - Already configured with `cache: 'npm'`
   - Saves ~30-60 seconds per job

2. **Parallel Jobs**
   - Backend and frontend run in parallel
   - Reduces total time by 50%

3. **Matrix Testing**
   - Tests on multiple Node versions
   - Catches compatibility issues early

---

## Links

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Codecov](https://codecov.io)
- [CodeQL](https://codeql.github.com)
- [Semantic Versioning](https://semver.org)

---

## Support

For issues with CI/CD:
1. Check workflow logs
2. Review this README
3. Check GitHub Actions status page
4. Open an issue in the repository
