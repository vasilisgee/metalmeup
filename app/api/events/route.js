let cachedEvents = null;
let lastCacheTime = 0;
const CACHE_DURATION = 1000 * 60 * 60 * 6; // 6 hours

import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const forceRefresh = searchParams.get("refresh") === "1";
    const now = Date.now();

    // ------------------------------------------------
    // 1) KV CHECK FIRST (unless force refresh)
    // ------------------------------------------------
    if (!forceRefresh) {
      const kvData = await redis.get("events-cache");

      if (kvData) {
        console.log("SERVING FROM KV CACHE");

        return new Response(
          JSON.stringify({
            lastUpdated: kvData.lastUpdated,
            events: kvData.events,
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // ------------------------------------------------
    // 2) MEMORY CACHE CHECK (fallback)
    // ------------------------------------------------
    if (!forceRefresh && cachedEvents && now - lastCacheTime < CACHE_DURATION) {
      console.log("SERVING FROM MEMORY CACHE");

      return new Response(
        JSON.stringify({
          lastUpdated: lastCacheTime,
          events: cachedEvents,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("REFRESHING EVENTS (fetching APIs)…");

    // ------------------------------------------------
    // 3) FETCH TICKETMASTER
    // ------------------------------------------------
    const tmRes = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/ticketmaster`,
      { cache: "no-store" }
    );
    const tmData = await tmRes.json();

    // ------------------------------------------------
    // 4) FETCH SONGKICK
    // ------------------------------------------------
    const skRes = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/songkick`,
      { cache: "no-store" }
    );
    const skData = await skRes.json();

    // ------------------------------------------------
    // 5) COMBINE
    // ------------------------------------------------
    let combined = [...tmData, ...skData];

    // ------------------------------------------------
    // 6) DEDUPLICATE (NAME + DATE + CITY)
    // ------------------------------------------------
    const unique = [];
    const seen = new Set();

    for (const e of combined) {
      const key = `${(e.artist || "").toLowerCase()}_${e.date}_${(e.city || "").toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(e);
      }
    }

    combined = unique;

    // ------------------------------------------------
    // 7) SORT BY DATE
    // ------------------------------------------------
    combined.sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date) - new Date(b.date);
    });

    // ------------------------------------------------
    // 8) SAVE IN MEMORY CACHE
    // ------------------------------------------------
    cachedEvents = combined;
    lastCacheTime = now;

    // ------------------------------------------------
    // 9) SAVE IN KV CACHE (24 hours)
    // ------------------------------------------------
    await redis.set(
      "events-cache",
      {
        lastUpdated: lastCacheTime,
        events: combined,
      },
      { ex: 60 * 60 * 24 } // 24h
    );

    console.log(`KV CACHED ${combined.length} EVENTS`);

    return new Response(
      JSON.stringify({
        lastUpdated: lastCacheTime,
        events: combined,
      }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
}