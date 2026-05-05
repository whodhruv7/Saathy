<<<<<<< HEAD
# Saathy — MUN Research Intelligence

Debate research intelligence system for Model United Nations delegates.

Saathy turns a delegate prompt into a structured, source-tagged debate dossier with legal, data, institutional, timeline, global-comparison, counter-strategy, speech, and verification sections.

## Features

- ⚡ **Normal mode** — Instant chat and debate help (Groq)
- 🧠 **Research mode** — 6 specialized sub-modes (DeepSeek, Qwen, Mistral)
- 🔬 **Pipeline mode** — Multi-stage deep research (all models)
- 📝 **Notes** — Save research and arguments

## Local Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:5173`.

## Build / Preview

```bash
npm run build
npm run preview
```

## Environment Variables

Never commit real keys. Use `.env.local` locally and Vercel Project Settings in production.

Required:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_OPENROUTER_KEY=your_openrouter_api_key
VITE_GROQ_KEY=GROQ_KEY
VITE_GEMINI_KEY=GEMINI_KEY
```

Optional:

```bash
VITE_ENABLE_REMOTE_CHATS=false
```

Google auth requires enabling Google in Supabase Auth Providers and adding these redirect URLs:

```text
http://localhost:5173/auth
https://your-vercel-domain.vercel.app/auth
```

See [SETUP.md](SETUP.md) for provider setup.

## Privacy

- Real secrets belong only in `.env.local`, Vercel env vars, or provider dashboards.
- `.env` and `.env.*` are ignored except `.env.example`.
- If a real key was ever committed, rotate it before production.

## Tech Stack

- React + TypeScript
- Tailwind CSS
- Vite
- Supabase Auth
- Direct AI provider calls with graceful fallbacks

## License

MIT
=======
# Saathy
aathy is an AI-powered intelligence engine that transforms simple queries into structured, data-rich, multi-dimensional insights. Designed for deep research, debate preparation, and high-signal decision making, it delivers elite-level outputs with clarity, depth, and precision.
>>>>>>> cbbc0d7d5252499690fa2a2fe0530bd5fcb711f1
