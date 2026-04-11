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
