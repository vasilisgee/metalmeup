import * as cheerio from "cheerio";

const CITY_URLS = [
  "https://www.songkick.com/metro-areas/32252-sweden-stockholm/genre/metal",
  "https://www.songkick.com/metro-areas/34443-sweden-gothenburg/genre/metal",
  "https://www.songkick.com/metro-areas/32247-sweden-malmo/genre/metal",
  "https://www.songkick.com/metro-areas/32255-sweden-uppsala/genre/metal",
  "https://www.songkick.com/metro-areas/104871-sweden-orebro/genre/metal",
  "https://www.songkick.com/metro-areas/32238-sweden-eskilstuna/genre/metal",
  "https://www.songkick.com/metro-areas/105031-sweden-linkoping/genre/metal",
  "https://www.songkick.com/metro-areas/32242-sweden-helsingborg/genre/metal",
  "https://www.songkick.com/metro-areas/32248-sweden-norrkoping/genre/metal",
  "https://www.songkick.com/metro-areas/72136-sweden-jonkoping/genre/metal",
  "https://www.songkick.com/metro-areas/71911-sweden-boras/genre/metal",
  "https://www.songkick.com/metro-areas/56223-sweden-gavle/genre/metal",
  "https://www.songkick.com/metro-areas/32241-sweden-halmstad/genre/metal",
  "https://www.songkick.com/metro-areas/32257-sweden-vaxjo/genre/metal",
  "https://www.songkick.com/metro-areas/72496-sweden-trollhattan/genre/metal",
  "https://www.songkick.com/metro-areas/57020-sweden-solvesborg/genre/metal"
];

// --- sleep delay (safe mode)
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Normalize date formats from Songkick
function normalizeDate(raw) {
  if (!raw) return null;

  // Songkick format example: “Saturday February 21, 2026”
  try {
    const d = new Date(raw);
    if (!isNaN(d)) return d.toISOString().split("T")[0];
  } catch {}
  return null;
}

// Scrape individual event page for venue, city + related events
async function scrapeEventPage(url) {
  try {
    await sleep(250 + Math.random() * 150); // SAFE MODE

    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    if (!res.ok) return {};

    const html = await res.text();
    const $ = cheerio.load(html);

    let venue = null;
    let city = null;

    const venueBlock = $(".venue-container .venue-wrapper .list-item");

    if (venueBlock.length > 0) {
      venue = $(venueBlock[0]).text().trim() || null;

      const address = $(venueBlock[1]).text().trim() || "";
      if (address.includes(",")) {
        city = address.split(",").pop().trim();
      }
    }

    // --- scrape related events too ----
    const related = [];
    $(".related-events-content li").each((_, el) => {
      const r = $(el);

      const artist = r.find(".title").text().trim() || null;
      const date = normalizeDate(r.find(".date").text().trim());
      const venueText = r.find(".subtitle").text().trim() || null;

      let relatedUrl = r.find("a.event-card-link").attr("href") || null;
      if (relatedUrl?.startsWith("/")) {
        relatedUrl = `https://www.songkick.com${relatedUrl}`;
      }

      // Extract city from "Venue, City"
      let relatedVenue = null;
      let relatedCity = null;
      if (venueText?.includes(",")) {
        const parts = venueText.split(",");
        relatedVenue = parts[0].trim();
        relatedCity = parts[1].trim();
      }

      // image
      let img = r.find("img.related-event-image").attr("src") || null;
      if (img?.startsWith("//")) img = `https:${img}`;

      if (artist && relatedUrl) {
        related.push({
          source: "Songkick",
          artist,
          venue: relatedVenue,
          city: relatedCity,
          date,
          url: relatedUrl,
          image: img
        });
      }
    });

    return { venue, city, related };
  } catch {
    return {};
  }
}

// Scrape one metro-area page
async function scrapeMetroArea(url) {
  const results = [];

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" }
  });
  if (!res.ok) return results;

  const html = await res.text();
  const $ = cheerio.load(html);

  const events = $("li.event-listings-element");

  for (const el of events) {
    const element = $(el);

    const artist = element.find(".artists strong").first().text().trim();
    if (!artist) continue;

    const rawDate = element.find("time").attr("datetime")?.split("T")[0] || null;
    const date = normalizeDate(rawDate);

    const venue = element.find(".venue-link").text().trim() || null;
    let city = element.find(".city-name").text().trim() || null;

    let url = element.find("a.event-link").attr("href") || null;
    if (url?.startsWith("/")) url = `https://www.songkick.com${url}`;

    let image =
      element.find("img.artist-profile-image").attr("data-src") ||
      element.find("img.artist-profile-image").attr("src") ||
      null;

    if (image?.startsWith("//")) image = `https:${image}`;
    if (image?.includes("default-artist")) image = null;

    // Fetch event page for missing venue/city + related
    const extra = await scrapeEventPage(url);

    const finalVenue = venue || extra.venue || null;
    const finalCity = city || extra.city || null;

    results.push({
      source: "Songkick",
      artist,
      venue: finalVenue,
      city: finalCity,
      date,
      url,
      image
    });

    // Add related events too
    if (extra.related?.length) {
      results.push(...extra.related);
    }
  }

  return results;
}

// Remove duplicates
function dedupe(events) {
  const seen = new Set();
  return events.filter((e) => {
    const key = `${e.artist}|${e.date}|${e.venue}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function GET() {
  try {
    let allEvents = [];

    for (const url of CITY_URLS) {
      const cityEvents = await scrapeMetroArea(url);
      allEvents.push(...cityEvents);
    }

    const unique = dedupe(allEvents);

    // Sort by date
    unique.sort((a, b) => new Date(a.date) - new Date(b.date));

    return new Response(JSON.stringify(unique), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
}
