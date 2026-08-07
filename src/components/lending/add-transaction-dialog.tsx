import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowDownLeft, ArrowUpRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DatePicker } from "@/components/date-picker";
import { useAddLendingTransaction } from "@/hooks/use-lending";
import {
  addLendingTransactionSchema,
  type AddLendingTransactionInput,
} from "@/lib/validations/lending";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const typeOptions = [
  { value: "you_gave", label: "You Gave", icon: ArrowUpRight },
  { value: "you_got", label: "You Got", icon: ArrowDownLeft },
] as const;

export function AddTransactionDialog({
  contactId,
  trigger,
}: {
  contactId: string;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const addTransaction = useAddLendingTransaction(contactId);

  const form = useForm<AddLendingTransactionInput>({
    resolver: zodResolver(addLendingTransactionSchema),
    defaultValues: {
      type: "you_gave",
      amount: "",
      transactionDate: new Date().toISOString().slice(0, 10),
      note: "",
    },
  });

  async function onSubmit(values: AddLendingTransactionInput) {
    try {
      await addTransaction.mutateAsync(values);
      toast.success("Transaction added");
      setOpen(false);
      form.reset({
        type: values.type,
        amount: "",
        transactionDate: new Date().toISOString().slice(0, 10),
        note: "",
      });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Something went wrong");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add transaction</DialogTitle>
          <DialogDescription>
            Record money you gave to or got from this contact.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {typeOptions.map((option) => {
                      const isActive = field.value === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => field.onChange(option.value)}
                          className={cn(
                            "flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                            isActive
                              ? "border-primary bg-accent text-accent-foreground"
                              : "hover:bg-muted",
                          )}
                        >
                          <option.icon className="size-4" />
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input inputMode="decimal" placeholder="1000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="transactionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <DatePicker value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Note <span className="text-muted-foreground">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                Add transaction
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
