# SecureGate

SecureGate is an open source, self-hostable gateway for AI provider credentials. It stores upstream API keys in Supabase, issues scoped `SG_...` keys to your apps and agents, and enforces request-time controls such as IP, city, device, and model restrictions.

## Why It Exists

Most AI apps still ship raw provider keys into agent runtimes, browser code, or CI jobs. SecureGate exists to put a controlled gateway between your applications and those upstream credentials so you can revoke access, audit usage, and tighten runtime policies without rotating every provider key.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase Auth, Postgres, and Edge Functions
- Optional Resend email integration

## Quick Start

1. Copy `.env.example` to `.env` and fill in the required Supabase values.
2. Start Supabase locally:

   ```bash
   supabase start
   ```

3. Apply migrations and regenerate the local database state if needed:

   ```bash
   supabase db reset
   ```

4. Start the web app:

   ```bash
   docker compose up app
   ```

5. Open `http://localhost:3000`.

## Self-Hosting

### Required Supabase setup

1. Install the Supabase CLI and Docker Desktop.
2. Run `supabase start` from the repository root.
3. Copy the local `anon key`, `service_role key`, and API URL from `supabase status` into `.env`.
4. Set `ENCRYPTION_KEY` to a secret that is at least 32 characters long.
5. Email delivery is optional. If you want contact emails or security alerts, set `RESEND_API_KEY`, `SECUREGATE_FROM_EMAIL`, and `CONTACT_EMAIL_TO`.

### Notes

- `docker-compose.yml` runs the Next.js app container only. The Supabase stack is managed by `supabase start`.
- `SUPABASE_INTERNAL_URL` exists so the app container can reach your local Supabase API while the browser still uses `NEXT_PUBLIC_SUPABASE_URL`.
- The repository no longer contains any deployment-specific Supabase URLs, anon keys, service role keys, or committed `.env` values.

## CLI

The CLI in [`cli/README.md`](./cli/README.md) is optional. Point it at your deployment with the `SECUREGATE_*` variables from `.env.example`.

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for local setup expectations and PR guidance.

## License

MIT
