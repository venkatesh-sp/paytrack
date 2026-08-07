/**
 * Seeds a dedicated demo account with realistic, multi-month data across every
 * feature (tracking items of every type/status, generated + manual payables,
 * payment history, category variety) so the full app can be previewed end to
 * end. Safe to re-run — it wipes and recreates only the demo user's data.
 *
 * Run with: npm run db:seed
 *
 * Note: generateMonthlyPayables generates payables for ALL active tracking
 * items for a given period at once (that's the real, correct behavior for the
 * app). So every tracking item is created first, then payables are generated
 * in one pass per period, then payments are recorded deliberately — creating
 * and generating per-item in a loop would cross-contaminate earlier items
 * with payables for periods only later items were meant to have.
 */
import { randomUUID } from "crypto";
import { format, subMonths } from "date-fns";
import { eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";

import { db } from "./index";
import { account, notificationPreference, user } from "./schema";
import {
  createTrackingItem,
  updateTrackingItem,
} from "../server/services/tracking-items";
import {
  createManualPayable,
  generateMonthlyPayables,
  listPayables,
} from "../server/services/payables";
import { recordPayment } from "../server/services/payments";
import type { TrackingItem } from "./schema";
import type { CreateManualPayableInput } from "../lib/validations/payable";

const DEMO_EMAIL = "demo@paytrack.app";
const DEMO_PASSWORD = "DemoPass123!";
const now = new Date();
const today = now.getDate();
const PAYMENT_METHODS = ["UPI", "Bank Transfer", "Auto-debit", "Card"];

function monthsAgo(n: number): string {
  return format(subMonths(now, n), "yyyy-MM-dd");
}

function periodOf(monthsBack: number): string {
  return format(subMonths(now, monthsBack), "yyyy-MM");
}

function dayThisMonth(day: number): string {
  return format(new Date(now.getFullYear(), now.getMonth(), day), "yyyy-MM-dd");
}

// A day-of-month guaranteed to be in the future relative to today (wraps to
// next month's range if needed by capping at 28, which is always safe).
function futureEmiDay(offset: number): string {
  return String(Math.min(28, today + offset));
}

// A day-of-month guaranteed to be in the past relative to today.
function pastEmiDay(offset: number): string {
  return String(Math.max(1, today - offset));
}

async function resetDemoUser() {
  // Cascading FKs on tracking_item / monthly_payable / payment_history /
  // notification_preference / session / account all clean up automatically.
  await db.delete(user).where(eq(user.email, DEMO_EMAIL));
}

async function createDemoUser(): Promise<string> {
  const id = randomUUID();
  const hashed = await hashPassword(DEMO_PASSWORD);

  await db.insert(user).values({
    id,
    email: DEMO_EMAIL,
    name: "Demo User",
    firstName: "Demo",
    lastName: "User",
    phone: "+91 98765 43210",
    emailVerified: true,
  });

  await db.insert(account).values({
    id: randomUUID(),
    userId: id,
    accountId: id,
    providerId: "credential",
    password: hashed,
  });

  await db.insert(notificationPreference).values({ userId: id });

  return id;
}

async function payTrackingItemMonths(
  userId: string,
  item: TrackingItem,
  monthsBackToPay: number[],
) {
  for (const m of monthsBackToPay) {
    const payables = await listPayables(userId, { billingPeriod: periodOf(m) });
    const payable = payables.find((p) => p.trackingItemId === item.id);
    if (!payable || payable.status === "paid") continue;
    await recordPayment(userId, payable.id, {
      paymentDate: monthsAgo(m),
      paymentMethod: PAYMENT_METHODS[m % PAYMENT_METHODS.length],
    });
  }
}

async function seedManualPayable(
  userId: string,
  input: CreateManualPayableInput,
  pay: boolean,
) {
  const payable = await createManualPayable(userId, input);
  if (pay) {
    await recordPayment(userId, payable.id, {
      paymentDate: input.dueDate,
      paymentMethod: "UPI",
    });
  }
  return payable;
}

async function main() {
  console.log(`Resetting demo account (${DEMO_EMAIL})...`);
  await resetDemoUser();

  console.log("Creating demo user...");
  const userId = await createDemoUser();

  console.log("Creating tracking items...");

  const homeLoan = await createTrackingItem(userId, {
    name: "HDFC Home Loan",
    type: "home_loan",
    lenderName: "HDFC Bank",
    accountNumberLast4: "4821",
    principalAmount: "3500000",
    interestRate: "8.5",
    monthlyEmiAmount: "32500",
    tenureMonths: "240",
    emiDay: futureEmiDay(3), // current month reads "upcoming"
    startDate: monthsAgo(7),
    notes: "20-year home loan, floating rate.",
  });

  const personalLoan = await createTrackingItem(userId, {
    name: "ICICI Personal Loan",
    type: "personal_loan",
    lenderName: "ICICI Bank",
    accountNumberLast4: "7734",
    principalAmount: "300000",
    interestRate: "13.5",
    monthlyEmiAmount: "15000",
    tenureMonths: "24",
    emiDay: pastEmiDay(5), // current month intentionally reads "overdue"
    startDate: monthsAgo(5),
    notes: "Used for home renovation.",
  });

  const carLoan = await createTrackingItem(userId, {
    name: "Axis Car Loan",
    type: "car_loan",
    lenderName: "Axis Bank",
    accountNumberLast4: "2290",
    principalAmount: "750000",
    interestRate: "9.25",
    monthlyEmiAmount: "16800",
    tenureMonths: "60",
    emiDay: futureEmiDay(5),
    startDate: monthsAgo(4),
  });

  const bikeLoan = await createTrackingItem(userId, {
    name: "Bajaj Finance Bike Loan",
    type: "bike_loan",
    lenderName: "Bajaj Finance",
    accountNumberLast4: "5510",
    principalAmount: "85000",
    interestRate: "11",
    monthlyEmiAmount: "4300",
    tenureMonths: "20",
    emiDay: futureEmiDay(8),
    startDate: monthsAgo(19),
  });

  const creditCardEmi = await createTrackingItem(userId, {
    name: "HDFC Credit Card — Electronics EMI",
    type: "credit_card_emi",
    lenderName: "HDFC Bank",
    accountNumberLast4: "9981",
    principalAmount: "60000",
    interestRate: "15",
    monthlyEmiAmount: "5200",
    tenureMonths: "12",
    emiDay: futureEmiDay(10),
    startDate: monthsAgo(3),
  });

  // Fully paid off — demonstrates the "completed" status.
  const oldScooter = await createTrackingItem(userId, {
    name: "Old Scooter Loan (Paid Off)",
    type: "bike_loan",
    lenderName: "Muthoot Finance",
    principalAmount: "40000",
    interestRate: "10",
    monthlyEmiAmount: "10000",
    tenureMonths: "4",
    emiDay: "1",
    startDate: monthsAgo(6),
  });

  // Closed manually (e.g. settled outside the app) — demonstrates "closed" status.
  const closedLoan = await createTrackingItem(userId, {
    name: "Old Consumer Durable EMI (Closed)",
    type: "credit_card_emi",
    lenderName: "Bajaj Finserv",
    principalAmount: "25000",
    interestRate: "14",
    monthlyEmiAmount: "5000",
    tenureMonths: "5",
    emiDay: "12",
    startDate: monthsAgo(8),
    notes: "Settled directly with the lender; closed manually.",
  });
  await updateTrackingItem(userId, closedLoan.id, { status: "closed" });

  console.log("Generating monthly payables (one pass per period, all active items)...");
  for (let m = 7; m >= 0; m--) {
    await generateMonthlyPayables(userId, periodOf(m));
  }

  console.log("Recording payment history...");
  // The generation loop above runs across all 8 periods for every active
  // item, so every item needs its *entire* generated range paid off here —
  // periods before an item's start date were already skipped at generation
  // time, and payTrackingItemMonths silently skips periods with no matching
  // payable, so it's safe to pass the full window for every item.
  const payAllExceptCurrentMonth = [7, 6, 5, 4, 3, 2, 1];
  await payTrackingItemMonths(userId, homeLoan, payAllExceptCurrentMonth);
  await payTrackingItemMonths(userId, personalLoan, payAllExceptCurrentMonth); // month 0 left unpaid -> overdue
  await payTrackingItemMonths(userId, carLoan, payAllExceptCurrentMonth);
  await payTrackingItemMonths(userId, bikeLoan, payAllExceptCurrentMonth);
  await payTrackingItemMonths(userId, creditCardEmi, payAllExceptCurrentMonth);
  await payTrackingItemMonths(userId, oldScooter, [7, 6, 5, 4, 3, 2, 1, 0]); // pays off every installment, including "current"

  console.log("Seeding manual payables (bills, rent, etc.)...");

  // Rent — paid for the last few months; current month intentionally overdue
  // (due on the 2nd, a manual-bill example of the overdue state).
  for (const m of [3, 2, 1]) {
    await seedManualPayable(
      userId,
      {
        category: "rent",
        title: "Monthly Rent",
        amount: "18000",
        dueDate: format(new Date(now.getFullYear(), now.getMonth() - m, 2), "yyyy-MM-dd"),
      },
      true,
    );
  }
  await seedManualPayable(
    userId,
    {
      category: "rent",
      title: "Monthly Rent",
      amount: "18000",
      dueDate: dayThisMonth(2),
    },
    false,
  );

  // Electricity — varying amounts, mostly paid, current month upcoming.
  const electricityAmounts = ["1450", "1620", "1380"];
  for (let i = 0; i < 3; i++) {
    const m = 3 - i;
    await seedManualPayable(
      userId,
      {
        category: "electricity_bill",
        title: `Electricity Bill — ${format(subMonths(now, m), "MMMM")}`,
        amount: electricityAmounts[i],
        dueDate: format(
          new Date(now.getFullYear(), now.getMonth() - m, 15),
          "yyyy-MM-dd",
        ),
      },
      true,
    );
  }
  await seedManualPayable(
    userId,
    {
      category: "electricity_bill",
      title: "Electricity Bill — Current",
      amount: "1550",
      dueDate: dayThisMonth(Math.min(28, today + 6)),
    },
    false,
  );

  // Internet — small recurring bill, fully paid.
  for (const m of [2, 1]) {
    await seedManualPayable(
      userId,
      {
        category: "internet_bill",
        title: "Internet Bill",
        amount: "999",
        dueDate: format(new Date(now.getFullYear(), now.getMonth() - m, 8), "yyyy-MM-dd"),
      },
      true,
    );
  }

  // Water bill.
  await seedManualPayable(
    userId,
    { category: "water_bill", title: "Water Bill", amount: "420", dueDate: monthsAgo(1) },
    true,
  );

  // Insurance — annual premium.
  await seedManualPayable(
    userId,
    {
      category: "insurance",
      title: "Health Insurance Premium",
      amount: "14500",
      dueDate: monthsAgo(2),
      notes: "Annual family floater premium.",
    },
    true,
  );

  // Credit card bill (a full statement payoff, distinct from the EMI item above).
  await seedManualPayable(
    userId,
    {
      category: "credit_card_bill",
      title: "SBI Credit Card Statement",
      amount: "8600",
      dueDate: monthsAgo(1),
    },
    true,
  );
  await seedManualPayable(
    userId,
    {
      category: "credit_card_bill",
      title: "SBI Credit Card Statement",
      amount: "6200",
      dueDate: dayThisMonth(Math.min(28, today + 4)),
    },
    false,
  );

  // Borrowed amount + friend loan — informal debts.
  await seedManualPayable(
    userId,
    {
      category: "borrowed_amount",
      title: "Borrowed from Dad",
      amount: "10000",
      dueDate: dayThisMonth(Math.min(28, today + 12)),
      notes: "To repay by end of month.",
    },
    false,
  );
  await seedManualPayable(
    userId,
    {
      category: "friend_loan",
      title: "Owed to Priya (trip expenses)",
      amount: "3200",
      dueDate: monthsAgo(1),
    },
    true,
  );

  // Miscellaneous.
  await seedManualPayable(
    userId,
    {
      category: "miscellaneous",
      title: "Annual Gym Membership",
      amount: "6000",
      dueDate: monthsAgo(2),
    },
    true,
  );

  console.log("\nDemo account ready:");
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
