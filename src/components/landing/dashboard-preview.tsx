import { motion } from "framer-motion";
import { ArrowUpRight, Bell, Wallet } from "lucide-react";

const bars = [38, 55, 46, 70, 62, 84, 74];
const upcoming = [
  { label: "Home Loan EMI", amount: "₹32,500", tone: "var(--chart-1)" },
  { label: "Electricity Bill", amount: "₹1,550", tone: "var(--chart-4)" },
  { label: "Car Loan EMI", amount: "₹16,800", tone: "var(--chart-3)" },
];

export function DashboardPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotate: -2 }}
      animate={{ opacity: 1, y: 0, rotate: -2 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
      whileHover={{ rotate: 0, y: -4 }}
      className="relative mx-auto w-full max-w-md"
    >
      <div
        aria-hidden
        className="absolute -inset-6 -z-10 rounded-[2rem] bg-[color-mix(in_oklch,var(--primary)_18%,transparent)] blur-2xl"
      />
      <div className="bg-card/90 supports-[backdrop-filter]:bg-card/80 overflow-hidden rounded-2xl border shadow-2xl backdrop-blur">
        <div className="bg-muted/40 flex items-center gap-1.5 border-b px-4 py-3">
          <span className="bg-destructive/70 size-2.5 rounded-full" />
          <span className="bg-warning/70 size-2.5 rounded-full" />
          <span className="bg-success/70 size-2.5 rounded-full" />
          <span className="text-muted-foreground ml-3 text-xs font-medium">
            PayTrack — Dashboard
          </span>
        </div>

        <div className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-background rounded-xl border p-3">
              <p className="text-muted-foreground text-[10px] font-medium">
                Total Outstanding
              </p>
              <p className="mt-1 text-lg font-semibold">₹4,29,600</p>
            </div>
            <div className="bg-background rounded-xl border p-3">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-[10px] font-medium">
                  Paid this month
                </p>
                <ArrowUpRight className="text-success size-3" />
              </div>
              <p className="text-success mt-1 text-lg font-semibold">₹73,800</p>
            </div>
          </div>

          <div className="bg-background rounded-xl border p-3">
            <p className="text-muted-foreground mb-3 text-[10px] font-medium">
              Monthly EMI trend
            </p>
            <div className="flex h-16 items-end gap-1.5">
              {bars.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm"
                  style={{
                    height: `${h}%`,
                    backgroundColor:
                      i === bars.length - 1 ? "var(--chart-1)" : "var(--muted)",
                  }}
                />
              ))}
            </div>
          </div>

          <div className="bg-background rounded-xl border p-3">
            <div className="mb-2 flex items-center gap-1.5">
              <Bell className="text-muted-foreground size-3" />
              <p className="text-muted-foreground text-[10px] font-medium">
                Upcoming payments
              </p>
            </div>
            <ul className="space-y-2">
              {upcoming.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="size-1.5 rounded-full"
                      style={{ backgroundColor: item.tone }}
                    />
                    <span className="text-foreground/80">{item.label}</span>
                  </div>
                  <span className="font-medium">{item.amount}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, x: -10 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="bg-card absolute top-10 -left-8 hidden items-center gap-2 rounded-xl border px-3 py-2 shadow-lg sm:flex"
      >
        <span className="bg-success/15 text-success flex size-7 items-center justify-center rounded-lg">
          <Wallet className="size-3.5" />
        </span>
        <div>
          <p className="text-muted-foreground text-[10px]">Payment recorded</p>
          <p className="text-xs font-semibold">₹10,000 · Personal Loan</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
