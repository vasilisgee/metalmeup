# Metalmeup – Next.js Live Events Tracker

A lightweight web app that aggregates Metal & Rock concerts happening across Sweden. It collects events from Ticketmaster’s API and scrapes Songkick data through `Next.js` API routes, then displays everything using a custom `shadcn/ui` interface with dark/light themes and favorites.

See it in action: [metalme.app](https://metalme.app/)

## Features

**🎸 Ticketmaster API**

- Fetches events from Ticketmaster API.
- Applies custom filtering to only include events in Sweden with genre classifications.

**🔍 Songkick scraping**

- Scrapes multiple Songkick metro-area pages using Cheerio.
- Cleans data, normalizes dates, removes duplicates.

**⚡ Cached Event Feed**

- Server-side caching to avoid repeated scraping.
- Refreshes automatically on demand (`?refresh=1`).
- Ensures fast load times for returning users.

## Tech Stack

Frontend:

- `Next.js` 14 (App Router)
- `React`
- `Tailwind CSS`
- `shadcn/ui` with a custom theme
- `Lucide` icons

Backend:

- Next.js API Routes
- Ticketmaster Discovery API integration
- Cheerio for HTML parsing (Songkick)
- Events cached in memory for fast load times

## Frontend Screenshots
<a href="https://raw.githubusercontent.com/vasilisgee/metalmeup/refs/heads/main/public/screenshot-1.jpg"><img src="https://raw.githubusercontent.com/vasilisgee/metalmeup/refs/heads/main/public/screenshot-1.jpg" width="250"></a>
<a href="https://raw.githubusercontent.com/vasilisgee/metalmeup/refs/heads/main/public/screenshot-2.jpg"><img src="https://raw.githubusercontent.com/vasilisgee/metalmeup/refs/heads/main/public/screenshot-2.jpg" width="250"></a>
<a href="https://raw.githubusercontent.com/vasilisgee/metalmeup/refs/heads/main/public/screenshot-3.jpg"><img src="https://raw.githubusercontent.com/vasilisgee/metalmeup/refs/heads/main/public/screenshot-3.jpg" width="250"></a>

## Environment Variables

Create a .env.local file in the project root:
```
TM_KEY=YOUR_TICKETMASTER_API_KEY
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```
**Environment Variables Needed**

- `TM_KEY` — Ticketmaster API key used for fetching events  
- `NEXT_PUBLIC_BASE_URL` — Base URL for local development or production

## Installation

1. Clone the repository
```
git clone https://github.com/vasilisgee/metalmeup.git
cd metalmeup
```

3. Install dependencies
```
npm install
```
5. Add .env.local
```
(see variables above)
```
4. Start development server
```
npm run dev
```

## Events Cache Clear

Use the API endpoint with `?refresh=1` to refresh the cache and fetch new events:
```
YOUR_DOMAIN/api/events?refresh=1
```

## License

Non-commercial use.
Event data belongs to Ticketmaster & Songkick.
