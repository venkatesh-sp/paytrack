import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, trackingItemTypeLabels } from "@/lib/format";

// Fixed hue order from the validated categorical palette — never reassigned per render.
const SERIES_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const TYPE_ORDER = [
  "home_loan",
  "personal_loan",
  "car_loan",
  "bike_loan",
  "credit_card_emi",
];

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: { type: string; outstanding: number } }[];
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-popover-foreground">
        {trackingItemTypeLabels[item.type]}
      </p>
      <p className="text-muted-foreground">{formatCurrency(item.outstanding)}</p>
    </div>
  );
}

export function LoanDistributionChart({
  data,
}: {
  data: { type: string; outstanding: number }[];
}) {
  const sorted = [...data].sort(
    (a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type),
  );

  return (
    <ResponsiveContainer width="100%" height={sorted.length * 44 + 20}>
      <BarChart
        data={sorted}
        layout="vertical"
        margin={{ top: 4, right: 24, bottom: 4, left: 4 }}
        barSize={16}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="type"
          tickFormatter={(value: string) => trackingItemTypeLabels[value] ?? value}
          width={120}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
        />
        <Tooltip cursor={{ fill: "var(--muted)" }} content={<CustomTooltip />} />
        <Bar dataKey="outstanding" radius={[4, 4, 4, 4]}>
          {sorted.map((entry) => (
            <Cell
              key={entry.type}
              fill={SERIES_COLORS[TYPE_ORDER.indexOf(entry.type) % SERIES_COLORS.length]}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
