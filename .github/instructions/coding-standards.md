# Coding Standards for Agentic Development

## 1. Core Coding Standards (Language-Agnostic)
- Apply SOLID, DRY, and KISS principles in all code, regardless of language.
- Design APIs and interfaces before implementation (API-first).
- Keep files small and modular: refactor at 300+ lines and never exceed 500 lines per file (except for generated code—files created automatically by tools, such as API stubs, ORM models, or build outputs, which are exempt from these limits).
- Use descriptive, consistent naming for variables, functions, and files.
- Handle errors explicitly and fail fast; never ignore errors.
- Validate all inputs and never hardcode secrets or credentials.
- Write clear, minimal comments; prefer self-documenting code.
- Ensure all code is covered by automated tests; aim for high coverage.
- All changes must be reviewed before merging.
- Refactor functions/methods at 40+ lines; never exceed 50 lines. Each function should have a single responsibility.
- Code reviews must reject changes that violate these limits.

## 2. Security & Privacy
- Follow least privilege and secure-by-default principles.
- Never commit secrets, credentials, or sensitive data.
- Sanitize and validate all external input.
- Review for security issues before committing or merging.

## 3. Documentation & Readability
- Keep documentation concise and relevant.
- Update documentation if code changes affect usage, architecture, or workflows.
- Prefer clarity and maintainability over cleverness.

## 4. Agentic Coding Best Practices
- Propose a plan and wait for user confirmation before implementation.
- Keep changes small, incremental, and reviewable.
- Ask clarifying questions if requirements are ambiguous.

## 6. Linting & Formatting
- All code must pass automated linting and be auto-formatted before review. Use project-standard tools for each language.

## 7. Dependency Management
- Use the latest stable versions of dependencies unless there is a documented reason to pin to an older version.
- Regularly review and update dependencies to ensure security and compatibility.
- Document and justify any new third-party dependency or version pinning in the PR or commit message. Avoid unnecessary dependencies.

## 8. Comments & Public APIs
- All public functions, classes, and exported APIs must have clear docstrings or comments describing their purpose and usage.

## 9. Refactoring & Technical Debt
- Flag and, when possible, address technical debt or code smells as part of your workflow. Leave TODOs with context if immediate refactor is not possible.

## 10. Accessibility & Internationalization (if relevant)
- For UI code, follow accessibility (WCAG) and i18n/l10n best practices where applicable.
