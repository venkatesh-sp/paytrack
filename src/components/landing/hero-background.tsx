import { motion, useReducedMotion } from "framer-motion";

const NOISE_SVG =
  "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

export function HeroBackground() {
  const shouldReduceMotion = useReducedMotion();

  const orbTransition = (duration: number, delay = 0) =>
    shouldReduceMotion
      ? undefined
      : {
          duration,
          delay,
          repeat: Infinity,
          repeatType: "mirror" as const,
          ease: "easeInOut" as const,
        };

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* Grid pattern, faded toward the edges */}
      <div
        className="absolute inset-0 opacity-[0.35] dark:opacity-[0.25]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 70% 55% at 50% 0%, black 40%, transparent 90%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 55% at 50% 0%, black 40%, transparent 90%)",
        }}
      />

      {/* Soft gradient orbs */}
      <motion.div
        className="absolute -top-32 left-1/4 size-[420px] rounded-full bg-[color-mix(in_oklch,var(--chart-1)_45%,transparent)] blur-3xl"
        initial={{ opacity: 0.35, x: 0, y: 0 }}
        animate={
          shouldReduceMotion
            ? { opacity: 0.35 }
            : { opacity: [0.25, 0.4, 0.25], x: [0, 30, 0], y: [0, 20, 0] }
        }
        transition={orbTransition(14)}
      />
      <motion.div
        className="absolute top-10 right-1/4 size-[360px] rounded-full bg-[color-mix(in_oklch,var(--chart-4)_40%,transparent)] blur-3xl"
        initial={{ opacity: 0.25 }}
        animate={
          shouldReduceMotion
            ? { opacity: 0.25 }
            : { opacity: [0.2, 0.32, 0.2], x: [0, -24, 0], y: [0, 24, 0] }
        }
        transition={orbTransition(16, 1.5)}
      />
      <motion.div
        className="absolute top-64 left-1/2 size-[300px] -translate-x-1/2 rounded-full bg-[color-mix(in_oklch,var(--chart-3)_35%,transparent)] blur-3xl"
        initial={{ opacity: 0.2 }}
        animate={shouldReduceMotion ? { opacity: 0.2 } : { opacity: [0.15, 0.28, 0.15] }}
        transition={orbTransition(12, 0.75)}
      />

      {/* Fade to background at the bottom of the hero */}
      <div className="absolute inset-x-0 top-0 h-[640px] bg-[radial-gradient(ellipse_at_top,transparent_0%,transparent_55%,var(--background)_100%)]" />

      {/* Subtle grain for texture */}
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay dark:opacity-[0.05]"
        style={{ backgroundImage: `url("${NOISE_SVG}")` }}
      />
    </div>
  );
}
