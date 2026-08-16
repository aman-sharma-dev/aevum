# Security Policy

## Supported versions

Aevum is currently in active pre-release development. Security fixes are applied to the latest code on the default branch only.

| Version | Supported |
| --- | --- |
| Default branch | Yes |
| Older commits, forks, and unofficial builds | No |

## Reporting a vulnerability

Please do not report security vulnerabilities through public GitHub issues, discussions, or pull requests.

Use [GitHub private vulnerability reporting](https://github.com/aman-sharma-dev/aevum/security/advisories/new) to submit a report. Include, when possible:

- The affected component and version or commit
- A clear description of the vulnerability and its potential impact
- Reproduction steps or a minimal proof of concept
- Required configuration, permissions, or environmental conditions
- Any suggested mitigation or remediation

You should receive an initial acknowledgement within 7 days. After validation, maintainers will coordinate remediation and disclosure with the reporter. Please allow a reasonable remediation period before publishing details.

## Scope

Reports involving the mobile application, API, synchronization protocol, local SQLite data, PostgreSQL persistence, dependency configuration, or deployment configuration are in scope.

The repository generates simulated wearable telemetry and is not a medical product. Reports that only demonstrate inaccurate simulated readings, without a security or privacy impact, are not security vulnerabilities.

## Safe harbor

Good-faith security research that avoids privacy violations, data destruction, service disruption, and unauthorized access will be treated as authorized under this policy. Stop testing and report the issue if you encounter real user data, credentials, or secrets.
