// =============================
// SIMPLE IN-MEMORY CACHE
// =============================

let cachedEvents = null;
let lastCacheTime = 0;
const CACHE_DURATION = 1000 * 60 * 60 * 6; // 6 hours

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const forceRefresh = searchParams.get("refresh") === "1";
    const now = Date.now();

    // ----------------------------
    // Serve from cache when possible
    // ----------------------------
    if (!forceRefresh && cachedEvents && now - lastCacheTime < CACHE_DURATION) {
      console.log("SERVING CACHED RESULTS");

      return new Response(
        JSON.stringify({
          lastUpdated: lastCacheTime,
          events: cachedEvents
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("REFRESHING EVENTS (fetching APIs)…");

    // Fetch Ticketmaster
    const tmRes = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/ticketmaster`,
      { cache: "no-store" }
    );
    const tmData = await tmRes.json();

    // Fetch Songkick
    const skRes = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/songkick`,
      { cache: "no-store" }
    );
    const skData = await skRes.json();

    // Combine both
    let combined = [...tmData, ...skData];

    // Deduplicate
    combined = combined.filter(
      (e, i, arr) =>
        i ===
        arr.findIndex(
          (x) =>
            x.artist === e.artist &&
            x.date === e.date &&
            x.venue === e.venue
        )
    );

    // Sort by date
    combined.sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date) - new Date(b.date);
    });

    // Save to cache
    cachedEvents = combined;
    lastCacheTime = now;

    console.log(`CACHED ${combined.length} EVENTS`);

    return new Response(
      JSON.stringify({
        lastUpdated: lastCacheTime,
        events: combined
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
