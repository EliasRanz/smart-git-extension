# Linting and Code Standards Setup

## Overview
This document describes the comprehensive linting and code quality tools added to enforce our coding standards automatically.

## Tools Installed

### 1. ESLint with TypeScript Support
- **Purpose**: Enforces coding standards, detects errors, and maintains code quality
- **Configuration**: `.eslintrc.js`
- **Key Rules**:
  - `max-lines`: Maximum 500 lines per file
  - `max-lines-per-function`: Maximum 50 lines per function
  - `complexity`: Maximum complexity of 10
  - `@typescript-eslint/explicit-function-return-type`: Require return types
  - `@typescript-eslint/prefer-readonly`: Enforce readonly for non-reassigned members
  - `jsdoc/require-jsdoc`: Require JSDoc for public APIs

### 2. Prettier Code Formatter
- **Purpose**: Consistent code formatting across the project
- **Configuration**: `.prettierrc.json`
- **Settings**:
  - Single quotes
  - 100 character line width
  - 4-space indentation for TypeScript
  - 2-space indentation for JSON

### 3. Custom File Size Checker
- **Script**: `scripts/check-file-sizes.js`
- **Purpose**: Enforces file size limits per coding standards
- **Limits**:
  - Target: <300 lines per file
  - Maximum: 500 lines per file
  - Excludes generated files and tests

### 4. Custom Function Size Checker
- **Script**: `scripts/check-function-sizes.js`
- **Purpose**: Enforces function size limits per coding standards
- **Limits**:
  - Target: <40 lines per function
  - Maximum: 50 lines per function
  - Analyzes TypeScript functions and methods

### 5. Pre-commit Hooks (Husky + lint-staged)
- **Purpose**: Automatically runs linting and formatting before commits
- **Tools**: Husky for git hooks, lint-staged for staged files
- **Actions**: ESLint fix, Prettier format, standards check

## Available NPM Scripts

### Linting Commands
```bash
# Run ESLint on all TypeScript files
npm run lint

# Run ESLint with auto-fix
npm run lint:fix

# Format all files with Prettier
npm run format

# Check formatting without changing files
npm run format:check
```

### Standards Checking
```bash
# Check file sizes against standards
npm run check-file-sizes

# Check function sizes against standards  
npm run check-function-sizes

# Run all standards checks
npm run check-standards

# Pre-commit check (runs automatically)
npm run pre-commit
```

## VS Code Integration

### Required Extensions
The following extensions are recommended in `.vscode/extensions.json`:
- `esbenp.prettier-vscode` - Prettier formatter
- `dbaeumer.vscode-eslint` - ESLint integration
- `ms-vscode.vscode-typescript-next` - Enhanced TypeScript support

### Editor Settings
Configured in `.vscode/settings.json`:
- Format on save enabled
- ESLint auto-fix on save
- 100-character ruler
- Consistent indentation (4 spaces for TS, 2 for JSON)

## Coding Standards Enforced

### File Organization
- ✅ Maximum 500 lines per file (target <300)
- ✅ Single responsibility per file
- ✅ Descriptive file names

### Function Design
- ✅ Maximum 50 lines per function (target <40)
- ✅ Single responsibility per function
- ✅ Maximum complexity of 10

### Documentation
- ✅ JSDoc required for all public APIs
- ✅ Required parameter and return type documentation
- ✅ Class and interface documentation

### Code Quality
- ✅ Explicit return types for functions
- ✅ Readonly modifiers where appropriate
- ✅ Prefer nullish coalescing (??) over logical OR (||)
- ✅ Explicit error handling
- ✅ No unused variables or imports

### TypeScript Best Practices
- ✅ Strict type checking
- ✅ No explicit 'any' (warnings)
- ✅ Prefer optional chaining
- ✅ Consistent naming conventions

## Configuration Files

### `.eslintrc.js`
Comprehensive ESLint configuration with:
- TypeScript-specific rules
- Documentation requirements (JSDoc)
- Code complexity limits
- Best practice enforcement
- Security rules

### `.prettierrc.json`
Prettier formatting configuration:
- Single quotes, semicolons
- 100-character line width
- Consistent indentation
- File-specific overrides

### `package.json` Scripts
Added scripts for:
- Linting and formatting
- Standards checking
- Pre-commit hooks
- Automated quality checks

## Usage Workflow

### During Development
1. **Real-time feedback**: ESLint and Prettier provide immediate feedback in VS Code
2. **Auto-formatting**: Code is automatically formatted on save
3. **Problem highlighting**: Issues are highlighted in the editor

### Before Committing
1. **Pre-commit hooks**: Automatically run when committing
2. **Lint-staged**: Only checks modified files for efficiency
3. **Standards validation**: File and function size checks run
4. **Blocking**: Commit is prevented if standards are violated

### Continuous Integration
The standards can be enforced in CI/CD by running:
```bash
npm run check-standards
```

## Benefits

### Automated Enforcement
- No manual code review needed for basic standards
- Consistent formatting across all developers
- Early detection of violations

### Developer Experience
- Real-time feedback in editor
- Automatic fixes for many issues
- Clear error messages with actionable guidance

### Code Quality
- Enforced documentation standards
- Consistent code style
- Reduced complexity and improved maintainability

### Team Collaboration
- Reduced bike-shedding on formatting
- Consistent standards across contributors
- Automated on boarding for new developers

## Troubleshooting

### Common Issues

1. **ESLint errors on save**
   - Install recommended VS Code extensions
   - Check `.vscode/settings.json` configuration

2. **Pre-commit hooks not running**
   - Run `npx husky install` to set up hooks
   - Ensure lint-staged is configured correctly

3. **Standards check failures**
   - Run individual checks to identify specific issues
   - Use `npm run lint:fix` to auto-fix many problems
   - Refactor large files/functions as needed

### Disabling Rules
For exceptional cases, rules can be disabled:
```typescript
// eslint-disable-next-line rule-name
const specialCase = something;
```

However, this should be used sparingly and with justification.

## Future Enhancements

Potential improvements to the linting setup:
1. **SonarQube integration** for advanced code quality metrics
2. **Performance linting** for VS Code extension best practices
3. **Security linting** with specialized security rules
4. **Test coverage enforcement** with coverage thresholds
5. **Dependency checking** for security vulnerabilities
