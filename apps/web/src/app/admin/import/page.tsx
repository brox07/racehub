import { getAllSeries } from "@/lib/queries";
import { ImportForm } from "@/components/admin/ImportForm";

export default async function ImportPage() {
  const series = await getAllSeries();
  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold">Import an .ics file</h2>
      <p className="mb-4 text-sm text-[var(--color-muted)]">
        Upload a calendar file you&apos;ve sourced and assign it to a series. Each VEVENT becomes an
        event.
      </p>
      <ImportForm series={series.map((s) => ({ id: s.id, name: s.name }))} />
    </div>
  );
}
