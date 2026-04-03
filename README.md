# Training Helper – Angular Frontend

Angular 19 SPA that connects to the [TrainingHelper .NET backend](https://github.com/lazarlyutakov/TrainingHelper).

## Local development

### Prerequisites
- Node.js 18+
- .NET backend running on `http://localhost:5000`

### Install & run
```bash
npm install
npm start          # serves on http://localhost:4200
```

All `/api`, `/auth`, `/logout` requests are automatically proxied to `localhost:5000` via `proxy.conf.json` — no CORS setup needed locally.

### Auth flow
1. Visit `http://localhost:4200` → login page
2. Click **Connect with Strava** → redirected to Strava OAuth (on the backend)
3. After authorization, backend sets a cookie and redirects back to `http://localhost:4200`
4. Angular detects the session via `GET /api/me` and shows the dashboard

## Production (Render Static Site)

1. **Build:**
   ```bash
   npm run build:prod
   ```
2. Deploy `dist/training-helper-fe/browser/` as a **Static Site** on Render.
3. Set the **Publish directory** to `dist/training-helper-fe/browser`.
4. Add a rewrite rule: `/* → /index.html` (for Angular routing).

The backend (`training-helper.onrender.com`) must have these env vars set on Render:
| Key | Value |
|---|---|
| `Frontend__Url` | `https://training-helper-fe.onrender.com` |
| `Cors__AllowedOrigins__0` | `https://training-helper-fe.onrender.com` |

## Project structure

```
src/app/
├── core/
│   ├── guards/auth.guard.ts          ← redirects to /login if not authenticated
│   ├── interceptors/credentials.ts   ← adds withCredentials to all requests
│   ├── models/                       ← User, StatsSummary, Activity interfaces
│   └── services/
│       ├── auth.service.ts           ← login / logout / checkAuth
│       └── api.service.ts            ← stats, activities, sync
└── features/
    ├── login/                        ← Strava login page
    └── dashboard/                    ← stats cards, sport split, activities table
```

