import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  primaryKey,
  uniqueIndex,
  index,
  pgEnum,
  serial,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* ----------------------------------------------------------------------------
 * Enums
 * ------------------------------------------------------------------------- */

export const seriesCategory = pgEnum("series_category", [
  "open-wheel",
  "sportscar",
  "endurance",
  "stock-car",
  "touring",
  "gt",
  "rally",
  "other",
]);

export const eventStatus = pgEnum("event_status", [
  "scheduled",
  "in-progress",
  "completed",
  "cancelled",
  "postponed",
]);

export const sessionKind = pgEnum("session_kind", [
  "practice",
  "qualifying",
  "sprint",
  "race",
  "warmup",
  "other",
]);

/* ----------------------------------------------------------------------------
 * Racing domain
 * ------------------------------------------------------------------------- */

export const series = pgTable(
  "series",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    shortName: text("short_name").notNull(),
    category: seriesCategory("category").notNull().default("other"),
    region: text("region"),
    // Hex colour used for UI chips / accents.
    color: text("color").notNull().default("#6b7280"),
    logoUrl: text("logo_url"),
    websiteUrl: text("website_url"),
    newsUrl: text("news_url"),
    // RSS/Atom feed for the AI news pipeline (optional).
    feedUrl: text("feed_url"),
    // ICS calendar feed used by the ingestion worker (optional).
    icsUrl: text("ics_url"),
    // For sub-championships (e.g. NASCAR Cup under NASCAR).
    parentId: integer("parent_id"),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(100),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("series_slug_idx").on(t.slug)],
);

export const events = pgTable(
  "events",
  {
    id: serial("id").primaryKey(),
    seriesId: integer("series_id")
      .notNull()
      .references(() => series.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    round: integer("round"),
    circuit: text("circuit"),
    location: text("location"),
    country: text("country"),
    // ISO country code for flag rendering.
    countryCode: text("country_code"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    status: eventStatus("status").notNull().default("scheduled"),
    // Stable identifier from the source calendar (ICS UID) for idempotent upserts.
    sourceUid: text("source_uid"),
    sourceUrl: text("source_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("events_series_source_idx").on(t.seriesId, t.sourceUid),
    index("events_starts_at_idx").on(t.startsAt),
    index("events_series_idx").on(t.seriesId),
  ],
);

// Individual sessions within an event weekend (FP1, Qualifying, Race, ...).
export const eventSessions = pgTable(
  "event_sessions",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    kind: sessionKind("kind").notNull().default("other"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    sourceUid: text("source_uid"),
  },
  (t) => [
    uniqueIndex("event_sessions_source_idx").on(t.eventId, t.sourceUid),
    index("event_sessions_event_idx").on(t.eventId),
  ],
);

// Race results for a completed event (per-series landing page).
export const results = pgTable(
  "results",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    position: integer("position"),
    classification: text("classification"), // e.g. "DNF", "DNS", overall vs class
    number: text("number"),
    driver: text("driver").notNull(),
    team: text("team"),
    carClass: text("car_class"),
    gap: text("gap"),
    laps: integer("laps"),
    points: integer("points"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("results_event_idx").on(t.eventId)],
);

/* ----------------------------------------------------------------------------
 * News (AI-curated; pipeline wired later via OpenRouter)
 * ------------------------------------------------------------------------- */

export const newsItems = pgTable(
  "news_items",
  {
    id: serial("id").primaryKey(),
    seriesId: integer("series_id").references(() => series.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    url: text("url").notNull(),
    source: text("source"),
    summary: text("summary"),
    // Raw excerpt the summary was generated from (kept for re-summarising).
    excerpt: text("excerpt"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    // Hash of url/title used to dedupe across ingestion runs.
    dedupeHash: text("dedupe_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("news_dedupe_idx").on(t.dedupeHash),
    index("news_published_idx").on(t.publishedAt),
  ],
);

/* ----------------------------------------------------------------------------
 * Auth.js (Drizzle adapter) — users / accounts / sessions / verification
 * ------------------------------------------------------------------------- */

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  image: text("image"),
  // For credentials provider (bcrypt hash). Null for OAuth-only users.
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

// Per-user customisations (selected series, filters, timezone, theme).
export const userPreferences = pgTable("user_preferences", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  // Array of series ids the user follows; null = follow all.
  followedSeriesIds: jsonb("followed_series_ids").$type<number[] | null>(),
  // Arbitrary filter state (categories, regions, sort, view mode).
  filters: jsonb("filters").$type<Record<string, unknown>>().default({}),
  timezone: text("timezone").notNull().default("UTC"),
  theme: text("theme").notNull().default("system"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ----------------------------------------------------------------------------
 * Relations
 * ------------------------------------------------------------------------- */

export const seriesRelations = relations(series, ({ many, one }) => ({
  events: many(events),
  parent: one(series, {
    fields: [series.parentId],
    references: [series.id],
    relationName: "series_parent",
  }),
  children: many(series, { relationName: "series_parent" }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  series: one(series, { fields: [events.seriesId], references: [series.id] }),
  sessions: many(eventSessions),
  results: many(results),
}));

export const eventSessionsRelations = relations(eventSessions, ({ one }) => ({
  event: one(events, { fields: [eventSessions.eventId], references: [events.id] }),
}));

export const resultsRelations = relations(results, ({ one }) => ({
  event: one(events, { fields: [results.eventId], references: [events.id] }),
}));
