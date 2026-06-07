# ai-pitch-frontend

Next.js 15 + React 19 web app for the AI pitch scoring backend. Upload pitch decks, see color-coded VC criteria scores, track score variance across multiple runs, and export the full analysis as a PDF.

## Features

- **PDF pitch upload** — Drag-and-drop or click-to-upload multiple pitch PDFs; removable file chips show what's queued before submission
- **Live color-coded scoring** — Backend returns scores + `Color` + `Justification` for each of the 10 VC criteria; the UI renders them with red / yellow / green badges
- **Score-run history** — Re-runs are appended to a `ScoreRunHistory` panel (startup_id, evaluator_id, per-criterion scores, total); helps spot drift across LLM calls
- **Consistency flag** — `GeneralConsistencyFlag` reads the standard deviation across runs and surfaces a "Low / Moderate / Very consistent" badge
- **Markdown analysis rendering** — `react-markdown` renders the LLM-generated analysis report with proper headings, lists, and code blocks
- **PDF report export** — `jspdf` + `html2canvas` snapshot the rendered report DOM and download it as a PDF
- **Proxy API routes** — `pages/api/score.js` and `pages/api/generate_analysis_report.js` stream the multipart request body to the FastAPI backend (no buffering), avoiding the Next.js default body parser size limit

## Tech Stack

- **Framework**: Next.js 15.3.2 (App Router + Pages Router API routes)
- **UI**: React 19, Tailwind CSS 4 (via `@tailwindcss/postcss`)
- **PDF export**: `jspdf`, `html2canvas`, `html2pdf.js`
- **Markdown**: `react-markdown`
- **Server-side fetch**: `node-fetch` (dynamic import inside API routes)
- **Streaming**: `raw-body` (used by the multipart proxy)
- **Language**: TypeScript 5

## Architecture

The app lives in the Next.js `app/` directory (App Router) with two co-located components (`PdfFileList`, `ScoreRunHistory`, `GeneralConsistencyFlag`) and a single `page.tsx` that owns all the state. Server-side proxy routes under `pages/api/` forward `multipart/form-data` to the FastAPI backend unchanged (the backend already does the heavy lifting — PDF parsing, OCR, OpenAI calls). The frontend never talks to OpenAI directly.

```
[Browser]  ── upload PDFs ──►  page.tsx
                                   │
                                   ▼
                       POST /api/score (Next.js route)
                                   │  streams body
                                   ▼
                       FastAPI /score (ai-pitch-backend)
                                   │
                                   ▼
                       {scores, preview_text}
                                   │
                                   ▼
[Browser]  ◄── color-coded UI ──  page.tsx state

[Browser]  ── "Generate Report" ──►  /api/generate_analysis_report
                                              │
                                              ▼
                                  FastAPI /generate_analysis_report
                                              │
                                              ▼
[Browser]  ◄── react-markdown + jsPDF export ──  page.tsx
```

## Getting Started

### Prerequisites

- Node.js 18.17+ (Next.js 15 requires it; React 19 also pulls it up)
- The [ai-pitch-backend](https://github.com/lrddrl/ai-pitch-backend) running locally or on a reachable host

### Setup

```bash
git clone https://github.com/lrddrl/ai-pitch-frontend.git
cd ai-pitch-frontend

npm install
```

### Configure the backend URL

`pages/api/score.js` and `pages/api/generate_analysis_report.js` pick the backend URL by `NODE_ENV`:

```js
const isDev = process.env.NODE_ENV === 'development';
const targetBaseUrl = isDev
  ? 'http://192.168.1.234:8000'   // your LAN IP
  : 'http://3.21.31.199:8000';   // your public IP / host
```

Update both files to point at wherever your FastAPI service is reachable from the Next.js server.

### Run

```bash
npm run dev    # Next.js with Turbopack
# or
npm run build && npm start
```

Visit [http://localhost:3000](http://localhost:3000).

### Lint

```bash
npm run lint
```

## Notable Files

- `app/page.tsx` — main client component, owns upload + score + report state
- `app/PdfFileList.tsx` — file chip list with per-file remove button
- `app/ScoreRunHistory.tsx` — collapsible per-run score breakdown
- `app/GeneralConsistencyFlag.tsx` — visual consistency badge (uses backend `/consistency_analysis` or computes locally from batch results)
- `pages/api/score.js` — multipart proxy to `POST {BACKEND}/score`
- `pages/api/generate_analysis_report.js` — JSON proxy to `POST {BACKEND}/generate_analysis_report`
