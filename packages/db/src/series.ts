/**
 * Curated registry of racing series. This is the source of truth seeded into
 * the `series` table. Add `icsUrl` / `feedUrl` here as you confirm real feeds;
 * the ingestion worker picks up any series that has an `icsUrl`.
 *
 * Note on "ALMS": the American Le Mans Series merged into IMSA in 2014, so the
 * entry below is the still-running **Asian Le Mans Series**. Adjust if you meant
 * the historical ALMS archive.
 */
export type SeriesCategory =
  | "open-wheel"
  | "sportscar"
  | "endurance"
  | "stock-car"
  | "touring"
  | "gt"
  | "rally"
  | "other";

export interface SeriesSeed {
  slug: string;
  name: string;
  shortName: string;
  category: SeriesCategory;
  region: string;
  color: string;
  websiteUrl: string;
  newsUrl?: string;
  feedUrl?: string;
  icsUrl?: string;
  parentSlug?: string;
  sortOrder?: number;
}

export const SERIES_SEED: SeriesSeed[] = [
  // ---- Open-wheel ----
  {
    slug: "f1",
    name: "Formula 1",
    shortName: "F1",
    category: "open-wheel",
    region: "World",
    color: "#e10600",
    websiteUrl: "https://www.formula1.com",
    newsUrl: "https://www.formula1.com/en/latest/all.html",
    // Community-maintained feed (motorsportcalendars.com). Race only — _gp.
    // Session-level variants exist, e.g. f1-calendar_p1_p2_p3_qualifying_sprint_gp.ics
    icsUrl: "https://files-f1.motorsportcalendars.com/f1-calendar_gp.ics",
    sortOrder: 1,
  },
  {
    slug: "f2",
    name: "FIA Formula 2",
    shortName: "F2",
    category: "open-wheel",
    region: "World",
    color: "#0090d0",
    websiteUrl: "https://www.fiaformula2.com",
    newsUrl: "https://www.fiaformula2.com/Latest",
    // Sprint + feature races (motorsportcalendars.com).
    icsUrl: "https://files-f2.motorsportcalendars.com/f2-calendar_sprint_feature.ics",
    sortOrder: 2,
  },
  {
    slug: "f3",
    name: "FIA Formula 3",
    shortName: "F3",
    category: "open-wheel",
    region: "World",
    color: "#e91e63",
    websiteUrl: "https://www.fiaformula3.com",
    newsUrl: "https://www.fiaformula3.com/Latest",
    // Sprint + feature races (motorsportcalendars.com).
    icsUrl: "https://files-f3.motorsportcalendars.com/f3-calendar_sprint_feature.ics",
    sortOrder: 3,
  },
  {
    slug: "indycar",
    name: "NTT IndyCar Series",
    shortName: "IndyCar",
    category: "open-wheel",
    region: "North America",
    color: "#003da5",
    websiteUrl: "https://www.indycar.com",
    newsUrl: "https://www.indycar.com/News",
    // Race only (motorsportcalendars.com).
    icsUrl: "https://files-indycar.motorsportcalendars.com/indycar-calendar_race.ics",
    sortOrder: 4,
  },
  {
    slug: "indy-nxt",
    name: "Indy NXT by Firestone",
    shortName: "Indy NXT",
    category: "open-wheel",
    region: "North America",
    color: "#5b2a86",
    websiteUrl: "https://www.indycar.com/indynxt",
    sortOrder: 5,
  },
  {
    slug: "formula-e",
    name: "ABB FIA Formula E",
    shortName: "Formula E",
    category: "open-wheel",
    region: "World",
    color: "#00b1eb",
    websiteUrl: "https://www.fiaformulae.com",
    newsUrl: "https://www.fiaformulae.com/en/news",
    // Race only (motorsportcalendars.com, key "fe").
    icsUrl: "https://files-fe.motorsportcalendars.com/fe-calendar_race.ics",
    sortOrder: 6,
  },
  {
    slug: "super-formula",
    name: "Super Formula",
    shortName: "SF",
    category: "open-wheel",
    region: "Japan",
    color: "#e60012",
    websiteUrl: "https://superformula.net/sf3/en",
    sortOrder: 7,
  },

  // ---- Stock car (NASCAR national series) ----
  {
    slug: "nascar-cup",
    name: "NASCAR Cup Series",
    shortName: "Cup",
    category: "stock-car",
    region: "North America",
    color: "#ffd100",
    websiteUrl: "https://www.nascar.com",
    newsUrl: "https://www.nascar.com/news-media/",
    sortOrder: 10,
  },
  {
    slug: "nascar-xfinity",
    name: "NASCAR Xfinity Series",
    shortName: "Xfinity",
    category: "stock-car",
    region: "North America",
    color: "#00a94f",
    websiteUrl: "https://www.nascar.com/xfinity/",
    sortOrder: 11,
  },
  {
    slug: "nascar-trucks",
    name: "NASCAR Craftsman Truck Series",
    shortName: "Trucks",
    category: "stock-car",
    region: "North America",
    color: "#ff6a00",
    websiteUrl: "https://www.nascar.com/trucks/",
    sortOrder: 12,
  },
  {
    slug: "supercars",
    name: "Repco Supercars Championship",
    shortName: "Supercars",
    category: "touring",
    region: "Australia",
    color: "#00843d",
    websiteUrl: "https://www.supercars.com",
    newsUrl: "https://www.supercars.com/news/",
    sortOrder: 13,
  },

  // ---- Sportscar / Endurance / GT ----
  {
    slug: "wec",
    name: "FIA World Endurance Championship",
    shortName: "WEC",
    category: "endurance",
    region: "World",
    color: "#1a1a2e",
    websiteUrl: "https://www.fiawec.com",
    newsUrl: "https://www.fiawec.com/en/news",
    // Community GitHub Pages feed (Bmorganqwe98/racing-2026-calendar), race only.
    icsUrl: "https://bmorganqwe98.github.io/racing-2026-calendar/wec.ics",
    sortOrder: 20,
  },
  {
    slug: "imsa",
    name: "IMSA WeatherTech SportsCar Championship",
    shortName: "IMSA",
    category: "sportscar",
    region: "North America",
    color: "#d6001c",
    websiteUrl: "https://www.imsa.com",
    newsUrl: "https://www.imsa.com/news/",
    // Community GitHub Pages feed (Bmorganqwe98/racing-2026-calendar).
    icsUrl: "https://bmorganqwe98.github.io/racing-2026-calendar/imsa.ics",
    sortOrder: 21,
  },
  {
    slug: "imsa-pilot",
    name: "IMSA Michelin Pilot Challenge",
    shortName: "Pilot Challenge",
    category: "gt",
    region: "North America",
    color: "#0072ce",
    websiteUrl: "https://www.imsa.com/michelinpilotchallenge/",
    sortOrder: 22,
  },
  {
    slug: "mx5-cup",
    name: "Mazda MX-5 Cup",
    shortName: "MX-5 Cup",
    category: "sportscar",
    region: "North America",
    color: "#e4002b",
    websiteUrl: "https://www.mazdamotorsports.com/mx-5-cup",
    sortOrder: 23,
  },
  {
    slug: "elms",
    name: "European Le Mans Series",
    shortName: "ELMS",
    category: "endurance",
    region: "Europe",
    color: "#003087",
    websiteUrl: "https://www.europeanlemansseries.com",
    newsUrl: "https://www.europeanlemansseries.com/en/news",
    sortOrder: 24,
  },
  {
    slug: "asian-lms",
    name: "Asian Le Mans Series",
    shortName: "AsLMS",
    category: "endurance",
    region: "Asia",
    color: "#c8102e",
    websiteUrl: "https://www.asianlemansseries.com",
    sortOrder: 25,
  },
  {
    slug: "gt-world-challenge",
    name: "Fanatec GT World Challenge",
    shortName: "GTWC",
    category: "gt",
    region: "World",
    color: "#1d1d1b",
    websiteUrl: "https://www.gt-world-challenge.com",
    newsUrl: "https://www.gt-world-challenge.com/news",
    sortOrder: 26,
  },
  {
    slug: "nls",
    name: "Nürburgring Langstrecken-Serie",
    shortName: "NLS",
    category: "endurance",
    region: "Europe",
    color: "#00633f",
    websiteUrl: "https://www.nuerburgring-langstrecken-serie.de/en/",
    sortOrder: 27,
  },
  {
    slug: "24h-series",
    name: "24H Series",
    shortName: "24H",
    category: "endurance",
    region: "World",
    color: "#0033a0",
    websiteUrl: "https://www.24hseries.com",
    newsUrl: "https://www.24hseries.com/news",
    sortOrder: 28,
  },
  {
    slug: "porsche-supercup",
    name: "Porsche Mobil 1 Supercup",
    shortName: "Supercup",
    category: "gt",
    region: "World",
    color: "#b12029",
    websiteUrl: "https://www.porsche.com/international/motorsportandevents/motorsport/supercup/",
    sortOrder: 29,
  },

  // ---- Touring ----
  {
    slug: "btcc",
    name: "British Touring Car Championship",
    shortName: "BTCC",
    category: "touring",
    region: "United Kingdom",
    color: "#c8102e",
    websiteUrl: "https://www.btcc.net",
    newsUrl: "https://www.btcc.net/news/",
    sortOrder: 40,
  },
  {
    slug: "dtm",
    name: "DTM",
    shortName: "DTM",
    category: "gt",
    region: "Europe",
    color: "#e2001a",
    websiteUrl: "https://www.dtm.com",
    newsUrl: "https://www.dtm.com/en/news",
    sortOrder: 41,
  },

  // ---- Rally ----
  {
    slug: "wrc",
    name: "FIA World Rally Championship",
    shortName: "WRC",
    category: "rally",
    region: "World",
    color: "#0a1e3c",
    websiteUrl: "https://www.wrc.com",
    newsUrl: "https://www.wrc.com/en/news/",
    // Community GitHub Pages feed (Bmorganqwe98/racing-2026-calendar). Stage-level events.
    icsUrl: "https://bmorganqwe98.github.io/racing-2026-calendar/wrc.ics",
    sortOrder: 50,
  },
];
