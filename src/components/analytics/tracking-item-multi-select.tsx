import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TrackingItem } from "@/db/schema";

export function TrackingItemMultiSelect({
  items,
  selectedIds,
  onChange,
}: {
  items: Pick<TrackingItem, "id" | "name">[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  function toggle(id: string, checked: boolean) {
    onChange(checked ? [...selectedIds, id] : selectedIds.filter((i) => i !== id));
  }

  const label =
    selectedIds.length === 0
      ? "All tracking items"
      : selectedIds.length === 1
        ? (items.find((i) => i.id === selectedIds[0])?.name ?? "1 selected")
        : `${selectedIds.length} tracking items`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-56 justify-between font-normal">
          <span className="truncate">{label}</span>
          <ChevronDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {items.length === 0 && (
          <p className="text-muted-foreground px-2 py-1.5 text-sm">
            No tracking items yet.
          </p>
        )}
        {items.length > 0 && selectedIds.length > 0 && (
          <>
            <DropdownMenuItem onSelect={() => onChange([])}>
              Clear selection
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {items.map((item) => (
          <DropdownMenuCheckboxItem
            key={item.id}
            checked={selectedIds.includes(item.id)}
            onSelect={(e) => e.preventDefault()}
            onCheckedChange={(checked) => toggle(item.id, checked === true)}
          >
            {item.name}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
