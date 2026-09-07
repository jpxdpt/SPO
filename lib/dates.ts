/** Fuso oficial de apresentação. Guardar sempre UTC na BD. */
export const APP_TIMEZONE = process.env.APP_TIMEZONE || "Europe/Lisbon";

export function formatLisbon(date: Date | string, pattern = "dd/MM/yyyy HH:mm"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  // Implementação sem dependência extra: Intl com timeZone.
  const fmt = new Intl.DateTimeFormat("pt-PT", {
    timeZone: APP_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  void pattern;
  return fmt.format(d);
}

export function formatDateLisbon(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-PT", {
    timeZone: APP_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}
