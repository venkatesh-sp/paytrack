import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, payableCategoryLabels } from "@/lib/format";

// Fixed hue order — never reassigned by value/rank. Categories past the 8th
// slot fold into "Other" rather than generating a new hue.
const SERIES_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];
const CATEGORY_ORDER = [
  "emi",
  "credit_card_bill",
  "electricity_bill",
  "rent",
  "insurance",
  "borrowed_amount",
  "friend_loan",
  "internet_bill",
  "water_bill",
  "miscellaneous",
];
const MAX_SLOTS = 5;

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: { label: string; amount: number } }[];
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="bg-popover rounded-lg border px-3 py-2 text-xs shadow-md">
      <p className="text-popover-foreground font-medium">{item.label}</p>
      <p className="text-muted-foreground">{formatCurrency(item.amount)}</p>
    </div>
  );
}

export function CategoryDistributionChart({
  data,
}: {
  data: { category: string; amount: number }[];
}) {
  const sorted = [...data].sort(
    (a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category),
  );

  const primary = sorted.slice(0, MAX_SLOTS);
  const rest = sorted.slice(MAX_SLOTS);
  const otherTotal = rest.reduce((sum, r) => sum + r.amount, 0);

  const chartData = [
    ...primary.map((d) => ({
      key: d.category,
      label: payableCategoryLabels[d.category] ?? d.category,
      amount: d.amount,
    })),
    ...(otherTotal > 0 ? [{ key: "other", label: "Other", amount: otherTotal }] : []),
  ];

  return (
    <ResponsiveContainer width="100%" height={chartData.length * 40 + 20}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 4, right: 24, bottom: 4, left: 4 }}
        barSize={16}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="label"
          width={130}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
        />
        <Tooltip cursor={{ fill: "var(--muted)" }} content={<CustomTooltip />} />
        <Bar dataKey="amount" radius={[4, 4, 4, 4]}>
          {chartData.map((entry, i) => (
            <Cell
              key={entry.key}
              fill={
                entry.key === "other"
                  ? "var(--muted-foreground)"
                  : SERIES_COLORS[i % SERIES_COLORS.length]
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
