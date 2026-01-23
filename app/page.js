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
  Pin, 
  MapPinned,
  Ghost,
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

import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

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
        fixed bottom-15 right-1 sm:bottom-6 sm:right-6 z-50
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
/* Loading messages */
function LoadingMessages() {
  const messages = [
    "Fetching events…",
    "Summoning metal gods…",
    "Tuning guitars…",
    "Waking up the crowd…",
    "Checking mosh pit safety…",
    "Turning it up to 11…"
  ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return <p className="text-sm mt-2 loading-msg">{messages[index]}</p>;
}
/* Mobile filters button */
function MobileFiltersButton({ onOpen }) {
  return (
    <button
      onClick={onOpen}
      className="
        sm:hidden fixed bottom-3 right-1 sm:bottom-6 sm:right-6 z-50
        h-8 w-8 rounded-full
        bg-secondary text-secondary-foreground shadow-lg
        flex items-center justify-center
        transition-all duration-500
      "
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 4h18M3 12h18M3 20h18"
        />
      </svg>
    </button>
  );
}

export default function Home() {
  const [events, setEvents] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);

  /* Filters */
  const [sortType, setSortType] = useState("");
  const [filterSource, setFilterSource] = useState("all");
  const [filterCity, setFilterCity] = useState("all");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const titleLocation =
  filterCity !== "all" ? cleanCity(filterCity) : "Sweden";

  const [favorites, setFavorites] = useState([]);

  /* Load favorites from localStorage */
  useEffect(() => {
    const stored = localStorage.getItem("favorites");
    if (stored) setFavorites(JSON.parse(stored));
  }, []);

  /* Save favorites to localStorage */
  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  /* Toggle favorite */
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

  /* After page reload: Favorites appear first fix */
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

                <DialogDescription className="pt-2 leading-relaxed text-center">
                  <img
                    src="/logo-w.svg"
                    className="h-10 w-[220] mt-5 mb-2 dark:hidden m-auto"
                  />
                  <img
                    src="/logo.svg"
                    className="h-10 w-[220] mt-5 mb-2 hidden dark:block m-auto"
                  />
                  <span>
                    Metalmeup is a simple project built to track{" "}
                    <strong>Metal</strong> and <strong>Rock</strong> shows and
                    festivals happening across <strong>Sweden</strong>.
                    It collects upcoming events from{" "}
                    <strong>Ticketmaster</strong> and <strong>Songkick</strong>{" "}
                    and displays everything in one interface, with quick links
                    to explore more details about each event.
                    <br />
                    <br />
                    This tool is <strong>free to use</strong> and open to
                    everyone. You can also view the full project source code or
                    contribute on GitHub.
                  </span>
                </DialogDescription>

                <Button
                  asChild
                  variant="outline"
                  className="border-border text-foreground mt-4 w-50 mx-auto"
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

        <div className="relative text-center py-6 sm:py-16 px-4 z-[2] fade-up">
          <h1
            className="
              text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-5xl
              font-bold mb-2 mt-5 sm:mt-10 max-w-xl mx-auto leading-none 
            "
          >
            Check the latest Metal & Rock events around{" "}
            <strong className="accent-text title-place">{titleLocation}</strong>.
          </h1>

          <div className={`header-info ${loading ? "hidden" : ""}`}>
            <p className="text-l lg:text-2xl opacity-80 max-w-2xl mx-auto leading-relaxed">
              <span className="font-bold text-xl lg:text-2xl accent-text">{filteredEvents.length}</span> live{" "}
              {filteredEvents.length === 1 ? "event" : "events"} happening now
            </p>

            {lastUpdated && (
              <div className="inline-block px-3 py-1 mt-6 rounded-full bg-secondary text-secondary-foreground text-xs fade-in delay-1000 ">
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
      </div>

      {/* MOBILE FILTERS */}
      <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <SheetContent side="bottom" className="p-6 sm:hidden">
          <SheetHeader className="p-0">
            <SheetTitle>Filters</SheetTitle>
            <SheetDescription>
              Select filters to refine the results.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-4">
            {/* Sort Filter */}
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

            {/* Source Filter */}
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

            {/* City Filter */}
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

            {/* Clear Filters */}
            {filtersAreActive && (
              <Button
                variant="outline"
                className="w-auto mx-auto flex mt-4 font-normal border-none text-xs"
                onClick={() => {
                  clearFilters();
                  setMobileFiltersOpen(false);
                }}
              >
                Clear Filters <Trash2 className="w-2 h-2" />
              </Button>
            )}

            {/* Apply button — closes sheet */}
            <Button
              className="w-full"
              onClick={() => setMobileFiltersOpen(false)}
            >
              Apply & Close
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* FILTERS */}
      <div className={`sm:sticky sm:top-0 z-30 sm:bg-background/80 sm:backdrop-blur-md sm:border-border py-4 fade-in hidden sm:block card-filters ${loading ? "hidden sm:!hidden" : ""}`}>
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
              
              size="icon"
              onClick={clearFilters}
              className="border-none bg-secondary/80 cursor-pointer p-5"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-10 opacity-80 mt-5">
          {/* <Loader2 className="w-8 h-8 animate-spin mb-2" /> */}
           <img
            src="/icon.png"
            className="w-[120] animate-pulse"
          />
          <LoadingMessages />
        </div>
      )}

      {/* EVENTS GRID */}
      {!loading && filteredEvents.length === 0 ? (
        <div className="text-center mt-10 py-20 opacity-80 text-m">
          <Ghost className="w-10 h-10 opacity-50 mx-auto mb-3" />
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
                className="bg-card text-card-foreground shadow-xl flex flex-col relative fade-up"
              >
                <button
                  onClick={() => toggleFavorite(e.url)}
                  className="
                    absolute top-2 right-2 z-20 p-1
                    cursor-pointer rounded-full
                    transition-transform 
                  "
                >
                  <Pin
                    className={`w-4 h-4 ${
                      favorites.includes(e.url)
                        ? "text-primary scale-115 opacity-80"
                        : "text-gray-400 text-gray-400 opacity-30 hover:opacity-80 hover:scale-115"
                    }`}
                  />
                </button>

                <CardContent className="flex flex-col flex-grow">
                  {e.image ? (
                    <img
                      src={e.image}
                      alt={e.artist}
                      className="w-24 h-24 object-cover rounded-full mx-auto mt-2 border-none flex event-icon"
                      onError={(e) => {
                        e.target.style.display = "none"; // hide broken img
                      }}
                    />
                  ) : (
                    <div className="w-24 h-24 bg-muted rounded-full mx-auto mt-2" />
                  )}

                  <div className="flex flex-col flex-grow ">
                    <h3 className="mt-2 mb-2 text-xl font-bold leading-tight text-center" >
                      {e.artist || e.title}
                    </h3>

                    {/* Info Section */}
                    <div className="mt-4 bg-secondary/70 rounded-xl overflow-hidden">

                      {/* DATE */}
                      <div className="flex items-center gap-3 px-3 py-2 border-b border-border/30 text-sm">
                        <CalendarDays className="w-5 h-5 opacity-80" />
                        <span className="font-medium">
                          {formatDateSE(e.date)}
                        </span>
                      </div>

                      {/* CITY */}
                      <div className="flex items-center gap-3 px-3 py-2 border-b border-border/30 text-sm">
                        <MapPin className="w-5 h-5 opacity-80" />
                        <span className="font-medium">
                          {cleanCity(e.city)}, Sweden
                        </span>
                      </div>

                      {/* VENUE */}
                      {e.venue && (
                        <div className="flex items-center gap-3 px-3 py-2 text-sm">
                          <MapPinned className="w-5 h-5 opacity-80 w[50]" />
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              `${e.venue} ${cleanCity(e.city)} Sweden`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium underline"
                          >
                            {e.venue}
                          </a>
                        </div>
                      )}

                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                    asChild
                    className="bg-primary text-primary-foreground relative flex-1"
                  >
                    <a href={e.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-full relative">
                      <span className="pointer-events-none">View Event</span>

                      <img
                        src={
                          e.source === "Ticketmaster"
                            ? "/tm-icon.png"
                            : "/sk-icon.png"
                        }
                        alt={`${e.source} logo`}
                        className="
                          absolute right-2
                          h-5 w-auto
                          opacity-90
                        "
                      />
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
      <MobileFiltersButton onOpen={() => setMobileFiltersOpen(true)} />
    </div>
  );
}
