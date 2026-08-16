# Contributing to Aevum

Thank you for contributing to Aevum. Bug fixes, documentation improvements, tests, and focused feature proposals are welcome.

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Before you begin

- Search existing issues and pull requests before opening a duplicate.
- Use the appropriate issue form for bugs and feature requests.
- Discuss large changes in an issue before implementation.
- Report vulnerabilities privately according to [SECURITY.md](SECURITY.md).
- Keep contributions focused; avoid unrelated refactors or formatting churn.

## Development setup

Requirements and complete startup instructions are maintained in [README.md](README.md). The minimum JavaScript setup is:

```powershell
corepack enable
pnpm install
pnpm check
pnpm test
pnpm build
```

For the backend, Docker Compose is the recommended development environment:

```powershell
docker compose up --build -d
Invoke-RestMethod http://localhost:8000/health
```

For local Python verification, use Python 3.11 or newer:

```powershell
cd apps/api
.\.venv\Scripts\python.exe -m pip install -e ".[dev]"
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\python.exe -m ruff check .
```

## Branches and commits

1. Fork the repository and create a branch from the default branch.
2. Use a concise branch name such as `fix/sqlite-sync-race` or `docs/android-setup`.
3. Write clear, imperative commit messages.
4. Do not commit secrets, `.env` files, virtual environments, generated build output, or editor-specific files.
5. Rebase or merge the latest default branch before requesting final review when necessary.

## Coding expectations

- Preserve the existing architecture unless a change has been discussed.
- Add or update tests for behavior changes and bug fixes.
- Maintain strict TypeScript and Python typing.
- Keep public schemas backward compatible unless a breaking change is intentional and documented.
- Treat telemetry as sensitive even though the included simulator generates dummy data.
- Keep the mobile UI accessible, safe-area aware, and usable on physical Android devices.
- Avoid introducing dependencies when the existing stack can solve the problem cleanly.

## Pull requests

Before opening a pull request:

- Run the relevant checks and tests.
- Update documentation for user-visible or operational changes.
- Confirm no secrets or personal data are present in the diff.
- Complete the pull-request template fully.
- Link the issue the change resolves, when applicable.

Pull requests should be small enough to review, explain why the change is needed, and identify any testing limitations. Maintainers may request changes before merging.
