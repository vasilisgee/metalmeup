import * as cheerio from "cheerio";

export async function GET() {
  try {
    const url =
      "https://www.songkick.com/metro-areas/32252-sweden-stockholm/genre/metal";

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      },
      cache: "no-store"
    });

    if (!res.ok) {
      throw new Error("Failed to fetch Songkick page");
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const events = [];

    $("li.event-listings-element").each((_, el) => {
      const element = $(el);

      // Artist
      const artist =
        element.find(".artists strong").first().text().trim() || null;

      if (!artist) return;

      // Date
      const date =
        element.find("time").attr("datetime")?.split("T")[0] || null;

      // Venue
      const venue =
        element.find(".venue-link").text().trim() || null;

      // City
      const city =
        element.find(".city-name").text().trim() || null;

      // Event URL
      let url =
        element.find("a.event-link").attr("href") || null;

      if (url && url.startsWith("/")) {
        url = `https://www.songkick.com${url}`;
      }

      // Image (lazy-loaded)
      const imgEl = element.find("img.artist-profile-image");

      let image =
        imgEl.attr("data-src") ||
        imgEl.attr("src") ||
        null;

      if (image?.startsWith("//")) {
        image = `https:${image}`;
      }

      // Remove default avatar
      if (image && image.includes("default-artist")) {
        image = null;
      }

      events.push({
        source: "Songkick",
        artist,
        venue,
        city,
        date,
        url,
        image
      });
    });

    return new Response(JSON.stringify(events), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
}
