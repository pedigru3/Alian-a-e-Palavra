const MS_PER_MINUTE = 60_000;
const DEFAULT_TIMEZONE = 'America/Sao_Paulo';
const DEFAULT_TIMEZONE_OFFSET_MINUTES = -180; // America/Sao_Paulo (UTC-03:00)

function resolveConfiguredTimeZone(): string {
  return (
    process.env.NEXT_PUBLIC_APP_TIMEZONE ??
    process.env.APP_TIMEZONE ??
    DEFAULT_TIMEZONE
  );
}

const CONFIGURED_TIMEZONE = resolveConfiguredTimeZone();

export function getAppTimeZone(): string {
  return CONFIGURED_TIMEZONE;
}

function resolveConfiguredOffset(): number {
  const rawOffset =
    process.env.NEXT_PUBLIC_APP_TIMEZONE_OFFSET_MINUTES ?? process.env.APP_TIMEZONE_OFFSET_MINUTES;

  if (!rawOffset) {
    return DEFAULT_TIMEZONE_OFFSET_MINUTES;
  }

  const parsed = Number(rawOffset);
  return Number.isFinite(parsed) ? parsed : DEFAULT_TIMEZONE_OFFSET_MINUTES;
}

const CONFIGURED_OFFSET_MINUTES = resolveConfiguredOffset();

function normalizeOffset(offsetMinutes?: number): number {
  if (typeof offsetMinutes === 'number' && Number.isFinite(offsetMinutes)) {
    return offsetMinutes;
  }
  return CONFIGURED_OFFSET_MINUTES;
}

function toTargetMillis(date: Date, offsetMinutes: number): number {
  const utcMillis = date.getTime() + date.getTimezoneOffset() * MS_PER_MINUTE;
  return utcMillis + offsetMinutes * MS_PER_MINUTE;
}

function fromTargetMillis(targetMillis: number, offsetMinutes: number): Date {
  return new Date(targetMillis - offsetMinutes * MS_PER_MINUTE);
}

export function getLocalizedWeekBoundaries(date: Date = new Date(), offsetMinutes?: number) {
  const offset = normalizeOffset(offsetMinutes);
  const targetMillis = toTargetMillis(date, offset);
  const targetDate = new Date(targetMillis);

  const dayOfWeek = targetDate.getUTCDay();
  const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;

  const weekStartTarget = new Date(targetDate);
  weekStartTarget.setUTCDate(targetDate.getUTCDate() + diffToMonday);
  weekStartTarget.setUTCHours(0, 0, 0, 0);

  const weekEndTarget = new Date(weekStartTarget);
  weekEndTarget.setUTCDate(weekStartTarget.getUTCDate() + 6);
  weekEndTarget.setUTCHours(23, 59, 59, 999);

  return {
    weekStart: fromTargetMillis(weekStartTarget.getTime(), offset),
    weekEnd: fromTargetMillis(weekEndTarget.getTime(), offset),
  };
}

export function getLocalizedTodayIndex(date: Date = new Date(), offsetMinutes?: number) {
  const offset = normalizeOffset(offsetMinutes);
  const targetMillis = toTargetMillis(date, offset);
  const targetDate = new Date(targetMillis);
  return (targetDate.getUTCDay() + 6) % 7;
}

export function getLocalizedDayStart(date: Date = new Date(), offsetMinutes?: number): Date {
  const offset = normalizeOffset(offsetMinutes);
  const targetMillis = toTargetMillis(date, offset);
  const targetDate = new Date(targetMillis);
  targetDate.setUTCHours(0, 0, 0, 0);
  return fromTargetMillis(targetDate.getTime(), offset);
}

export function isSameLocalizedDay(
  dateA: Date,
  dateB: Date,
  offsetMinutes?: number,
): boolean {
  return (
    getLocalizedDayStart(dateA, offsetMinutes).getTime() ===
    getLocalizedDayStart(dateB, offsetMinutes).getTime()
  );
}

