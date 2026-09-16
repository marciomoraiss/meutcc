export const WEEKLY_LIMIT = 8;
export const SCHEDULE_START = "2026-09-01";
export const SCHEDULE_END = "2026-11-30";
export const SCHEDULE_TIME_ZONE = "America/Sao_Paulo";
export type OrientationSlot = { startsAt: string; weekStart: string; label: string };

export function weekStartFor(value: string | Date): string {
  const date = new Date(value);
  const localDate = new Intl.DateTimeFormat("en-CA", { timeZone: SCHEDULE_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  const day = new Date(localDate + "T12:00:00Z");
  day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
  return day.toISOString().slice(0, 10);
}

export function orientationSlots(): OrientationSlot[] {
  const slots: OrientationSlot[] = [];
  for (let day = new Date(SCHEDULE_START + "T12:00:00Z"); day.toISOString().slice(0, 10) <= SCHEDULE_END; day.setUTCDate(day.getUTCDate() + 1)) {
    const weekday = day.getUTCDay();
    if (weekday !== 2 && weekday !== 5) continue;
    const date = day.toISOString().slice(0, 10);
    const hour = weekday === 2 ? "18" : "11";
    for (const minute of ["00", "15", "30", "45"]) {
      const startsAt = date + "T" + hour + ":" + minute + ":00-03:00";
      slots.push({ startsAt, weekStart: weekStartFor(startsAt), label: formatSlot(startsAt) });
    }
  }
  return slots;
}

export function formatSlot(value: string): string {
  return new Date(value).toLocaleString("pt-BR", { timeZone: SCHEDULE_TIME_ZONE, weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function isValidOrientationSlot(value: string, now = Date.now()): boolean {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) && timestamp > now && orientationSlots().some(slot => new Date(slot.startsAt).getTime() === timestamp);
}
