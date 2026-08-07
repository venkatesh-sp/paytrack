import { getPasswordStrength } from "@/lib/password-strength";
import { cn } from "@/lib/utils";

export function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;
  const { score, label, colorClass } = getPasswordStrength(password);

  return (
    <div className="space-y-1.5 pt-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn("bg-muted h-1 flex-1 rounded-full", i < score && colorClass)}
          />
        ))}
      </div>
      <p className="text-muted-foreground text-xs">Password strength: {label}</p>
    </div>
  );
}
