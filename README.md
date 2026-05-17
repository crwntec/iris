# IRIS — Insights for WebUntis

A Progressive Web App (PWA) that enhances the WebUntis school timetable experience with real-time change notifications, absence tracking, and timetable statistics.

---

## Features

- **Absence Tracking** — View and filter excused/unexcused absences with sorting and date-range presets
- **Timetable Statistics** — Analyse cancellations, substitutions, homework frequency, and per-subject/teacher breakdowns
- **Push Notifications** — Receive instant alerts when your timetable changes (via Web Push / VAPID)
- **Change Log** — A chronological history of detected timetable changes
- **PWA** — Installable on iOS and Android with offline support via Workbox service worker
- **Background Polling** — The backend polls WebUntis every 5 minutes per subscribed user and only fires a notification when something actually changed (hash-based diffing)

---

## Architecture

```
┌─────────────────────────────────────────┐
│              Browser / PWA              │
│  React + TanStack Query + Tailwind CSS  │
└────────────────┬────────────────────────┘
                 │ /api  (nginx reverse proxy)
┌────────────────▼────────────────────────┐
│           Go HTTP Backend               │
│  net/http · JWT auth · AES-encrypted    │
│  credentials · WebUntis REST client     │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│              Valkey (Redis-compatible)  │
│  Sessions · Timetable snapshots ·       │
│  Change log · Push subscriptions        │
└─────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS 4 |
| Routing | React Router 7 |
| Data Fetching | TanStack React Query 5 |
| PWA | vite-plugin-pwa + Workbox |
| Backend | Go 1.25 |
| Cache / Store | Valkey 8 (Redis-compatible) |
| Auth | JWT (HS256) + AES-256-CBC encrypted passwords |
| Push | Web Push (VAPID) via `webpush-go` |
| CI/CD | GitHub Actions → Docker Hub |
| Deployment | Docker Compose |

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- A WebUntis school account
- VAPID key pair (generate with any VAPID tool, e.g. `web-push generate-vapid-keys`)

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/crwntec/iris.git
cd iris
```

### 2. Configure the backend

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
JWT_SECRET=<random string, 32+ characters>
AES_KEY=<exactly 32 characters>
BASE_URL=<WebUntis base URL, e.g. https://neilo.webuntis.com>
SCHOOL_NAME=<your school's slug>
VAPID_PUBLIC_KEY=<your VAPID public key>
VAPID_PRIVATE_KEY=<your VAPID private key>
```

### 3. Start the stack

```bash
docker compose up -d
```

| Service | Default port |
|---|---|
| Frontend (nginx) | `3000` |
| Backend (Go) | `8080` |
| Valkey | `6379` |

The frontend proxies `/api/*` requests to the backend automatically.

---

## Development

### Backend (Go)

```bash
cd backend
docker compose up -d          # start Valkey only
cp .env.example .env          # fill in values
go run ./cmd/server            # or: air (hot reload)
```

Hot reload with [Air](https://github.com/air-verse/air):

```bash
go install github.com/air-verse/air@latest
air
```

### Frontend (Bun)

```bash
cd frontend
bun install
bun run dev
```

The dev server runs on `http://localhost:5173` and proxies `/api` to `http://localhost:8080`.

---

## API Reference

All protected routes require `Authorization: Bearer <token>`.

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/login` | — | Authenticate and receive a JWT |
| `GET` | `/health` | — | Health check |
| `GET` | `/untis/timetable` | ✓ | Fetch timetable (`?start=YYYY-MM-DD&end=YYYY-MM-DD`) |
| `GET` | `/untis/absences` | ✓ | Fetch absences (`?start=YYYY-MM-DD&end=YYYY-MM-DD`) |
| `GET` | `/untis/changelog` | ✓ | Retrieve the last 20 timetable change entries |
| `GET` | `/push/vapid-public-key` | — | Retrieve the VAPID public key |
| `POST` | `/push/subscribe` | ✓ | Register a push subscription |
| `POST` | `/push/unsubscribe` | ✓ | Remove a push subscription |
| `POST` | `/push/test` | ✓ | Send a test push notification |

---

## Deployment

The included `docker-compose.yml` in the repository root builds images locally. For production, pre-built images are published to Docker Hub via GitHub Actions on every push to `master`.

Images:
- `<DOCKERHUB_USERNAME>/iris-backend:latest`
- `<DOCKERHUB_USERNAME>/iris-frontend:latest`

To deploy from pre-built images, replace the `build:` directives in `docker-compose.yml` with `image:` references.

**Required GitHub Actions secrets:**

| Secret | Description |
|---|---|
| `DOCKERHUB_USERNAME` | Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token |

---

## Environment Variables

### Backend

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | ✓ | Secret used to sign JWTs (32+ chars recommended) |
| `AES_KEY` | ✓ | 32-character key for AES-256 password encryption |
| `BASE_URL` | ✓ | WebUntis instance base URL |
| `SCHOOL_NAME` | ✓ | WebUntis school slug |
| `VAPID_PUBLIC_KEY` | ✓ | VAPID public key for Web Push |
| `VAPID_PRIVATE_KEY` | ✓ | VAPID private key for Web Push |
| `SERVER_PORT` | — | HTTP listen port (default: `8080`) |
| `VALKEY_URL` | — | Valkey address (default: `""`, resolved by Docker DNS as `valkey:6379`) |
| `CORS_ORIGIN` | — | Allowed CORS origin (default: `http://localhost:5173`) |

---

## Project Structure

```
iris/
├── backend/
│   ├── cmd/server/         # Entrypoint
│   ├── internal/
│   │   ├── api/            # HTTP router, handlers, middleware
│   │   ├── config/         # Environment config loader
│   │   ├── diff/           # Timetable diffing & push message generation
│   │   ├── polling/        # Background polling service
│   │   ├── store/          # Valkey abstraction layer
│   │   └── untis/          # WebUntis REST client & types
│   ├── Dockerfile
│   └── docker-compose.yml  # Valkey-only compose for local dev
├── frontend/
│   ├── src/
│   │   ├── api/            # API client
│   │   ├── components/     # Shared UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Route-level page components
│   │   ├── types/          # TypeScript types
│   │   └── util/           # Utility functions
│   ├── Dockerfile
│   └── nginx.conf          # nginx config with API proxy
├── docker-compose.yml      # Full-stack compose
└── .github/workflows/cd.yml
```

---

## License

Licensed under GPL-3.0
