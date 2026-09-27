# Security Policy

## Supported Versions

Security fixes are provided for the latest published minor version.

| Version | Supported |
| --- | --- |
| Latest minor | Yes |
| Older minors | Best effort |

## Reporting a Vulnerability

Please report security issues privately through GitHub Security Advisories when possible, or contact the maintainer through the project homepage.

Do not open public issues for suspected vulnerabilities.

## Scope

Security reports should focus on issues such as:

- unsafe default behavior that can allow destructive migrations unexpectedly
- token, credential or secret exposure in tooling
- package integrity or publish workflow issues
- parser behavior that creates a practical bypass of documented rules

General feature requests and parser coverage improvements should use normal GitHub issues.

## Response

The maintainer will review valid reports, assess impact and publish a fix when needed. Security fixes may be released as patch versions when the public API remains compatible.
