import { useEffect, useRef } from "react";
import {
  animate,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
} from "framer-motion";

export function AnimatedCounter({
  value,
  format,
}: {
  value: number;
  format: (value: number) => string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const shouldReduceMotion = useReducedMotion();

  useMotionValueEvent(motionValue, "change", (latest) => {
    if (ref.current) ref.current.textContent = format(latest);
  });

  useEffect(() => {
    if (shouldReduceMotion) {
      motionValue.set(value);
      return;
    }
    const controls = animate(motionValue, value, { duration: 0.6, ease: "easeOut" });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span ref={ref}>{format(0)}</span>;
}
