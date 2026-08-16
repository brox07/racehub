export function formatEventDate(date: Date, tz?: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: tz,
  }).format(date);
}

export function formatEventTime(date: Date, tz?: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: tz,
    timeZoneName: "short",
  }).format(date);
}

export function formatRange(start: Date, end: Date | null, tz?: string): string {
  if (!end) return formatEventDate(start, tz);
  const sameDay = start.toDateString() === end.toDateString();
  if (sameDay) return formatEventDate(start, tz);
  const s = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: tz }).format(start);
  const e = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: tz }).format(end);
  return `${s} – ${e}`;
}

/**
 * Link for "more info" about a race: the curated official URL when set,
 * otherwise a web search scoped to the series + event + year.
 */
export function raceInfoUrl(opts: {
  sourceUrl?: string | null;
  seriesName: string;
  eventName: string;
  year: number;
}): string {
  if (opts.sourceUrl) return opts.sourceUrl;
  const q = encodeURIComponent(`${opts.seriesName} ${opts.eventName} ${opts.year}`);
  return `https://www.google.com/search?q=${q}`;
}

export function formatDayTime(date: Date, tz?: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: tz,
  }).format(date);
}

export function countdown(target: Date, now = new Date()): string {
  const ms = target.getTime() - now.getTime();
  if (ms <= 0) return "Live / past";
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  if (days > 0) return `in ${days}d ${hours}h`;
  const mins = Math.floor((ms % 3600000) / 60000);
  return `in ${hours}h ${mins}m`;
}

export function relativeDayLabel(date: Date, now = new Date()): string {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(date) - startOfDay(now)) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays > 1 && diffDays < 7) return `This week`;
  if (diffDays >= 7 && diffDays < 14) return `Next week`;
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
}
