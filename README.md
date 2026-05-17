# The NESt Green Economy Oracle

Fullscreen kiosk web app for **NESt 2026** — the Nigerian Environmental Summit hosted by the **Nigerian Environmental Summit Group (NESUG)** at the Abuja Continental Hotel, 17–18 June 2026.

Theme: **Unlocking Nigeria's Green Economy.**

Visitors type a question (or tap a starter card) and the Oracle responds with a concise, Nigeria-grounded answer powered by Claude.

---

## Project structure

```
.
├── index.html           # the kiosk page (served at /)
├── api/
│   └── oracle.js        # serverless function — proxies to Anthropic API
├── assets/
│   └── nesug-logo.jpg   # logo shown in the header
├── vercel.json          # Vercel config (clean URLs, 30s function timeout)
└── package.json
```

The browser **never** sees the Anthropic API key. All AI calls go through `/api/oracle`, which runs server-side on Vercel.

---

## Deploy to Vercel

### Option A — via the Vercel dashboard (no CLI needed)

1. Push this project to a new GitHub/GitLab/Bitbucket repository.
2. Go to **https://vercel.com/new**, import the repo. Vercel auto-detects it as a static + serverless project — no framework preset, no build command.
3. Before clicking **Deploy**, expand **Environment Variables** and add:

   | Name                | Value                              |
   | ------------------- | ---------------------------------- |
   | `ANTHROPIC_API_KEY` | *your key from console.anthropic.com* |

4. Click **Deploy**. Done — visit the URL Vercel gives you.

### Option B — via the Vercel CLI

```bash
npm i -g vercel
vercel login
vercel            # first run → links project, asks a few questions
vercel env add ANTHROPIC_API_KEY     # paste the key, choose "Production" (and "Preview" if you want)
vercel --prod     # deploy
```

### Local development

```bash
vercel dev
```

This serves `index.html` AND runs the `/api/oracle` function locally on `http://localhost:3000`. Drop your key into a local `.env` file first:

```
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Changing the model or prompt

Both live in `api/oracle.js`:

- `model: 'claude-haiku-4-5'` — swap for any Anthropic model (e.g. `claude-sonnet-4-5`)
- `SYSTEM_PROMPT` at the top of the file — tweak tone, length, or focus areas

After editing, push to the connected branch (auto-deploys) or run `vercel --prod`.

---

## Replacing the logo

Drop a new file at `assets/nesug-logo.jpg`. The header has a circular slot that crops anything to a centered circle; a square 1:1 source works best.

---

## Notes for kiosk operators

- The app is responsive but designed for a **landscape touchscreen**. Chrome → kiosk mode (`--kiosk --app=https://your-deployment.vercel.app`) is the cleanest setup.
- The textarea is capped at 500 characters; the function rejects anything over 1000 server-side.
- The serverless function has a 30-second timeout — well above typical model latency.
- If you see "The Oracle is offline," check the Vercel function logs for the underlying error (most often a missing or invalid API key).
