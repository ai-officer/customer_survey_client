# Customer Survey Client

Internal customer-satisfaction survey console for Global Comfort Group.

The client is a React single-page app used by GCG staff to author surveys, send invites, scan QR codes for in-person responses, and review submissions and analytics. It pairs with the [customer_survey_server](https://github.com/ai-officer/customer_survey_server) FastAPI backend.

## Tech stack

- React 19 + TypeScript
- Vite 6 (dev server, build)
- Tailwind CSS 4
- Radix UI primitives (`@radix-ui/react-select`, `@radix-ui/react-slot`)
- react-router-dom 7
- Recharts (analytics charts)
- Motion (animations)
- qrcode.react (QR generation)

> The `package.json` does not yet wire up `vitest`. `yarn lint` runs `tsc --noEmit` as the type/health check; add `vitest` here when test coverage lands.

## Getting started

Requires Node 20+ and Yarn 1.

```bash
yarn install
yarn dev      # http://localhost:3000, proxies /api -> FASTAPI_URL
yarn lint     # tsc --noEmit type check
yarn build    # production build into dist/
yarn preview  # serve the production build locally
```

## Environment variables

Copy `.env.example` to `.env.local` and fill in values. The client reads:

| Variable          | Where           | Purpose                                                                  |
|-------------------|-----------------|--------------------------------------------------------------------------|
| `GEMINI_API_KEY`  | `.env.local`    | Optional. Gemini API key used by AI-assisted survey features.            |
| `APP_URL`         | `.env.local`    | Optional. Public URL of the deployed client (used for self-referential links / QR invite URLs). |
| `FASTAPI_URL`     | shell env       | Dev-only. Target for the Vite `/api` proxy. Defaults to `http://localhost:8000`. |
| `DISABLE_HMR`     | shell env       | Dev-only. Set to `true` to disable Vite HMR.                             |

There is no `VITE_*` runtime variable; the client talks to the backend through a same-origin `/api/*` path that is proxied in dev (`vite.config.ts`) and rewritten in production (`vercel.json`).

## Project structure

The app lives under `src/`. `src/components/` holds the screen-level components (Login, Register, Layout, Dashboard, SurveyList, SurveyForm, SurveyResponse, DetailedAnalytics, UserManagement, DepartmentManagement, EngagementPanel, AuditLogs) plus a `ui/` folder of shared primitives. `src/context/` exposes `AuthContext` for the logged-in session, `src/lib/` contains the API client (`api.ts`), shared icons, and utility helpers, and `src/types.ts` holds shared TypeScript types. Entry points are `src/main.tsx` and `src/App.tsx`.

## Deploy

The client deploys to Vercel. `vercel.json` rewrites `/api/*` to the production FastAPI service and falls back to `index.html` for client-side routing, so no extra build configuration is required beyond setting any non-default env vars in the Vercel project.

## Related repos

- Backend (FastAPI): https://github.com/ai-officer/customer_survey_server
