import { notFound } from "next/navigation";
import { getEventById } from "@/lib/admin-queries";
import { getAllSeries } from "@/lib/queries";
import { EventForm } from "@/components/admin/EventForm";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const eventId = Number(id);
  if (Number.isNaN(eventId)) notFound();

  const [event, series] = await Promise.all([getEventById(eventId), getAllSeries()]);
  if (!event) notFound();

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Edit event</h2>
      <EventForm
        mode="edit"
        series={series.map((s) => ({ id: s.id, name: s.name }))}
        values={{
          id: event.id,
          seriesId: event.seriesId,
          name: event.name,
          startsAt: event.startsAt,
          endsAt: event.endsAt,
          location: event.location,
          circuit: event.circuit,
          country: event.country,
          round: event.round,
          status: event.status,
          sourceUrl: event.sourceUrl,
        }}
      />
    </div>
  );
}
