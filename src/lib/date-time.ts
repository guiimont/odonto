const calendarDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const clockPattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

function timeZoneOffset(timestamp: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(timestamp);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const localAsUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  );
  return localAsUtc - timestamp.getTime();
}

export function localDateTimeToIso(calendarDate: string, clock: string, timeZone: string) {
  if (!calendarDatePattern.test(calendarDate) || !clockPattern.test(clock)) throw new Error("invalid_local_datetime");
  const guess = new Date(`${calendarDate}T${clock}:00.000Z`);
  const firstCandidate = new Date(guess.getTime() - timeZoneOffset(guess, timeZone));
  const corrected = new Date(guess.getTime() - timeZoneOffset(firstCandidate, timeZone));
  return corrected.toISOString();
}

export function todayInTimeZone(timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function normalizeCalendarDate(value: string | undefined, fallback: string) {
  if (!value || !calendarDatePattern.test(value)) return fallback;
  const parsed = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? fallback : value;
}

export function addCalendarDays(calendarDate: string, amount: number) {
  const parsed = new Date(`${calendarDate}T12:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() + amount);
  return parsed.toISOString().slice(0, 10);
}

export function clockInTimeZone(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}
