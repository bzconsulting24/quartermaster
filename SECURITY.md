# Security Policy

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please follow these steps:

### How to Report

**Do not** open a public GitHub issue for security vulnerabilities.

Instead, please report security issues by:
1. Opening a private security advisory on GitHub
2. Emailing the maintainers directly (if contact information is provided)

### What to Include

When reporting a vulnerability, please include:

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Any suggested fixes (if applicable)

### Response Timeline

- **Initial Response:** Within 48 hours
- **Status Update:** Within 7 days
- **Fix Timeline:** Varies based on severity and complexity

## Supported Versions

We recommend always using the latest version of Quartermaster for the most up-to-date security patches.

## Security Best Practices

When deploying Quartermaster:

- **Environment Variables:** Never commit `.env` files or expose API keys
- **Database:** Use strong passwords and restrict database access
- **HTTPS:** Always use HTTPS in production
- **Dependencies:** Regularly update dependencies to patch known vulnerabilities
- **Authentication:** Implement proper authentication and authorization
- **Rate Limiting:** Configure rate limiting for API endpoints

## Known Security Considerations

- OpenAI API keys must be kept secure
- Database connection strings should never be exposed
- Redis should not be publicly accessible
- File uploads should be validated and sanitized

## Disclosure Policy

After a security issue is fixed:
1. We will release a patch
2. Credit will be given to the reporter (if desired)
3. A security advisory will be published

Thank you for helping keep Quartermaster secure.
