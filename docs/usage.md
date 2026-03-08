# Using SecureGate

SecureGate is a self-hostable gateway for storing provider credentials in Supabase and exposing scoped `SG_...` keys to agents and applications.

## Concepts

- **Security Key**: A revocable SecureGate key used by your app instead of a raw provider credential.
- **Base URL**: By default, local development uses `http://localhost:3000/v1`.
- **Policy Checks**: Requests can be restricted by IP, city, device fingerprint, and model allow-list.

## Prerequisites

1. Start the SecureGate web app and local Supabase stack.
2. Add a provider connection in the dashboard.
3. Generate a SecureGate key for that connection.

## Quick Start

```python
from openai import OpenAI

client = OpenAI(
    api_key="SG_your_key_here",
    base_url="http://localhost:3000/v1",
)

response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "Hello, SecureGate"}],
)

print(response.choices[0].message.content)
```

Replace `http://localhost:3000` with your deployed SecureGate URL when you self-host outside local development.

## Device Binding

Bind a key to the current machine:

```bash
securegate keys bind-device SG_your_key_here
```

Print the header value for SDKs or raw HTTP clients:

```bash
securegate env
```

Use the returned value as the `x-device-fingerprint` header when a key is device-bound.

## Media Endpoints

SecureGate forwards OpenAI-compatible media requests over the same `/v1` base URL.

```bash
curl http://localhost:3000/v1/audio/transcriptions \
  -H "Authorization: Bearer SG_your_key_here" \
  -H "x-device-fingerprint: YOUR_FINGERPRINT" \
  -F "file=@audio.mp3" \
  -F "model=whisper-1"
```

## Operational Notes

- Provider API keys are encrypted before storage.
- Security keys can be revoked without rotating the upstream provider key.
- Audit logs are stored in Supabase for request visibility.
