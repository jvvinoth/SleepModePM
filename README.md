<div align="center">

# 🌙 SleepMode PM

### Your AI product manager that decides what to build next — from your market **and** your code — while you sleep.

**Business leads + code improvements, on autopilot. You make 2 decisions; the AI does the rest.**

[Live Product](https://sleepmodepm.pages.dev) · [Marketing](https://sleepmodepm-site.pages.dev) · [Pitch Deck](https://sleepmodepm-deck.pages.dev) · [Demo Video](https://sleepmodepm-video.pages.dev)

Built at **Daytona HackSprint — Singapore, July 2026**

</div>

---

## The problem

Every team faces the same silent bottleneck: not *how* to build, but knowing **what to build next.**

- **Sales teams** miss high-intent leads buried in website chats and support conversations.
- **Engineering teams** sit on a backlog no one has time to triage into concrete, shippable work.
- Existing AI tools (Cursor, Copilot, Claude Code) only help **after** you've decided *and* written the prompt.

**SleepMode PM decides for you** — it watches your market and your codebase, surfaces prioritized decisions, and executes the approved ones. You wake up to hot leads routed to your team and code improvements ready to merge.

---

## What it does — two autonomous tracks, one dashboard

### 🔥 Business track — from knowledge base to hot leads
1. **Add your website.** [Oxylabs](https://oxylabs.io) crawls your pages live; [Doubleword](https://doubleword.ai) (Qwen3-Embedding) chunks and embeds them into a knowledge base.
2. **The AI agent** answers visitors from that content — in the customer's own language (Tamil, Japanese, Hindi, Bahasa, Mandarin…).
3. **Every conversation is scored Hot / Warm / Cold**, with the visitor's real question and buying signals — leads are *generated from the crawled content*, not templated.
4. **Hot leads instantly alert your team on Telegram and Slack.** No lead goes cold.

### 💻 Engineering track — from repo to shipped code
1. **Connect a GitHub repo.** The **Scout** agent reads the codebase; the **Ideator** agent ([AI&](https://aiand.com) glm-5.2) proposes ranked, repo-grounded improvements (security, UX, tests, new features) with **impact / effort / risk**.
2. **Approve one card.** The **Builder** agent writes the change; **Daytona** spins an isolated sandbox, applies it, installs deps, and boots the app. The **Critic** agent self-repairs on failure.
3. **A live preview URL appears in ~90 seconds** — the real app running in Daytona — ready to **Approve to a Dev branch as a pull request.**
4. **Voice readout** of any idea (browser speech now; designed for a Nosana-hosted TTS model in production).

---

## Why it isn't "another prompt wrapper"

This is a **multi-agent feedback loop with live execution**, not text generation:

```
Scout → Ideator → (you approve) → Builder → Daytona sandbox → Critic (self-repair) → Deployer → live preview → PR
```

Every approved change is **built, tested, and previewed inside a Daytona sandbox** — proven live, not described. You make exactly **two decisions** (which idea, whether to merge). The AI handles research, prioritization, implementation, and testing.

---

## Sponsor stack — every one is load-bearing and verified live

| Sponsor | Role in the product | Where |
|---|---|---|
| **Daytona** | Isolated sandboxes clone, build, run & serve every change as a live preview URL — the execution core | Orchestrator → sandbox |
| **AI&** (`glm-5.2`) | The brain: repo analysis, ideation, code planning | Ideator / Builder |
| **Doubleword** (`Qwen3`) | Knowledge-base embeddings, lead generation, code inference | KB crawl + Leads |
| **Oxylabs** | Live web crawl of the knowledge base (residential proxy) | KB "Add a URL" |
| **Nosana** | Intended production host for the voice-readout TTS model (roadmap) | Idea voice readout |

Remove any of the first four and the product stops working — they're in the critical path.

---

## Architecture

```
web/      Next.js console (Cloudflare Pages)  ── the two-track dashboard
server/   Node/TS orchestrator (Railway)      ── agents + API
          ├─ Scout · Ideator · Builder · Critic · Deployer
          ├─ AI& (ideation)  ·  Doubleword (embeddings, codegen, leads)
          ├─ Oxylabs (live crawl)  ·  Telegram + Slack (hot-lead alerts)
          └─ Daytona SDK → sandboxes → live preview URLs
cms/           marketing site   presentation/  pitch deck   video/  demo video
```

- **No database** — in-memory + a committed ideation snapshot (fast, restart-safe for the demo).
- **RAG-lite** — repo/KB context fed straight into large-context models; embeddings via Doubleword.

---

## Maps to the judging criteria

- **Completeness** — end-to-end and deployed; approve→build→preview runs live inside Daytona.
- **Innovation** — a real multi-agent feedback loop + outside-world signal (crawl, competitors, CVEs), not a prompt wrapper.
- **Real-World Fit** — solves the exact developer/business bottleneck: *deciding what to build*, then shipping it.
- **Sponsor Usage** — four sponsors in the critical path, each doing a real, nameable job.

---

## Run it locally

```bash
# orchestrator
cd server && npm install && npm run start      # http://localhost:8080

# console
cd web && npm install && npm run dev           # http://localhost:3000
```

Requires a `.env` at the repo root — see `.env.example` (Daytona, AI&, Doubleword, GitHub, Telegram, Oxylabs).

Prove the core in one command:
```bash
cd server && npm run spike     # clones a repo into a Daytona sandbox → live preview URL (~30s)
```

---

## Tech

Next.js 16 · TypeScript · Tailwind v4 · Node/Express · Daytona SDK · OpenAI-compatible clients (AI& + Doubleword) · Cloudflare Pages · Railway · GitHub Actions CI.

<div align="center">

**SleepMode PM — wake up to hot leads and shipped code.**

</div>
