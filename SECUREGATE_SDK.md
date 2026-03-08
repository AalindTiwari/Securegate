# SecureGate SDK

Simple helper patterns for integrating your own project with a SecureGate deployment.

## Installation

```typescript
// Copy lib/securegate-config.ts to your project
import { SECUREGATE_CONFIG, getProxyURL } from './lib/securegate-config'
```

## Quick Start

Visit your SecureGate dashboard:

```text
http://localhost:3000/dashboard
```

Create a connection and save:
- **Connection ID**: `openai_abc123`
- **Security Key**: `SG_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## Make Requests

```typescript
import { getProxyURL } from './lib/securegate-config'

const response = await fetch(getProxyURL('/v1/chat/completions'), {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.SECUREGATE_KEY}`,
  },
  body: JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: 'Hello SecureGate' }],
  }),
})

const data = await response.json()
console.log(data.choices[0].message.content)
```

## Environment Variables

```bash
SECUREGATE_KEY=SG_your_security_key_here
```

## API Endpoints

All requests go through the SecureGate proxy:

```text
Base URL: http://localhost:3000/v1
```

### OpenAI-compatible routes

```text
POST /v1/chat/completions
POST /v1/completions
POST /v1/embeddings
POST /v1/audio/transcriptions
POST /v1/audio/speech
POST /v1/images/generations
```

### Anthropic-compatible routes

```text
POST /v1/messages
```

## Custom Headers

```typescript
fetch('http://localhost:3000/v1/chat/completions', {
  headers: {
    'Authorization': `Bearer ${SECUREGATE_KEY}`,
    'x-device-fingerprint': 'your-device-fingerprint',
  },
})
```

## Support

- Docs: [./docs/usage.md](./docs/usage.md)
- Dashboard: `http://localhost:3000/dashboard`
- Issues: GitHub Issues
