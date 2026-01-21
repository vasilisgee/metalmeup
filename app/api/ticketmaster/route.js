export async function GET() {
  const apiKey = process.env.TM_KEY;

  // fetch EVERYTHING in Sweden (no filtering here)
  const url =
    `https://app.ticketmaster.com/discovery/v2/events.json?` +
    `apikey=${apiKey}&countryCode=SE&segmentName=Music&size=200`;

  const response = await fetch(url);
  const data = await response.json();

  let events = [];

  if (data._embedded?.events) {

    // Allowed categories (from your file)
    const allowedCategories = [
      "metal",
      "heavy metal",
      "hard rock",
      "rock",
      "alternative rock",
      "classic rock",
      "thrash metal",
      "death metal"
    ];

    // Block these even if Ticketmaster puts them in Music
    const blockedCategories = [
      "pop",
      "pop rock",
      "indie pop",
      "electronic",
      "dance",
      "hip-hop",
      "hip hop",
      "folk",
      "singer-songwriter"
    ];

    // Backup: title-based keywords (only as secondary filter)
    const titleKeywords = [
      "metal",
      "rock",
      "hard rock",
      "heavy",
      "thrash",
      "death",
      "black metal"
    ];

    events = data._embedded.events
      .filter(e => {
        const c = e.classifications?.[0];
        const eventName = e.name?.toLowerCase() || "";

        const genre = c?.genre?.name?.toLowerCase() || "";
        const subGenre = c?.subGenre?.name?.toLowerCase() || "";

        const isAllowed =
          allowedCategories.some(a =>
            genre.includes(a) || subGenre.includes(a)
          );

        const isBlocked =
          blockedCategories.some(b =>
            genre.includes(b) || subGenre.includes(b)
          );

        const titleMatch = titleKeywords.some(k =>
          eventName.includes(k)
        );

        // Final acceptance rules:
        // 1. Exclude blocked categories ALWAYS
        if (isBlocked) return false;

        // 2. Keep if category matches allowed list
        if (isAllowed) return true;

        // 3. Otherwise, keep if title backup match
        if (titleMatch) return true;

        // 4. Reject everything else
        return false;
      })
      .map(e => {
        const venue = e._embedded?.venues?.[0];

        // Best image
        const image16x9 = e.images?.find(img => img.ratio === "16_9");
        const imageFallback = e.images?.[0]?.url || null;

        // Genre label
        const c = e.classifications?.[0];
        const genre =
          c?.subGenre?.name ||
          c?.genre?.name ||
          "Undefined";

        return {
          source: "Ticketmaster",
          artist: e.name,
          venue: venue?.name || "Unknown venue",
          city: venue?.city?.name || "Unknown city",
          date: e.dates?.start?.localDate || "Unknown date",
          url: e.url,
          image: image16x9?.url || imageFallback,
          genre
        };
      });
  }

  return new Response(JSON.stringify(events), {
    headers: { "Content-Type": "application/json" }
  });
}
