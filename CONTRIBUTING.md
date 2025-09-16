# Contributing to RoomsThatSell

Thank you for your interest in contributing to RoomsThatSell! This document outlines our contribution guidelines and expectations for team members and authorized collaborators.

## 🚨 Important Notice

**This is a proprietary business repository.** All contributors must be authorized team members or collaborators who have been explicitly granted access. By contributing, you agree to our [LICENSE](LICENSE) terms.

## 📋 Before You Start

### Prerequisites
- You must be an authorized team member or collaborator
- You have access to the private repository
- You understand this is proprietary business code
- You agree to our contributor agreement (see LICENSE)

### Required Reading
- [LICENSE](LICENSE) - Proprietary software license
- [README.md](README.md) - Project overview and setup
- Repository rules and architecture guidelines (see project documentation)

## 🔄 Development Workflow

### 1. Branch Strategy
- **Main branch**: Protected, requires PR and CI approval
- **Feature branches**: `feature/description` (e.g., `feature/add-watermark-toggle`)
- **Bug fixes**: `fix/description` (e.g., `fix/image-upload-error`)
- **Hotfixes**: `hotfix/description` for critical production issues

### 2. Pull Request Process

#### Before Creating a PR
1. **Create a plan**: Outline your changes in 5-8 steps
2. **Run tests locally**: Ensure all tests pass
3. **Check linting**: Fix any ESLint/TypeScript errors
4. **Update documentation**: If adding features or changing behavior

#### PR Requirements
- **Clear title**: Descriptive of the changes
- **Detailed description**: Include step plan, tradeoffs, and risk notes
- **Link issues**: Reference any related issues
- **Screenshots**: For UI changes
- **Test coverage**: Include tests for new features

#### PR Template
```markdown
## Summary
Brief description of changes

## Step Plan
1. Step 1
2. Step 2
3. ...

## Tradeoffs
- What was considered but not chosen
- Why this approach was selected

## Risk Notes
- Any potential issues or breaking changes
- Migration steps if needed

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Schema/Storage Changes
- Any database schema changes
- Any storage/API changes
```

## 🧪 Testing Requirements

### Required Test Coverage
All new features must include:

1. **Unit Tests** (Vitest + jsdom)
   - Pure logic functions
   - Adapters and integrations
   - Business logic

2. **Integration Tests** (Vitest)
   - API endpoints
   - Database interactions
   - Third-party service mocks

3. **E2E Tests** (Playwright)
   - Critical user flows
   - At least 2 happy-path scenarios
   - Visual regression snapshots

### Test Commands
```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:ci

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e
```

## 🏗️ Code Standards

### Architecture Guidelines
- **Server boundaries**: Keep mutations in `/app/api/*` or Convex functions
- **No client secrets**: All API keys server-side only
- **Type safety**: Use Zod for request/response validation
- **External calls**: Use typed adapters in `/packages/integrations/*`

### Code Quality Gates
All PRs must pass:
- [ ] TypeScript compilation (`npm run typecheck`)
- [ ] ESLint checks (`npm run lint`)
- [ ] Unit tests (100% pass rate)
- [ ] Integration tests (100% pass rate)
- [ ] E2E smoke tests
- [ ] Build process (`npm run build`)
- [ ] Static analysis on prompts

### Code Style
- **TypeScript**: Strict mode enabled
- **Formatting**: Prettier configuration
- **Imports**: Absolute paths preferred
- **Comments**: Document complex business logic
- **Error handling**: Use typed error classes

## 🚀 CI/CD Pipeline

### Automated Checks
Our CI pipeline automatically runs:
1. **Type checking** - TypeScript compilation
2. **Linting** - ESLint rules enforcement
3. **Testing** - Unit, integration, and E2E tests
4. **Build** - Production build verification
5. **Security** - Dependency vulnerability scanning

### Manual Review Required
- **Architecture changes** - Database schema modifications
- **Security changes** - Authentication or authorization updates
- **External integrations** - New third-party service integrations
- **Performance changes** - Significant performance modifications

## 📝 Documentation

### Required Documentation
- **API changes**: Update OpenAPI specs if applicable
- **Database changes**: Document schema migrations
- **Configuration**: Update environment variable documentation
- **Deployment**: Note any deployment requirements

### Documentation Standards
- Use clear, concise language
- Include code examples where helpful
- Update README.md for significant changes
- Document breaking changes prominently

## 🔒 Security Guidelines

### Sensitive Information
- **Never commit**: API keys, secrets, or credentials
- **Use environment variables**: For all configuration
- **Signed URLs only**: For R2 storage access
- **Server-side only**: All AI model calls

### Security Checklist
- [ ] No hardcoded secrets
- [ ] Environment variables properly configured
- [ ] Input validation implemented
- [ ] Error messages don't leak sensitive info
- [ ] Authentication checks in place

## 🐛 Bug Reports

### Bug Report Template
```markdown
## Bug Description
Clear description of the issue

## Steps to Reproduce
1. Step 1
2. Step 2
3. ...

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g., macOS 14.5]
- Browser: [e.g., Chrome 120]
- Node version: [e.g., 18.17.0]

## Additional Context
Screenshots, logs, or other relevant information
```

## 💡 Feature Requests

### Feature Request Template
```markdown
## Feature Description
Clear description of the proposed feature

## Problem Statement
What problem does this solve?

## Proposed Solution
How should this feature work?

## Alternatives Considered
What other approaches were considered?

## Additional Context
Mockups, user stories, or other relevant information
```

## 📞 Getting Help

### Communication Channels
- **Issues**: GitHub Issues for bugs and feature requests
- **Discussions**: GitHub Discussions for questions
- **Email**: dev@roomsthatsell.com for urgent matters

### Response Times
- **Critical bugs**: Within 24 hours
- **Feature requests**: Within 1 week
- **General questions**: Within 3 business days

## 🎯 Contribution Recognition

We value all contributions! Contributors will be:
- Recognized in release notes for significant contributions
- Invited to team meetings for major features
- Considered for additional responsibilities based on quality

## 📋 Checklist for Contributors

Before submitting your contribution:

- [ ] I am an authorized team member/collaborator
- [ ] I have read and agree to the [LICENSE](LICENSE)
- [ ] I have read the project documentation
- [ ] My code follows the established patterns
- [ ] I have added appropriate tests
- [ ] I have updated documentation if needed
- [ ] I have run all tests locally
- [ ] My PR description includes all required sections
- [ ] I have considered security implications
- [ ] I have checked for breaking changes

## 🚫 What Not to Contribute

- Code that violates our proprietary license
- Features that compromise MLS compliance
- Changes that break existing functionality without migration
- Code without proper tests
- Features that expose sensitive information
- Changes that compromise security

---

Thank you for contributing to RoomsThatSell! Your efforts help us build better virtual staging tools for real estate professionals.

For questions about this guide, contact: dev@roomsthatsell.com
