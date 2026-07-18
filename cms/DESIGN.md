# SleepMode PM — Design System

**Direction:** Enterprise SaaS. Facebook-blue anchored, white/neutral canvas, blue used as a
disciplined accent. Think Linear/Stripe restraint with a familiar corporate-blue trust cue.

**Principles**
1. Neutral canvas, one accent. Blue signals action/active only — never decoration.
2. Whitespace over borders. Let content breathe; borders are subtle, shadows barely-there.
3. Consistency > cleverness. Same radius, same spacing scale, same chip style everywhere.
4. Data-dense but calm. Cards + chips organize; nothing shouts.

---

## Color tokens (light — primary theme)

```
/* Brand */
--brand-500: #1877F2;   /* Facebook blue — primary actions, active states, links */
--brand-600: #166FE5;   /* hover */
--brand-700: #1461CC;   /* pressed */
--brand-tint:#EBF3FF;   /* selected/active backgrounds, focus rings */

/* Neutrals (the real workhorse) */
--canvas:    #F0F2F5;   /* app background */
--surface:   #FFFFFF;   /* cards, panels, top bar */
--surface-2: #F7F8FA;   /* subtle inset areas */
--border:    #E4E6EB;   /* card & divider borders */
--border-2:  #DADDE1;   /* stronger dividers */
--text-1:    #1C1E21;   /* primary text (near-black) */
--text-2:    #65676B;   /* secondary text */
--text-3:    #8A8D91;   /* muted / captions */

/* Semantic (chips, status) */
--green-500: #31A24C;  --green-tint: #E3F1E6;   /* success / low-risk / high-impact */
--amber-500: #E9A23B;  --amber-tint: #FCF1DE;   /* warning / medium */
--red-500:   #E41E3F;  --red-tint:   #FBE7EA;   /* danger / high-risk / security */
--purple-500:#5B5BD6;  --purple-tint:#ECECFB;   /* "What's Next" track accent */
```

**Track accents (differentiate the two tabs):**
- 🔧 **Level Up** → brand blue (`--brand-500`)
- 🚀 **What's Next** → purple (`--purple-500`)
Same card style, different accent bar/icon so the two tracks read distinctly.

**Optional dark mode:** skip for the hackathon unless ahead. If added: `--canvas:#18191A`,
`--surface:#242526`, `--border:#3A3B3C`, `--text-1:#E4E6EB`, keep brand blue.

---

## Typography

- **Font:** Inter (via `next/font`), fallback system stack. Weights 400/500/600/700.
- **Numbers/timestamps/code:** `ui-monospace, "SF Mono", monospace`.

| Role | Size / weight / line-height |
|---|---|
| Page title (H1) | 28px · 600 · 1.25 |
| Section (H2) | 20px · 600 · 1.3 |
| Card title (H3) | 16px · 600 · 1.4 |
| Body | 14px · 400 · 1.5 |
| Secondary/body-sm | 13px · 400 · 1.5 · `--text-2` |
| Chip / label | 12px · 500 · 1 (letter-spacing 0.02em) |

Headings: `--text-1`, tight tracking. Never smaller than 12px anywhere.

---

## Spacing · radius · elevation

- **Spacing scale (4px base):** 4 · 8 · 12 · 16 · 24 · 32 · 48. Card padding 20px; card gap 16px.
- **Radius:** buttons/inputs 8px · cards 12px · chips/badges pill (999px) · modals 16px.
- **Elevation (barely-there):**
  - card: `0 1px 2px rgba(0,0,0,.06)`
  - card-hover: `0 2px 8px rgba(0,0,0,.08)`
  - popover/modal: `0 8px 24px rgba(0,0,0,.12)`
- **Focus ring:** `0 0 0 3px rgba(24,119,242,.35)`.

---

## Core components

**Buttons** (height 40, radius 8, 14px/500):
- Primary: `--brand-500` bg, white text; hover `--brand-600`.
- Secondary: `--surface` bg, `--border` 1px, `--text-1`; hover `--surface-2`.
- Ghost: transparent, `--text-2`; hover `--surface-2`.
- Danger: `--red-500` bg, white.

**Cards:** `--surface`, 1px `--border`, radius 12, padding 20, card shadow. Header = icon +
title (H3) + chip row. Hover: lift to card-hover + border `--border-2`.

**Chips / badges** (pill, 12px/500, tinted): e.g. High impact → `--green-tint` bg + `#1E7B34`
text; Security/High risk → `--red-tint` + `--red-500`; Effort S/M/L → neutral (`--surface-2`
bg, `--text-2`). One chip = one fact; keep to ≤3 per card.

**Tabs:** underline style. Active tab: `--text-1` + 2px accent underline (blue for Level Up,
purple for What's Next). Inactive: `--text-2`.

**Sidebar (left, 240px):** `--surface`, item = icon + label, active = `--brand-tint` bg +
`--brand-500` icon/text + 3px left accent bar. Sections: Dashboard · Level Up · What's Next ·
Repositories · Activity · Settings.

**Top bar (56px):** repo selector (dropdown), "Connect repo" primary button, live-status pill,
avatar. `--surface`, bottom 1px `--border`.

**Activity timeline:** vertical line, status dots — pending `--text-3`, active `--brand-500`
(pulse), done `--green-500`, error `--red-500`. Monospace timestamps in `--text-3`.

**Sandbox status pill:** Building (spinner + amber), Ready (green + preview link), Failed (red).

**Preview panel:** browser-chrome mock — grey URL bar with the Daytona preview URL + an iframe
below. This is the money shot; give it a clean frame.

**Inputs:** 40px, radius 8, 1px `--border`, focus → brand ring. Placeholder `--text-3`.

---

## The two signature screens

**Signals feed (What's Next):** left = scrollable signal cards (competitor logo/name, "shipped
X", source + relative date), right = a 2×2 opportunity map (Impact ↑ vs Effort →) with idea
dots. Purple accent. This screen must look like a founder's intelligence console — spend polish
here.

**Decision card (both tabs):** icon + title (H3) → one-line rationale (body-sm) → chip row
(impact / effort / risk) → primary "Build preview" + ghost "Dismiss". On approve → morphs into
a live status card (timeline → preview link).

---

## Iconography
- **Lucide** icons, 20px, `--text-2` default / accent when active. Consistent stroke (1.75).
- Suggested: Level Up = `wrench`/`shield`, What's Next = `rocket`/`sparkles`, Signals = `radar`,
  Sandbox = `box`, Preview = `monitor`, Approve = `check-circle`.

## Do / Don't
- ✅ White canvas, one blue accent, tinted chips, generous padding, consistent radius.
- ❌ Gradients, heavy shadows, 4+ competing colors, tiny text, blue-on-everything, emoji as UI.
