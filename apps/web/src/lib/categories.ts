export const CATEGORY_LABELS: Record<string, string> = {
  "open-wheel": "Open-Wheel",
  sportscar: "Sportscar",
  endurance: "Endurance",
  "stock-car": "Stock Car",
  touring: "Touring",
  gt: "GT",
  rally: "Rally",
  other: "Other",
};

export const CATEGORY_ORDER = [
  "open-wheel",
  "sportscar",
  "endurance",
  "gt",
  "stock-car",
  "touring",
  "rally",
  "other",
];

export function categoryLabel(c: string): string {
  return CATEGORY_LABELS[c] ?? c;
}
