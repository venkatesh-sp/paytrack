import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/format";

// Fixed hue order — never reassigned by value/rank. Items past the 5th slot
// fold into "Other" rather than generating a new hue.
const SERIES_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];
const MAX_SLOTS = 5;

type Slice = { key: string; label: string; amount: number };

function CustomTooltip({
  active,
  payload,
  total,
}: {
  active?: boolean;
  payload?: { payload: Slice }[];
  total: number;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  const pct = total > 0 ? (item.amount / total) * 100 : 0;
  return (
    <div className="bg-popover rounded-lg border px-3 py-2 text-xs shadow-md">
      <p className="text-popover-foreground font-medium">{item.label}</p>
      <p className="text-muted-foreground">
        {formatCurrency(item.amount)} · {pct.toFixed(0)}%
      </p>
    </div>
  );
}

export function TrackingItemDistributionPie({
  data,
}: {
  data: { id: string; name: string; amount: number }[];
}) {
  const sorted = [...data].sort((a, b) => b.amount - a.amount);
  const primary = sorted.slice(0, MAX_SLOTS);
  const rest = sorted.slice(MAX_SLOTS);
  const otherTotal = rest.reduce((sum, r) => sum + r.amount, 0);

  const chartData: Slice[] = [
    ...primary.map((d) => ({ key: d.id, label: d.name, amount: d.amount })),
    ...(otherTotal > 0 ? [{ key: "other", label: "Other", amount: otherTotal }] : []),
  ];
  const total = chartData.reduce((sum, d) => sum + d.amount, 0);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="amount"
          nameKey="label"
          innerRadius="55%"
          outerRadius="85%"
          paddingAngle={chartData.length > 1 ? 2 : 0}
          cornerRadius={4}
          stroke="none"
        >
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
        </Pie>
        <Tooltip content={<CustomTooltip total={total} />} />
        <Legend
          verticalAlign="bottom"
          height={36}
          wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
