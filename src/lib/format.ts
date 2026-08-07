const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatCurrency(value: string | number): string {
  const num = typeof value === "string" ? Number(value) : value;
  return currencyFormatter.format(Number.isFinite(num) ? num : 0);
}

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return dateFormatter.format(date);
}

export function formatPeriodLabel(period: string): string {
  const [year, month] = period.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "short",
    year: "2-digit",
  });
}

export const trackingItemTypeLabels: Record<string, string> = {
  home_loan: "Home Loan",
  personal_loan: "Personal Loan",
  car_loan: "Car Loan",
  bike_loan: "Bike Loan",
  credit_card_emi: "Credit Card EMI",
};

export const trackingItemStatusLabels: Record<string, string> = {
  active: "Active",
  completed: "Completed",
  closed: "Closed",
};

export const payableCategoryLabels: Record<string, string> = {
  emi: "EMI",
  credit_card_bill: "Credit Card Bill",
  borrowed_amount: "Borrowed Amount",
  friend_loan: "Friend Loan",
  electricity_bill: "Electricity Bill",
  internet_bill: "Internet Bill",
  water_bill: "Water Bill",
  insurance: "Insurance",
  rent: "Rent",
  miscellaneous: "Miscellaneous",
};

export const payableStatusLabels: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  overdue: "Overdue",
};
