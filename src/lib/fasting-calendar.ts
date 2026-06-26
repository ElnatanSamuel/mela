/**
 * Ethiopian Orthodox Fasting Day Detection
 *
 * This is a simplified approximation based on Western calendar dates.
 * A production version should use the Ethiopian calendar (13 months).
 */

function getEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export interface FastingState {
  isFastingDay: boolean;
  isFastingSeason: boolean;
  seasonName: string | null;
}

export function getFastingState(date: Date = new Date()): FastingState {
  const dayOfWeek = date.getDay();
  const year = date.getFullYear();
  const easter = getEasterDate(year);

  const isWednesday = dayOfWeek === 3;
  const isFriday = dayOfWeek === 5;

  const daysFromEaster = daysBetween(easter, date);

  const isLentenFast = daysFromEaster >= -55 && daysFromEaster < 0;
  const isPostEaster = daysFromEaster >= 0 && daysFromEaster < 50;

  const ninevehStart = new Date(easter);
  ninevehStart.setDate(easter.getDate() - 58);
  const isNinevehFast = daysBetween(ninevehStart, date) >= 0 && daysBetween(ninevehStart, date) < 3;

  const yearStart = new Date(year, 0, 1);
  const dayOfYear = daysBetween(yearStart, date);

  const isAssumptionFast = dayOfYear >= 219 && dayOfYear <= 234;

  const isProphetsFast = dayOfYear >= 329 || dayOfYear < 6;

  const regularWednesdayFriday = (isWednesday || isFriday) && !isPostEaster;

  const isFastingDay = regularWednesdayFriday || isLentenFast || isNinevehFast;
  const isFastingSeason = isFastingDay || isAssumptionFast || isProphetsFast;

  let seasonName: string | null = null;
  if (isLentenFast) seasonName = "Tsome Hudadie (Lenten Fast)";
  else if (isNinevehFast) seasonName = "Tsome Nebiyat (Nineveh Fast)";
  else if (isAssumptionFast) seasonName = "Tsome G.Ah (Assumption Fast)";
  else if (isProphetsFast) seasonName = "Tsome Filseta (Prophets Fast)";
  else if (isWednesday) seasonName = "Wed ዐርብ (Wednesday Fast)";
  else if (isFriday) seasonName = "Fri ዓርብ (Friday Fast)";

  return { isFastingDay, isFastingSeason, seasonName };
}
