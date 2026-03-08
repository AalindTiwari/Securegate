# Contributing

Thanks for contributing to SecureGate.

## Local setup

1. Copy `.env.example` to `.env` and fill in the required values.
2. Start Supabase locally with `supabase start`.
3. Run the web app with `docker compose up app` or `npm install && npm run dev`.
4. If you use the CLI, set the `SECUREGATE_*` environment variables from `.env.example`.

## Before opening a PR

1. Keep secrets, personal data, and deployment-specific values out of commits.
2. Update docs when you add or rename environment variables, routes, or setup steps.
3. Prefer small, focused pull requests with a clear user-facing reason.

## Pull requests

- Describe the problem and the approach you took.
- Include screenshots for UI changes.
- Note any manual setup, migration, or environment changes reviewers should know about.

## Security

If you find a security issue, avoid committing proof-of-concept secrets or exploit payloads to the repository. Open a private report through the maintainer channel for the deployment you are reviewing.
