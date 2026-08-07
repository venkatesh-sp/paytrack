import { addMonths, format, parseISO } from "date-fns";

export function computeEndDate(startDate: string, tenureMonths: number): string {
  const start = parseISO(startDate);
  const end = addMonths(start, tenureMonths);
  return format(end, "yyyy-MM-dd");
}

export function billingPeriodOf(date: Date): string {
  return format(date, "yyyy-MM");
}

export function dueDateFor(year: number, monthIndex0: number, day: number): string {
  // Clamp to the last valid day of the month (e.g. emiDay=31 in February).
  const lastDay = new Date(year, monthIndex0 + 1, 0).getDate();
  const clampedDay = Math.min(day, lastDay);
  return format(new Date(year, monthIndex0, clampedDay), "yyyy-MM-dd");
}

export function currentBillingPeriod(): string {
  return billingPeriodOf(new Date());
}

export function parseBillingPeriod(period: string): {
  year: number;
  monthIndex0: number;
} {
  const [year, month] = period.split("-").map(Number);
  return { year, monthIndex0: month - 1 };
}
