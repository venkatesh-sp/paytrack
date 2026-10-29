import { useId } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/hooks/use-settings";
import { ApiError } from "@/lib/api/client";

function Row({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  comingSoon,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  comingSoon?: boolean;
}) {
  const switchId = useId();
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <Label
        htmlFor={switchId}
        className="flex min-h-11 flex-1 cursor-pointer flex-col items-start justify-center gap-1"
      >
        <span className="flex items-center gap-2">
          <span className="text-sm font-medium">{label}</span>
          {comingSoon && <Badge variant="outline">Coming soon</Badge>}
        </span>
        <span className="text-muted-foreground text-sm font-normal">{description}</span>
      </Label>
      <Switch
        id={switchId}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
}

export function NotificationPreferencesForm() {
  const { data: preferences, isLoading } = useNotificationPreferences();
  const updateMutation = useUpdateNotificationPreferences();

  async function toggle(field: string, value: boolean) {
    try {
      await updateMutation.mutateAsync({ [field]: value });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Something went wrong");
    }
  }

  if (isLoading || !preferences) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="divide-y">
      <Row
        label="Email reminders"
        description="Receive payment reminders by email."
        checked={preferences.emailEnabled}
        onCheckedChange={(v) => toggle("emailEnabled", v)}
      />
      <Row
        label="7 days before"
        description="Remind me a week before a payment is due."
        checked={preferences.remindSevenDaysBefore}
        onCheckedChange={(v) => toggle("remindSevenDaysBefore", v)}
        disabled={!preferences.emailEnabled}
      />
      <Row
        label="3 days before"
        description="Remind me three days before a payment is due."
        checked={preferences.remindThreeDaysBefore}
        onCheckedChange={(v) => toggle("remindThreeDaysBefore", v)}
        disabled={!preferences.emailEnabled}
      />
      <Row
        label="1 day before"
        description="Remind me the day before a payment is due."
        checked={preferences.remindOneDayBefore}
        onCheckedChange={(v) => toggle("remindOneDayBefore", v)}
        disabled={!preferences.emailEnabled}
      />
      <Row
        label="On the due date"
        description="Remind me on the day a payment is due."
        checked={preferences.remindOnDueDate}
        onCheckedChange={(v) => toggle("remindOnDueDate", v)}
        disabled={!preferences.emailEnabled}
      />
      <Separator className="my-2" />
      <Row
        label="Browser notifications"
        description="Get a push notification in your browser."
        checked={false}
        disabled
        comingSoon
      />
      <Row
        label="WhatsApp"
        description="Get reminders on WhatsApp."
        checked={false}
        disabled
        comingSoon
      />
      <Row
        label="SMS"
        description="Get reminders by text message."
        checked={false}
        disabled
        comingSoon
      />
    </div>
  );
}
