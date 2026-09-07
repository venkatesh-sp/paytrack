import { Minus, TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedCounter } from "@/components/animated-counter";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  format,
  icon: Icon,
  tone = "default",
  trend,
}: {
  label: string;
  value: number;
  format: (value: number) => string;
  icon: LucideIcon;
  tone?: "default" | "warning" | "destructive";
  trend?: { value: number; label: string };
}) {
  const TrendIcon = trend
    ? trend.value > 0
      ? TrendingUp
      : trend.value < 0
        ? TrendingDown
        : Minus
    : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-muted-foreground text-xs font-medium">
          {label}
        </CardTitle>
        <Icon
          className={cn(
            "text-muted-foreground size-4",
            tone === "warning" && "text-warning",
            tone === "destructive" && "text-destructive",
          )}
        />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-tight">
          <AnimatedCounter value={value} format={format} />
        </p>
        {trend && TrendIcon && (
          <p
            className={cn(
              "mt-1 flex items-center gap-1 text-xs",
              trend.value > 0 && "text-emerald-600 dark:text-emerald-500",
              trend.value < 0 && "text-red-600 dark:text-red-500",
              trend.value === 0 && "text-muted-foreground",
            )}
          >
            <TrendIcon className="size-3.5" />
            {trend.value > 0 ? "+" : ""}
            {format(trend.value)} {trend.label}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
