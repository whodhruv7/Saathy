# Setting Up Saathy

Saathy needs Supabase for auth and at least one AI provider key. Use `.env.local` locally and Vercel environment variables in production. Never commit real keys.

## 1. Environment File

```bash
cp .env.example .env.local
```

Fill these:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_OPENROUTER_KEY=your_openrouter_api_key
VITE_GROQ_KEY=gsk_...
VITE_GEMINI_KEY=AIza...
VITE_ENABLE_REMOTE_CHATS=false
```

## 2. Supabase Auth

1. Create/open your Supabase project.
2. Copy Project URL into `VITE_SUPABASE_URL`.
3. Copy anon/public key into `VITE_SUPABASE_PUBLISHABLE_KEY`.
4. Enable Email auth in Authentication → Providers.
5. For Google auth, enable Google provider and add the Google OAuth client ID/secret from Google Cloud.
6. Add redirect URLs:

```text
http://localhost:5173/auth
https://your-vercel-domain.vercel.app/auth
```

If sign-in returns `400`, check: wrong password, user not confirmed, Google provider not enabled, redirect URL missing, or anon key/project URL mismatch.

## 3. AI Provider Keys

### Groq (Recommended — fastest)
1. Go to https://console.groq.com
2. Sign up with email (no credit card needed)
3. Go to API Keys section
4. Copy your API key
5. Add it as `VITE_GROQ_KEY` or paste it in Saathy Settings

**Free Tier:** 14,400 requests/day (basically unlimited for most users)
**Speed:** 300+ tokens/second (fastest free option)
**Best for:** Normal mode chat, quick answers

### OpenRouter (Best variety)
1. Go to https://openrouter.ai
2. Sign up with email
3. Go to API Keys
4. Copy your key
5. Add it as `VITE_OPENROUTER_KEY` or paste it in Saathy Settings

**Endpoint:** `https://openrouter.ai/api/v1/chat/completions`
**Best for:** Research mode, DeepSeek R1 reasoning, diverse model access

If OpenRouter fails:
- `401`: key is invalid or missing.
- `402`: account has no credits for the selected model.
- `429`: rate limit/provider quota exhausted. Wait or switch model/key.
- `404`: model ID is unavailable; choose another OpenRouter model.
- CORS/network: use deployed domain or check browser/network blocker.

### Google Gemini (Best long context)
1. Go to https://ai.google.dev
2. Sign in with Google account
3. Create new API key (no credit card)
4. Copy the key
5. Paste it in Saathy Settings

**Free Tier:** 1,500 requests/day, 1M token context window
**Best for:** Long document analysis, WebDive mode

## 4. Commands

```bash
npm install
npm run dev
npm run build
npm run preview
```

## 5. Vercel Deployment

1. Import the repo into Vercel.
2. Framework preset: Vite.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Add all `VITE_*` env vars in Vercel Project Settings.
6. Add your Vercel auth callback URL to Supabase redirect URLs.
7. Deploy.

## Privacy

- Do not commit `.env` or `.env.local`.
- If any real key was exposed, rotate it in the provider dashboard.
- Browser-stored keys are only for local/user-supplied overrides.

## Troubleshooting

**"API key invalid"** — copy the key again and restart Vite after env changes.
**"Rate limited"** — free-tier provider quota is exhausted; wait or use another provider.
**No response** — verify at least one AI key is present and the browser console shows no CORS/network blocker.
