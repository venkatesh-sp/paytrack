import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedCounter } from "@/components/animated-counter";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  format,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: number;
  format: (value: number) => string;
  icon: LucideIcon;
  tone?: "default" | "warning" | "destructive";
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
        <Icon
          className={cn(
            "size-4 text-muted-foreground",
            tone === "warning" && "text-warning",
            tone === "destructive" && "text-destructive",
          )}
        />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-tight">
          <AnimatedCounter value={value} format={format} />
        </p>
      </CardContent>
    </Card>
  );
}
