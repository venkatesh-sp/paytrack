import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DatePicker } from "@/components/date-picker";
import {
  createTrackingItemSchema,
  trackingItemTypeValues,
  type CreateTrackingItemInput,
} from "@/lib/validations/tracking-item";
import { trackingItemTypeLabels } from "@/lib/format";

export function TrackingItemForm({
  defaultValues,
  onSubmit,
  submitLabel = "Save",
}: {
  defaultValues?: Partial<CreateTrackingItemInput>;
  onSubmit: (values: CreateTrackingItemInput) => Promise<void>;
  submitLabel?: string;
}) {
  const form = useForm<CreateTrackingItemInput>({
    resolver: zodResolver(createTrackingItemSchema),
    defaultValues: {
      name: "",
      type: "personal_loan",
      lenderName: "",
      accountNumberLast4: "",
      principalAmount: "",
      interestRate: "",
      monthlyEmiAmount: "",
      tenureMonths: "12",
      emiDay: "5",
      startDate: new Date().toISOString().slice(0, 10),
      notes: "",
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. HDFC Home Loan" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {trackingItemTypeValues.map((type) => (
                      <SelectItem key={type} value={type}>
                        {trackingItemTypeLabels[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lenderName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Lender <span className="text-muted-foreground">(optional)</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="e.g. HDFC Bank" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="principalAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Principal amount</FormLabel>
                <FormControl>
                  <Input inputMode="decimal" placeholder="500000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="monthlyEmiAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monthly EMI amount</FormLabel>
                <FormControl>
                  <Input inputMode="decimal" placeholder="15000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="interestRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Interest rate %{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </FormLabel>
                <FormControl>
                  <Input inputMode="decimal" placeholder="8.5" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tenureMonths"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tenure (months)</FormLabel>
                <FormControl>
                  <Input type="number" min={1} max={600} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="emiDay"
            render={({ field }) => (
              <FormItem>
                <FormLabel>EMI day of month</FormLabel>
                <FormControl>
                  <Input type="number" min={1} max={31} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start date</FormLabel>
                <FormControl>
                  <DatePicker value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="accountNumberLast4"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Account last 4 digits{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="1234" maxLength={4} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>
                  Notes <span className="text-muted-foreground">(optional)</span>
                </FormLabel>
                <FormControl>
                  <Textarea rows={3} placeholder="Any additional details" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {submitLabel}
        </Button>
      </form>
    </Form>
  );
}
