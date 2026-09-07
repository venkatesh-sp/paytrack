import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { computeEndDate, listElapsedBillingPeriods } from "@/lib/dates";
import { usePayables } from "@/hooks/use-payables";
import type { MonthlyPayable } from "@/db/schema";

function periodLabel(billingPeriod: string): string {
  const [year, month] = billingPeriod.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

export function TrackingItemForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = "Save",
  mode = "create",
  trackingItemId,
  paidEmiCount = 0,
}: {
  defaultValues?: Partial<CreateTrackingItemInput>;
  onSubmit: (values: CreateTrackingItemInput) => Promise<void>;
  /** Renders a Cancel button next to submit when provided. */
  onCancel?: () => void;
  submitLabel?: string;
  mode?: "create" | "edit";
  trackingItemId?: string;
  /** Count of already-recorded paid EMIs for this item (edit mode only). */
  paidEmiCount?: number;
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
      outstandingAmount: "",
      paidBillingPeriods: [],
      ...defaultValues,
    },
  });

  const startDate = useWatch({ control: form.control, name: "startDate" });
  const tenureMonths = useWatch({ control: form.control, name: "tenureMonths" });
  const emiDay = useWatch({ control: form.control, name: "emiDay" });
  const monthlyEmiAmount = useWatch({ control: form.control, name: "monthlyEmiAmount" });

  // In edit mode, fetch this item's payables so every elapsed EMI month can
  // show its true current status — not just the untracked gaps. The query
  // must stay disabled (not just unfiltered) in create mode — otherwise it'd
  // fetch the user's entire payables list across every other tracking item.
  const shouldFetchExistingPayables = mode === "edit" && Boolean(trackingItemId);
  const { data: existingPayables, isLoading: isExistingPayablesLoading } = usePayables(
    shouldFetchExistingPayables ? { trackingItemId } : undefined,
    { enabled: shouldFetchExistingPayables },
  );

  const payableByPeriod = useMemo(() => {
    const map = new Map<string, MonthlyPayable>();
    for (const payable of existingPayables ?? []) map.set(payable.billingPeriod, payable);
    return map;
  }, [existingPayables]);

  const allElapsedPeriods = useMemo(() => {
    if (mode === "edit" && (!trackingItemId || isExistingPayablesLoading)) return [];

    const tenure = Number(tenureMonths);
    const day = Number(emiDay);
    if (!startDate || !Number.isFinite(tenure) || tenure < 1) return [];
    if (!Number.isFinite(day) || day < 1 || day > 31) return [];

    const endDate = computeEndDate(startDate, tenure);
    return listElapsedBillingPeriods(startDate, endDate, day);
  }, [mode, trackingItemId, isExistingPayablesLoading, startDate, tenureMonths, emiDay]);

  // Every elapsed month is treated identically and freely togglable, paid <->
  // pending, any number of times. Default selection mirrors reality (paid
  // stays checked, a tracked-pending month stays unchecked) — except a month
  // with no payable at all yet, which defaults to checked on the assumption a
  // backdated month is probably already paid. Once saved it becomes tracked,
  // so this convenience default only ever applies the first time a given
  // month is seen.
  const classifiedPeriods = useMemo(() => {
    return allElapsedPeriods.map((period) => {
      const payable = payableByPeriod.get(period.billingPeriod);
      return {
        billingPeriod: period.billingPeriod,
        dueDate: period.dueDate,
        currentlyPaid: payable?.status === "paid",
        tracked: Boolean(payable),
      };
    });
  }, [allElapsedPeriods, payableByPeriod]);

  const defaultCheckedPeriods = useMemo(
    () =>
      new Set(
        classifiedPeriods
          .filter((p) => p.currentlyPaid || !p.tracked)
          .map((p) => p.billingPeriod),
      ),
    [classifiedPeriods],
  );
  const originalPaidCount = useMemo(
    () => classifiedPeriods.filter((p) => p.currentlyPaid).length,
    [classifiedPeriods],
  );

  const periodsKey = classifiedPeriods
    .map((p) => `${p.billingPeriod}:${p.currentlyPaid}:${p.tracked}`)
    .join(",");
  const [paidPeriods, setPaidPeriods] = useState<Set<string>>(new Set());

  useEffect(() => {
    setPaidPeriods(new Set(defaultCheckedPeriods));
    // Reset to the real/default state whenever the underlying data changes shape.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodsKey]);

  useEffect(() => {
    form.setValue("paidBillingPeriods", Array.from(paidPeriods), { shouldDirty: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paidPeriods]);

  const isOutstandingDirty = Boolean(form.formState.dirtyFields.outstandingAmount);

  // Auto-populate outstanding from the total scheduled repayment (EMI ×
  // tenure — not the principal, which undercounts once interest is
  // involved) minus every paid EMI. `paidEmiCount` (from real payment
  // history, server-computed) already reflects every month's original paid
  // state; `paidPeriods.size - originalPaidCount` is the net change the
  // checklist toggles introduce this session — checking a pending month adds
  // to it, unchecking a paid one subtracts. The field stays editable for
  // anything this simple formula doesn't capture.
  useEffect(() => {
    if (isOutstandingDirty) return;
    const tenure = Number(tenureMonths);
    const emi = Number(monthlyEmiAmount);
    if (!Number.isFinite(tenure) || tenure < 1 || !Number.isFinite(emi) || emi <= 0)
      return;

    const totalRepayment = emi * tenure;
    const totalPaidCount = paidEmiCount + (paidPeriods.size - originalPaidCount);
    const computed = Math.max(0, totalRepayment - totalPaidCount * emi);
    form.setValue("outstandingAmount", computed.toFixed(2), { shouldDirty: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isOutstandingDirty,
    tenureMonths,
    monthlyEmiAmount,
    paidPeriods,
    paidEmiCount,
    originalPaidCount,
  ]);

  function togglePeriod(billingPeriod: string, checked: boolean) {
    setPaidPeriods((prev) => {
      const next = new Set(prev);
      if (checked) next.add(billingPeriod);
      else next.delete(billingPeriod);
      return next;
    });
  }

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
            name="outstandingAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Outstanding amount</FormLabel>
                <FormControl>
                  <Input inputMode="decimal" placeholder="500000" {...field} />
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

        {mode === "edit" && trackingItemId && isExistingPayablesLoading && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Checking EMI payment status…
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-40" />
            </CardContent>
          </Card>
        )}

        {classifiedPeriods.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">EMI payment status</CardTitle>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setPaidPeriods(
                        new Set(classifiedPeriods.map((p) => p.billingPeriod)),
                      )
                    }
                  >
                    Select all
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPaidPeriods(new Set())}
                  >
                    Select none
                  </Button>
                </div>
              </div>
              <p className="text-muted-foreground text-xs">
                Every EMI month due so far. Check a month once it&apos;s paid, or uncheck
                one to reverse it — this can be changed any time.
              </p>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {classifiedPeriods.map((period) => (
                <label
                  key={period.billingPeriod}
                  className="flex items-center gap-2 text-sm"
                >
                  <Checkbox
                    checked={paidPeriods.has(period.billingPeriod)}
                    onCheckedChange={(checked) =>
                      togglePeriod(period.billingPeriod, checked === true)
                    }
                  />
                  <span>
                    {periodLabel(period.billingPeriod)}{" "}
                    <span className="text-muted-foreground">
                      (due {new Date(period.dueDate).toLocaleDateString("en-IN")})
                    </span>
                  </span>
                </label>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
            {submitLabel}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              disabled={form.formState.isSubmitting}
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
