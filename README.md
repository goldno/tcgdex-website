# TCGDex Website

A web app for browsing and tracking Pokémon TCG card prices over time.

Live site: https://goldno.github.io/tcgdex-website/

## Features

- Browse all tracked high-rarity Pokémon TCG cards
- Search cards by name
- Filter by set and sort by any column
- Click a card to view its details and a price history chart (Normal, Holofoil, Reverse Holofoil variants)

## Architecture

```
Browser (React app on GitHub Pages)
        ↓  fetch()
Railway API (Express + PostgreSQL)
```

The frontend is a static React app hosted on GitHub Pages. It calls the TCGDex API directly — there is no separate backend for the website.

| Layer | Tech | Host |
|---|---|---|
| Frontend | React + Vite | GitHub Pages |
| API | Express (Node.js) | Railway |
| Database | PostgreSQL | Railway |

The Railway API also runs background cron jobs:
- Daily price sync at 21:00 UTC
- Weekly card discovery every Monday at 22:00 UTC

## Development

```bash
npm install
npm run dev
```

The dev server proxies `/api/*` to the Railway API, so no local API setup is needed.

## Deployment

The site deploys automatically to GitHub Pages via GitHub Actions on every push to `main`.

To deploy manually:
```bash
npm run build
```

The `VITE_API_URL` environment variable can override the API base URL (defaults to the Railway API in production).
