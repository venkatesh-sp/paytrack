import Link from "next/link";
import { motion } from "framer-motion";
import { Wallet, ShieldCheck, TrendingUp, BellRing } from "lucide-react";
import type { ReactNode } from "react";

const highlights = [
  {
    icon: BellRing,
    title: "Never miss a due date",
    description: "Automated reminders 7, 3, and 1 day before every payment.",
  },
  {
    icon: TrendingUp,
    title: "See the full picture",
    description: "Track EMIs, credit cards, and bills in one dashboard.",
  },
  {
    icon: ShieldCheck,
    title: "Built for trust",
    description: "Every payment is recorded as an immutable, auditable event.",
  },
];

export function AuthLayout({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col justify-between p-8 md:p-12">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wallet className="size-4" />
          </span>
          PayTrack
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="mx-auto w-full max-w-sm"
        >
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          </div>
          {children}
        </motion.div>

        <div className="text-xs text-muted-foreground">
          {footer ?? (
            <p>&copy; {new Date().getFullYear()} PayTrack. All rights reserved.</p>
          )}
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-sidebar lg:block">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,color-mix(in_oklch,var(--primary)_25%,transparent),transparent_55%),radial-gradient(circle_at_80%_70%,color-mix(in_oklch,var(--chart-2)_20%,transparent),transparent_55%)]"
        />
        <div className="relative flex h-full flex-col justify-center gap-10 p-16">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-sidebar-foreground">
              Every payment, on time.
            </h2>
            <p className="mt-3 max-w-sm text-sm text-sidebar-foreground/70">
              PayTrack keeps your loans, EMIs, and bills organized so nothing
              slips through the cracks.
            </p>
          </div>

          <div className="space-y-6">
            {highlights.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: 0.1 + i * 0.08 }}
                className="flex items-start gap-4"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sidebar-foreground/5 text-sidebar-foreground backdrop-blur">
                  <item.icon className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-medium text-sidebar-foreground">
                    {item.title}
                  </p>
                  <p className="text-sm text-sidebar-foreground/60">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
