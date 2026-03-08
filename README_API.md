# SecureGate API Integration

Use SecureGate as an OpenAI-compatible gateway in front of your provider credentials.

## Base URL

Local development:

```text
http://localhost:3000/v1
```

For a deployed instance, replace `http://localhost:3000` with your own SecureGate URL.

## Quick Start

```typescript
const response = await fetch('http://localhost:3000/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer SG_your_key_here',
  },
  body: JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: 'Hello SecureGate' }],
  }),
})
```

## Environment Variables

```bash
SECUREGATE_BASE_URL=http://localhost:3000/v1
SECUREGATE_KEY=SG_your_security_key_here
# Optional for device-bound keys:
# SG_DEVICE_FINGERPRINT=<output of securegate env>
```

## Request Flow

1. Your app sends an `SG_...` key to SecureGate.
2. SecureGate validates the key and its policy restrictions.
3. SecureGate decrypts the provider credential only for the upstream request.
4. The provider response is streamed back to your app.

## Notes

- Provider keys stay in Supabase, encrypted at rest.
- Security keys can be revoked independently of the upstream provider key.
- Media endpoints use the same `/v1` base URL.

## Support

- Docs: [./docs/usage.md](./docs/usage.md)
- Dashboard: `http://localhost:3000/dashboard`
- Issues: GitHub Issues
