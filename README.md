# SleepMode PM

**Your AI product manager that decides what to build next — from your code and your market — while you sleep.**

Connect a GitHub repo. SleepMode PM studies your codebase and your market, proposes the next
best moves as visual decision cards, and — on your one-tap approval — builds the change in an
isolated [Daytona](https://daytona.io) sandbox and hands you a live preview URL before merge.

## Two tracks

| Tab | Question it answers | Powered by |
|---|---|---|
| 🔧 **Level Up** | What's weak in what I already built? | Repo analysis + CVE signal |
| 🚀 **What's Next** | What should I build that I haven't? | Market & competitor signals |

## Architecture

```
web/     → Console UI (Next.js, Cloudflare Pages)
server/  → Orchestrator (Node/TS, Railway) — agents: Scout · Ideator · Builder · Critic · Deployer
           └── Daytona sandboxes: clone → build → test → live preview URL
```

## Sponsor stack

- **Daytona** — isolated sandbox runtime: builds every approved change, serves the preview
- **AI&** (`glm-5.2`) — the brain: repo analysis, ideation, implementation
- **Doubleword** (Qwen3) — code inference, embeddings, vision verification
- **Oxylabs** — market, competitor & CVE signals

## Run

```bash
cd server && npm install
npm run spike   # Sprint 0 proof: repo → sandbox → live preview URL (~32s)
npm run dev     # orchestrator
```

Requires a `.env` at repo root — see `.env.example`.

---
Built at Daytona HackSprint Singapore, July 2026.
