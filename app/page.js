"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  MapPinHouse,
  CalendarDays,
  CircleHelp,
  Loader2,
  Trash2,
  Github,
  Search,
  ArrowUp,
  ArrowUpDown,
  Server,
  Star, // ⭐ FAVORITE ICON
} from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

/* Swedish date format */
function formatDateSE(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  return d.toLocaleDateString("sv-SE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* Clean city name */
function cleanCity(city) {
  if (!city) return "";
  return city.replace(/,?\s*Sweden/i, "").trim();
}

/* Back to top button */
function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 400);
    }
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <button
      onClick={scrollToTop}
      aria-label="Back to top"
      className={`
        fixed bottom-2 right-1 sm:bottom-6 sm:right-6 z-50
        h-8 w-8 rounded-full
        bg-secondary text-secondary-foreground shadow-lg
        flex items-center justify-center
        transition-all duration-500
        ${visible ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"}
      `}
    >
      <ArrowUp className="w-4 h-4" />
    </button>
  );
}

export default function Home() {
  const [events, setEvents] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [sortType, setSortType] = useState("");
  const [filterSource, setFilterSource] = useState("all");
  const [filterCity, setFilterCity] = useState("all");

  // ⭐ FAVORITES ADDED
  const [favorites, setFavorites] = useState([]);

  // ⭐ Load favorites from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("favorites");
    if (stored) setFavorites(JSON.parse(stored));
  }, []);

  // ⭐ Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  // ⭐ Toggle favorite
  const toggleFavorite = (id) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/events");
        const data = await res.json();
        setEvents(data.events || []);
        setLastUpdated(data.lastUpdated || null);
      } catch (err) {
        console.log("Error loading events:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  /* Build city dropdown */
  const cityList = Array.from(
    new Set(events.map((e) => cleanCity(e.city)).filter(Boolean)),
  ).sort();

  /* Apply filters */
  let filteredEvents = [...events];

  if (filterSource !== "all") {
    filteredEvents = filteredEvents.filter((e) => e.source === filterSource);
  }

  if (filterCity !== "all") {
    filteredEvents = filteredEvents.filter(
      (e) => cleanCity(e.city) === filterCity,
    );
  }

  if (sortType === "name-asc") {
    filteredEvents.sort((a, b) =>
      (a.artist || "").localeCompare(b.artist || ""),
    );
  }
  if (sortType === "name-desc") {
    filteredEvents.sort((a, b) =>
      (b.artist || "").localeCompare(a.artist || ""),
    );
  }

  // ⭐ After page reload: Favorites appear first
  filteredEvents.sort((a, b) => {
    const aFav = favorites.includes(a.url);
    const bFav = favorites.includes(b.url);
    if (aFav === bFav) return 0;
    return aFav ? -1 : 1;
  });

  /* Clear filters */
  const clearFilters = () => {
    setSortType("");
    setFilterSource("all");
    setFilterCity("all");
  };

  const filtersAreActive =
    (sortType && sortType !== "") ||
    (filterSource !== "all" && filterSource !== "") ||
    (filterCity !== "all" && filterCity !== "");

  return (
    <div className="p-5 sm:px-10 pt-0 pb-0 text-foreground bg-background min-h-screen">
      {/* HEADER */}
      <header className="w-full flex items-center justify-between py-4 border-border">
        <div className="flex items-center gap-3">
          <img
            src="/logo-w.svg"
            alt="MetalMeUp Logo"
            className="h-10 w-[150] dark:hidden"
          />
          <img
            src="/logo.svg"
            alt="MetalMeUp Logo"
            className="h-10 w-[150] hidden dark:block"
          />
        </div>

        <div className="flex items-center gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="cursor-pointer">
                <CircleHelp className="!h-5 !w-5" />
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>About this project</DialogTitle>

                <DialogDescription className="pt-2 leading-relaxed">
                  <img
                    src="/logo-w.svg"
                    className="h-10 w-[220] mt-5 mb-2 dark:hidden"
                  />
                  <img
                    src="/logo.svg"
                    className="h-10 w-[220] mt-5 mb-2 hidden dark:block"
                  />
                  <span>
                    Metalmeup is a simple project built to track <strong>Metal</strong> and <strong>Rock</strong> shows and festivals happening across <strong>Sweden</strong>.<br/><br/>
                    It collects upcoming events from <strong>Ticketmaster</strong> and <strong>Songkick</strong> and displays everything in one interface, with quick links to explore more details about each event.<br/><br/>
                    This tool is <strong>free to use</strong> and open to everyone. You can also view the full project source code or contribute on GitHub.
                  </span>
                </DialogDescription>

                <Button
                  asChild
                  variant="outline"
                  className="border-border text-foreground mt-4 w-50"
                >
                  <a
                    href="https://github.com/vasilisgee/metalmeup"
                    target="_blank"
                  >
                    View Project on GitHub
                  </a>
                </Button>
              </DialogHeader>
            </DialogContent>
          </Dialog>

          <ThemeToggle />
        </div>
      </header>

      {/* TITLE SECTION */}
      <div className="app-title relative overflow-hidden rounded-xl sm:mb-10">
        <video
          className="absolute inset-0 w-full h-full object-cover opacity-40 blur-[3px] z-[0]"
          src="/background.mp4"
          autoPlay
          muted
          loop
          playsInline
        />

        <div className="absolute inset-0 z-[1] backdrop-blur-xs bg-white/50 dark:bg-black/0" />

        <div className="relative text-center py-6 sm:py-16 px-4 z-[2]">
          <h1
            className="
              text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-5xl
              font-bold mb-2 mt-5 sm:mt-10 max-w-xl mx-auto leading-none
            "
          >
            Check the latest Metal & Rock events around{" "}
            <strong className="accent-text">Sweden</strong>.
          </h1>

          <p className="text-l lg:text-2xl opacity-80 max-w-2xl mx-auto leading-relaxed">
            <span className="font-bold text-xl lg:text-2xl accent-text">
              {filteredEvents.length}
            </span>{" "}
            live events happening now
          </p>

          {lastUpdated && (
            <div className="inline-block px-3 py-1 mt-6 rounded-full bg-secondary text-secondary-foreground text-xs">
              Last Updated:{" "}
              {new Date(lastUpdated).toLocaleString("sv-SE", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </div>
          )}
        </div>
      </div>

      {/* FILTERS */}
      <div className="sm:sticky sm:top-0 z-30 sm:bg-background/80 sm:backdrop-blur-md sm:border-border py-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-center gap-4 items-center">
          <div className="w-full sm:w-48">
            <Select value={sortType} onValueChange={setSortType}>
              <SelectTrigger className="w-full flex items-center gap-2 cursor-pointer py-4 sm:py-6 font-bold">
                <ArrowUpDown className="w-4 h-4 opacity-60" />
                <SelectValue placeholder="Sort by Name" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="name-asc">Name (A–Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z–A)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-48">
            <Select value={filterSource} onValueChange={setFilterSource}>
              <SelectTrigger className="w-full flex items-center gap-2 cursor-pointer py-4 sm:py-6 font-bold">
                <Server className="w-4 h-4 opacity-60" />
                <SelectValue placeholder="Source" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="Ticketmaster">Ticketmaster</SelectItem>
                <SelectItem value="Songkick">Songkick</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-48">
            <Select value={filterCity} onValueChange={setFilterCity}>
              <SelectTrigger className="w-full flex items-center gap-2 cursor-pointer py-4 sm:py-6 font-bold">
                <MapPin className="w-4 h-4 opacity-60" />
                <SelectValue placeholder="City" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {cityList.map((city, i) => (
                  <SelectItem key={i} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filtersAreActive && (
            <Button
              variant="outline"
              size="icon"
              onClick={clearFilters}
              className="border-border cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          )}
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-10 opacity-80">
          <Loader2 className="w-8 h-8 animate-spin mb-2" />
          <p className="text-sm">Loading events…</p>
        </div>
      )}

      {/* EVENTS GRID */}
      {!loading && filteredEvents.length === 0 ? (
        <div className="text-center mt-10 py-20 opacity-80 text-lg">
          No events found for the selected filters.
        </div>
      ) : (
        !loading && (
          <div
            className="
              grid gap-6
              grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5
              max-w-screen-2xl mx-auto mt-10
            "
          >
            {filteredEvents.map((e, i) => (
              <Card
                key={i}
                className="bg-card text-card-foreground shadow-xl flex flex-col relative"
              >
                <button
                  onClick={() => toggleFavorite(e.url)}
                  className="
                    absolute top-2 right-2 z-20 p-1
                    cursor-pointer rounded-full
                    transition-transform hover:scale-125
                  "
                >
                  <Star
                    className={`w-4 h-4 ${
                      favorites.includes(e.url)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-400 fill-transparent"
                    }`}
                  />
                </button>

                <CardContent className="flex flex-col flex-grow">
                  {e.image ? (
                    <img
                      src={e.image}
                      alt={e.artist}
                      className="w-24 h-24 object-cover rounded-full mx-auto mt-2 bg-gray-200"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-muted rounded-full mx-auto mt-2" />
                  )}

                  <div className="flex flex-col flex-grow text-center">
                    <h3 className="mt-2 mb-2 text-xl font-bold leading-tight">
                      {e.artist || e.title}
                    </h3>

                    {e.date && (
                      <p className="text-m mt-1 flex items-center justify-center">
                        <CalendarDays className="w-4 h-4 mr-1 opacity-70" />
                        {formatDateSE(e.date)}
                      </p>
                    )}

                    {e.city && (
                      <p className="text-m mt-2 flex items-center justify-center">
                        <MapPin className="w-4 h-4 mr-1 opacity-70" />
                        {cleanCity(e.city)}
                      </p>
                    )}

                    {e.venue && e.venue.trim() !== "" && (
                      <p className="text-m mt-2 flex items-center justify-center">
                        <MapPinHouse className="w-4 h-4 mr-1 opacity-70" />
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            `${e.venue} Sweden`,
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          {e.venue}
                        </a>
                      </p>
                    )}

                    <div className="mt-3">
                      <span className="inline-block px-2 py-1 text-xs rounded-full bg-secondary text-secondary-foreground">
                        {e.source}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      asChild
                      className="bg-primary text-primary-foreground flex-1"
                    >
                      <a href={e.url} target="_blank">
                        View Event
                      </a>
                    </Button>

                    <Button
                      asChild
                      variant="outline"
                      className="border-border text-foreground"
                    >
                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(
                          `${e.artist} ${cleanCity(e.city)}`,
                        )}`}
                        target="_blank"
                      >
                        <Search className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}

      {/* FOOTER */}
      <footer className="mt-16 py-6 border-t border-border text-center opacity-80 text-sm">
        <p className="mb-2">
          © {new Date().getFullYear()} Metalmeup — Non-commercial project. Event
          data belongs to their respective providers.
        </p>

        <p className="flex items-center justify-center gap-2 text-xs mt-4">
          View project on
          <a
            href="https://github.com/vasilisgee/metalmeup"
            target="_blank"
            rel="noopener noreferrer"
            className="underline flex items-center gap-1"
          >
            GitHub <Github className="w-4 h-4" />
          </a>
        </p>
      </footer>

      <BackToTopButton />
    </div>
  );
}
