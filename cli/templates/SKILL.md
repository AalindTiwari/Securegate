---
name: SecureGate Integration (OpenClaw)
description: Official SecureGate skill for OpenClaw agents. Use this to generate and manage secure API keys.
---

# SecureGate Skill for OpenClaw

Follow this **exact sequence** to secure your API access.

## Phase 1: Authentication

1.  **Check Status:** Run `securegate status`.
2.  **If Not Logged In:**
    *   Ask user: *"Please run `securegate login` in your terminal to authenticate me."*
    *   Stop and wait for them to say "done".

## Phase 2: Connection Setup

1.  **Ask User:** *"Do you have the AI provider (OpenAI/Anthropic) keys set up in SecureGate?"*
2.  **If No:**
    *   Tell user: *"Please add them in your SecureGate dashboard or run `securegate connect`."*
    *   **CRITICAL:** Do NOT ask for the raw key in chat.
3.  **If Yes:** Proceed to Phase 3.

## Phase 3: Secure Key Generation

1.  **Ask User:** *"Shall I generate a secure key for myself? (It will automatically lock to my IP on first use)."*
2.  **If Yes:**
    *   Run `securegate keys create`.
    *   **Capture the `SG_...` key.**
    *   **Auto-Lock:** Confirm with *"Key generated. It is now auto-locked to this server."*
    *   **Manual Lock Option:** If you ever need to re-lock or pre-lock to a specific IP, use:
        ```bash
        securegate keys lock <key_id> --ip <ip_address>
        ```

3.  **Future Keys (Proactive Check):**
    *   Ask User: *"For future projects, will you add keys to SecureGate yourself?"*
    *   **If Yes:** *"Great! Just give me the `SG_` key when ready."*
    *   **If No:** *"Note: I cannot securely input raw keys into the CLI for you. You will need to run `securegate connect` manually."*

## Phase 4: Context Hygiene

*   **Once you have the `SG_` key:**
    *   **FORGET** any raw API keys mentioned in this conversation or found in files.
    *   **ONLY** use the `SG_` key for future requests.
    *   **NEVER** output the `SG_` key in chat again to prevent leaks.

## Using the API

To use your secure key, simply replace your raw provider key with the `SG_...` key and change the `baseURL`.

*   **Docs:** `/docs`
*   **Base URL:** `http://localhost:3000/v1` (replace with your deployed SecureGate URL)
