import { Check } from "lucide-react";
import { useColorPreset } from "@/components/color-preset-provider";
import { cn } from "@/lib/utils";

export function ColorPresetSettings() {
  const { preset, setPreset, presets } = useColorPreset();

  return (
    <div className="flex flex-wrap gap-3">
      {presets.map((option) => {
        const isActive = preset === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setPreset(option.value)}
            className={cn(
              "flex w-28 flex-col items-center gap-2 rounded-xl border p-4 text-sm transition-colors",
              isActive
                ? "border-primary bg-accent text-accent-foreground"
                : "hover:bg-muted",
            )}
          >
            <span
              className="flex size-8 items-center justify-center rounded-full"
              style={{ backgroundColor: option.swatch }}
            >
              {isActive && <Check className="size-4 text-white" strokeWidth={3} />}
            </span>
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
