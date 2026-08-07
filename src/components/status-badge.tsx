import type { LucideIcon } from "lucide-react";
import type { VariantProps } from "class-variance-authority";

import { Badge, badgeVariants } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function StatusBadge({
  icon: Icon,
  label,
  variant,
  className,
}: {
  icon: LucideIcon;
  label: string;
  variant?: VariantProps<typeof badgeVariants>["variant"];
  className?: string;
}) {
  return (
    <Badge variant={variant} className={cn(className)}>
      <Icon className="size-3" />
      {label}
    </Badge>
  );
}
