import { getSupabaseAdmin } from "@/lib/supabase/admin";

const CACHE_TABLE = "events_cache";
const CACHE_ID = 1;

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const forceRefresh = searchParams.get("refresh") === "1";
    const supabase = getSupabaseAdmin();

    // ------------------------------------------------
    // 1) LOAD FROM SUPABASE (unless force refresh)
    // ------------------------------------------------
    if (!forceRefresh) {
      const { data: cacheRow, error: cacheError } = await supabase
        .from(CACHE_TABLE)
        .select("fetched_at, payload")
        .eq("id", CACHE_ID)
        .maybeSingle();

      if (cacheError) throw cacheError;

      return jsonResponse({
        lastUpdated: cacheRow?.fetched_at ?? null,
        events: cacheRow?.payload ?? [],
      });
    }

    console.log("REFRESHING EVENTS (fetching APIs)…");

    // ------------------------------------------------
    // 2) FETCH TICKETMASTER
    // ------------------------------------------------
    const tmRes = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/ticketmaster`,
      { cache: "no-store" }
    );
    if (!tmRes.ok) {
      throw new Error(`Ticketmaster API failed (${tmRes.status})`);
    }
    const tmData = await tmRes.json();

    // ------------------------------------------------
    // 3) FETCH SONGKICK
    // ------------------------------------------------
    const skRes = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/songkick`,
      { cache: "no-store" }
    );
    if (!skRes.ok) {
      throw new Error(`Songkick API failed (${skRes.status})`);
    }
    const skData = await skRes.json();

    // ------------------------------------------------
    // 4) COMBINE
    // ------------------------------------------------
    const tmEvents = Array.isArray(tmData) ? tmData : [];
    const skEvents = Array.isArray(skData) ? skData : [];
    let combined = [...tmEvents, ...skEvents];

    // ------------------------------------------------
    // 5) DEDUPLICATE (NAME + DATE + CITY)
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
    // 6) SORT BY DATE
    // ------------------------------------------------
    combined.sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date) - new Date(b.date);
    });

    // ------------------------------------------------
    // 7) SAVE IN SUPABASE
    // ------------------------------------------------
    const fetchedAt = new Date().toISOString();
    const payload = combined;

    const { error: upsertError } = await supabase
      .from(CACHE_TABLE)
      .upsert(
        {
          id: CACHE_ID,
          fetched_at: fetchedAt,
          payload,
        },
        { onConflict: "id" }
      );

    if (upsertError) {
      console.error("SUPABASE UPSERT ERROR", {
        message: upsertError.message,
        code: upsertError.code,
        details: upsertError.details,
        hint: upsertError.hint,
      });
      throw upsertError;
    }

    console.log(`SUPABASE STORED ${combined.length} EVENTS`);

    return jsonResponse({
      lastUpdated: fetchedAt,
      events: combined,
    });

  } catch (err) {
    console.error("EVENTS ROUTE ERROR", err);
    return jsonResponse(
      {
        error: err?.message || "Unknown error",
        name: err?.name || null,
        cause: err?.cause?.message || null,
      },
      500
    );
  }
}
