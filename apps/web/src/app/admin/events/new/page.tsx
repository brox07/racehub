import { getAllSeries } from "@/lib/queries";
import { EventForm } from "@/components/admin/EventForm";

export default async function NewEventPage() {
  const series = await getAllSeries();
  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">New event</h2>
      <EventForm mode="create" series={series.map((s) => ({ id: s.id, name: s.name }))} />
    </div>
  );
}
