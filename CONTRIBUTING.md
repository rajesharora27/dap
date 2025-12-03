# Contributing to DAP

We love your input! We want to make contributing to DAP as easy and transparent as possible.

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

### Pull Requests

1. Fork the repo and create your branch from `develop`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code lints
6. Issue that pull request!

### Branch Naming Convention

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `test/` - Test additions/changes
- `refactor/` - Code refactoring

Example: `feature/add-user-authentication`

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

**Examples:**
```
feat(auth): add JWT authentication

Implemented JWT-based authentication with refresh tokens

Closes #123
```

```
fix(api): resolve N+1 query in products endpoint

Added DataLoader to batch database queries
```

## Code Review Process

All submissions require review before merging. We use GitHub pull requests for this.

### Review Checklist

- [ ] Code follows style guidelines
- [ ] Tests pass (CI green)
- [ ] Code coverage maintained/improved
- [ ] No new security vulnerabilities
- [ ] Documentation updated
- [ ] Breaking changes noted

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Add types, avoid `any`
- Use interfaces for object shapes
- Document complex types

### Testing

- Write tests for new features
- Maintain 70%+ code coverage
- Use factories for test data
- Mock external dependencies

### Performance

- Consider performance impact
- Use DataLoader for GraphQL
- Lazy load components
- Optimize bundle size

## Local Development

### Prerequisites

- Node.js 22+
- PostgreSQL 16
- Git

### Setup

```bash
# Clone repository
git clone https://github.com/yourusername/dap.git
cd dap

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Setup database
cd backend
npx prisma migrate dev
npx prisma generate

# Start development servers
npm run dev  # Backend
cd ../frontend && npm run dev  # Frontend
```

### Running Tests

```bash
# Backend tests
cd backend
npm test
npm run test:watch
npm run test:coverage

# Frontend tests
cd frontend
npm test
npm run test:coverage
```

### Code Quality

```bash
# Linting
npm run lint
npm run lint:fix

# Type checking
npm run type-check
```

## Reporting Bugs

We use GitHub issues to track bugs. Report a bug by opening a new issue.

### Great Bug Reports Include:

- Quick summary and/or background
- Steps to reproduce
- What you expected to happen
- What actually happens
- Notes (possibly including why you think this might be happening)

**Template:**
```markdown
**Bug Description**
A clear description of the bug

**To Reproduce**
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected behavior**
What should happen

**Actual behavior**
What actually happens

**Screenshots**
If applicable

**Environment**
- OS: [e.g. Ubuntu 22.04]
- Node: [e.g. 22.0.0]
- Browser: [e.g. Chrome 120]
```

## Feature Requests

We welcome feature requests! Please:

1. Check if the feature already exists
2. Explain the use case
3. Describe the desired behavior
4. Consider implementation complexity

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

## Questions?

Feel free to open an issue with your question or reach out to the maintainers.

---

Thank you for contributing! 🎉
