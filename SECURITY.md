# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 3.x.x   | ✅ Active support  |
| 2.x.x   | ⚠️ Security fixes only |
| 1.x.x   | ❌ No longer supported |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly.

### How to Report

1. **DO NOT** create a public GitHub issue for security vulnerabilities
2. Email security concerns to the maintainers privately
3. Include the following information:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Any suggested fixes (optional)

### What to Expect

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 5 business days
- **Resolution Timeline**: Depends on severity
  - Critical: 24-48 hours
  - High: 1 week
  - Medium: 2 weeks
  - Low: Next scheduled release

### Disclosure Policy

- We follow responsible disclosure practices
- Security fixes are released as soon as possible
- Public disclosure after patch is available
- Credit given to reporters (unless anonymity requested)

---

## Security Features

### Authentication

- **JWT Authentication**: Tokens with configurable expiration
- **Password Hashing**: bcrypt with salt rounds
- **Session Management**: Server-side session tracking with automatic cleanup
- **Rate Limiting**: Protection against brute force attacks
  - Login: 5 attempts per 15 minutes
  - API: 100 requests per 15 seconds

### Authorization

- **Role-Based Access Control (RBAC)**: Granular permissions system
- **Permission Checks**: Enforced at GraphQL resolver level
- **Admin Separation**: Admin-only endpoints clearly marked
- **Audit Logging**: All sensitive operations logged

### Data Protection

- **Input Validation**: Zod schemas for all inputs
- **SQL Injection Prevention**: Prisma ORM with parameterized queries
- **XSS Prevention**: React's built-in escaping + CSP headers
- **CSRF Protection**: SameSite cookies + token validation

### Transport Security

- **HTTPS**: Required in production
- **HSTS**: Strict-Transport-Security header
- **Secure Cookies**: HttpOnly, Secure, SameSite flags

### Infrastructure

- **Container Isolation**: Non-root Docker users
- **Secret Management**: Environment variables (not hardcoded)
- **Backup Encryption**: Sensitive data excluded from backups
- **Health Checks**: Monitoring for security issues

---

## Security Best Practices

### For Developers

```bash
# Never commit secrets
echo ".env" >> .gitignore
echo ".env.*" >> .gitignore

# Use environment variables
export JWT_SECRET=$(openssl rand -base64 32)
export DATABASE_URL="postgresql://..."

# Run security checks
npm audit
npm run lint  # Includes security rules
```

### For Operators

```bash
# Regular updates
git pull && npm install

# Database backups (passwords excluded)
./dap backup

# Monitor logs for suspicious activity
tail -f backend.log | grep -i "auth\|error\|fail"

# Check health endpoints
curl https://your-domain/health
```

### Credential Guidelines

| Item | Storage | Rotation |
|------|---------|----------|
| JWT Secret | Environment variable | Quarterly |
| Database Password | Environment variable | Monthly |
| API Keys | Environment variable | On compromise |
| Admin Password | User-set | 90 days |

---

## Known Security Considerations

### Password Storage

- Passwords are **never** included in database backups
- Existing passwords are preserved during restore operations
- Password hashing uses bcrypt with cost factor 10

### Session Handling

- Sessions cleared on server restart (security measure)
- Automatic session cleanup for expired sessions (7+ days)
- Lock tokens expire after 30 minutes of inactivity

### API Security

- GraphQL query complexity limited to 1000
- Query depth limited to 15 levels
- File uploads limited to 10MB
- SQL backup uploads limited to 100MB

### Audit Trail

All security-relevant events are logged:
- Login attempts (success/failure)
- Password changes
- Permission changes
- Admin operations
- Data exports/imports

---

## Security Headers

The following security headers are configured:

```
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; ...
```

---

## Compliance

DAP is designed with the following standards in mind:

- **OWASP Top 10**: Protections against common vulnerabilities
- **CWE/SANS Top 25**: Secure coding practices
- **GDPR**: Data protection considerations
  - No telemetry without consent
  - User data exportable
  - Deletion capabilities

---

## Cryptographic Standards

### Approved Algorithms

| Purpose | Algorithm | Notes |
|---------|-----------|-------|
| Password Hashing | bcrypt | Cost factor 10+ |
| JWT Signing | HS256 | Minimum key length 32 bytes |
| Data Encryption | AES-256-GCM | When needed |
| TLS | TLS 1.2+ | TLS 1.3 preferred |

### Banned Algorithms

The following are explicitly forbidden:
- MD5, SHA-1 (for security purposes)
- DES, 3DES, RC4
- ECB mode encryption
- Static RSA key exchange

---

## Incident Response

### If a Breach is Suspected

1. **Contain**: Isolate affected systems
2. **Assess**: Determine scope and impact
3. **Notify**: Inform relevant parties
4. **Remediate**: Fix the vulnerability
5. **Review**: Post-incident analysis

### Emergency Contacts

- Primary Maintainer: [Contact Info]
- Security Team: [Contact Info]

---

## Security Changelog

| Date | Version | Change |
|------|---------|--------|
| 2025-12-30 | 3.0.0 | Added query complexity limits |
| 2025-12-29 | 2.9.4 | Enhanced backup security |
| 2025-12-24 | 2.9.0 | Added session cleanup |
| 2025-11-11 | 1.1.1 | Password exclusion from backups |

---

*Last updated: December 30, 2025*

