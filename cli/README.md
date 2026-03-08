# SecureGate CLI

Manage SecureGate connections and scoped `SG_` keys from the terminal.

## Installation

```bash
cd cli
npm install
npm link
```

## Required Environment Variables

The CLI no longer ships with a hosted SecureGate instance baked in. Point it at your own deployment:

```bash
export SECUREGATE_WEB_URL=http://localhost:3000
export SECUREGATE_API_URL=http://localhost:3000/v1
export SECUREGATE_SUPABASE_URL=http://127.0.0.1:54321
export SECUREGATE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Quick Start

```bash
securegate login
securegate connect
securegate keys create
securegate keys list
securegate env
```

## Notes

- The CLI stores local state in `~/.securegate/config.json`.
- Device-bound key snippets come from `securegate env`.
- Full usage examples live in [../docs/usage.md](../docs/usage.md).
