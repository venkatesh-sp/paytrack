import { addMonths, format, parseISO } from "date-fns";

export function computeEndDate(startDate: string, tenureMonths: number): string {
  const start = parseISO(startDate);
  // Tenure is inclusive of the start month, so the last due date is
  // (tenureMonths - 1) months after the start (e.g. a 3-month tenure
  // starting in September has its last due date in November, not December).
  const end = addMonths(start, tenureMonths - 1);
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

export function todayDateString(asOf: Date = new Date()): string {
  return format(asOf, "yyyy-MM-dd");
}

export function parseBillingPeriod(period: string): {
  year: number;
  monthIndex0: number;
} {
  const [year, month] = period.split("-").map(Number);
  return { year, monthIndex0: month - 1 };
}

/**
 * Every billing period between startDate and endDate (inclusive), one per
 * EMI due date — the full schedule for a tracking item's tenure.
 */
export function listBillingPeriods(
  startDate: string,
  endDate: string,
  emiDay: number,
): { billingPeriod: string; dueDate: string }[] {
  const periods: { billingPeriod: string; dueDate: string }[] = [];

  let cursor = parseISO(startDate);
  const end = parseISO(endDate);

  while (cursor <= end) {
    const billingPeriod = billingPeriodOf(cursor);
    const dueDate = dueDateFor(cursor.getFullYear(), cursor.getMonth(), emiDay);

    if (dueDate >= startDate && dueDate <= endDate) {
      periods.push({ billingPeriod, dueDate });
    }

    cursor = addMonths(cursor, 1);
  }

  return periods;
}

/**
 * Billing periods between startDate and endDate whose EMI due date has
 * already passed as of `asOf` (strictly before it) — i.e. months that
 * should already have a payment recorded when backdating a tracking item.
 */
export function listElapsedBillingPeriods(
  startDate: string,
  endDate: string,
  emiDay: number,
  asOf: Date = new Date(),
): { billingPeriod: string; dueDate: string }[] {
  const asOfDate = todayDateString(asOf);
  return listBillingPeriods(startDate, endDate, emiDay).filter(
    (period) => period.dueDate < asOfDate,
  );
}
