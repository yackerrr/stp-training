# STP Training App - Design Session Log
**Date:** 2026-05-12

## Project
- **Location:** `C:\Users\deete\Desktop\stp-training`
- **What:** Vadim's STP 2026 (Seattle to Portland) cycling training PWA
- **Files:** `index.html`, `manifest.json`, `sw.js`, `serve.bat`, icons, `stp-logo.png`

## What Happened

### 1. First Redesign Attempt (Reverted)
- Used Syne + Plus Jakarta Sans fonts
- Warm gold/amber palette
- User didn't like it, reverted to original

### 2. Design Analysis
Identified 7 things to fix:
1. **Typography** — JetBrains Mono is a coding font, not athletic
2. **Color temperature** — cyan/purple feels SaaS, not cycling
3. **Visual hierarchy** — everything same weight, today card should dominate
4. **Card monotony** — all surfaces identical
5. **Route timeline** — major vs mini stops not different enough
6. **Week cards** — current week needs stronger treatment
7. **Checkmarks** — should feel like achievements, not just toggles

### 3. Final Redesign (Current)
User requested Archivo Black, all changes at once.

**Typography:**
- **Archivo Black** (`font-weight: 400`, not stretched) for display: hero, section headers, week labels, today card titles, modal titles
- **Plus Jakarta Sans** for body text
- **JetBrains Mono** for stats/numbers

**Color Palette:**
- `--bg: #0c0b0f` (warm black)
- `--surface: #17161b` / `--surface2: #201f26` / `--surface3: #2d2c34`
- `--amber: #e8953a` (primary accent)
- `--amber-bright: #fbbf24`
- `--coral: #f87171` (peak/intensity)
- `--teal: #2dd4bf` (base phase)
- `--green: #4ade80` (rest/recovery)
- `--text: #eae5dd` / `--text2: #8a8580` / `--text3: #504c47`

**Key Design Details:**
- Today card: dominant with 28px padding, 44px mile number, warm gradient bg, glow shadow
- Current week: amber-to-coral left border gradient (3px)
- Checkmarks done state: amber fill, -5deg rotation (stamp feel), amber glow
- Route dots: major stops 16px with colored glow, mini stops 10px muted
- Storm celebration: warm amber/gold bolts (hue 25-55) instead of cyan
- Subtle ambient radial gradients on body::before
- Nav active state: amber color + top bar with glow
- Progress bar: amber gradient with box-shadow glow
- Tip list bullets: amber dots instead of gray
- Section headers use Archivo Black at 11px uppercase

**What was kept unchanged:**
- All JavaScript logic and data
- Lightning storm animation structure (just recolored)
- Page structure (home, plan, route, tips)
- All functionality (logging, checkmarks, confirm modals, etc.)
- localStorage keys (stp3, stp3done)
- Service worker registration

## Phase Tags
- Base → teal
- Build → amber
- Peak → coral
- Taper → green
- Rest → muted gray
