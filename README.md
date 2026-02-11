# Metalmeup – Next.js Live Events Tracker

A lightweight web app created for personal use, that tracks and scrapes Metal & Rock concerts happening across Sweden. It collects events from Ticketmaster’s API and scrapes Songkick data through `Next.js` API routes, then displays everything using a custom `shadcn/ui` interface with dark/light themes and favorites.

See it in action: [metalme.app](https://metalme.app/)

## Features

**🎸 Ticketmaster API**

- Fetches events from Ticketmaster API.
- Applies custom filtering to only include events in Sweden with genre classifications.

**🔍 Songkick scraping**

- Scrapes multiple Songkick metro-area pages using Cheerio.
- Cleans data, normalizes dates, removes duplicates.

**⚡ Cached Event Feed**

- Event data is cached in Supabase (single-row `jsonb`), reducing scraping/API calls and improving performance.

## Tech Stack

Frontend:

- `Next.js` (App Router)
- `React`
- `Tailwind CSS`
- `shadcn/ui` with a custom theme
- `Lucide` icons

Backend:

- Next.js API Routes
- Ticketmaster Discovery API integration
- Cheerio for HTML parsing (Songkick)
- Supabase (Postgres) for persistent server-side caching

## Environment Variables

Create a .env.local file in the project root:
```
TM_KEY=YOUR_TICKETMASTER_API_KEY
NEXT_PUBLIC_BASE_URL=http://localhost:3000
SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
```
**Environment Variables Needed:**

- `TM_KEY` — Ticketmaster API key used for fetching events  
- `NEXT_PUBLIC_BASE_URL` — Base URL for local development or production
- `SUPABASE_URL` — Supabase Project URL (e.g. `https://xxxx.supabase.co`)
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-only)

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
## Deployment

The project is deployed on Vercel, using Supabase for server-side event caching.
Deployment works with the same environment variables as local development.

## Events Cache

Use the API endpoint with `?refresh=1` to refresh the cache and fetch new events:
```
YOUR_DOMAIN/api/events?refresh=1
```

## Supabase Cache Table

Create the cache table in your Supabase project:
```
create table if not exists public.events_cache (
  id int primary key,
  fetched_at timestamptz not null,
  payload jsonb not null
);
```

## License

Private project. Non-commercial use.
Event data belongs to Ticketmaster & Songkick.
