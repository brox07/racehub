export function SeriesChip({ color, label }: { color: string; label: string }) {
  return (
    <span className="chip" style={{ backgroundColor: `${color}22`, color: "#fff", border: `1px solid ${color}55` }}>
      <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
