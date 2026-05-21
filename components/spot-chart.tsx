"use client"

import { useEffect, useState } from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface ChartPoint {
  time: string
  price: number
  low: number
  high: number
}

interface SpotChartProps {
  symbol: string
  name: string
}

const RANGES = [
  { key: "1h", label: "1H" },
  { key: "6h", label: "6H" },
  { key: "24h", label: "24H" },
  { key: "7d", label: "7D" },
  { key: "30d", label: "30D" },
  { key: "all", label: "ALL" },
]

export function SpotChart({ symbol, name }: SpotChartProps) {
  const [range, setRange] = useState("24h")
  const [data, setData] = useState<ChartPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/prices/chart?symbol=${symbol}&range=${range}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setData(json.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [symbol, range])

  const isPositive =
    data.length >= 2 ? data[data.length - 1].price >= data[0].price : true

  const accentColor = isPositive
    ? "oklch(0.72 0.19 142.5)"   // emerald
    : "oklch(0.64 0.24 25)"      // red

  const formatTime = (time: any) => {
    const d = new Date(time)
    if (range === "1h" || range === "6h" || range === "24h") {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" })
  }

  const formatPrice = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(val)

  const priceChange =
    data.length >= 2
      ? data[data.length - 1].price - data[0].price
      : 0

  const priceChangePercent =
    data.length >= 2 && data[0].price > 0
      ? ((priceChange / data[0].price) * 100).toFixed(2)
      : "0.00"

  return (
    <div className="rounded-xl border border-border/40 bg-card p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">{name}</p>
          {data.length > 0 && (
            <p
              className="text-xs font-medium tabular-nums"
              style={{ color: accentColor }}
            >
              {priceChange >= 0 ? "+" : ""}
              {formatPrice(priceChange)} ({priceChangePercent}%)
            </p>
          )}
        </div>
      </div>

      {/* Range Selector */}
      <div className="mb-3 flex gap-1">
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={`flex-1 rounded-md py-1.5 text-[11px] font-semibold transition-all duration-200 ${
              range === r.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted/40 text-muted-foreground hover:bg-muted"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-48">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            No data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id={`grad-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accentColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={accentColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                tickFormatter={formatTime}
                tick={{ fontSize: 10, fill: "oklch(0.556 0 0)" }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={40}
              />
              <YAxis
                domain={["auto", "auto"]}
                tickFormatter={(v: number) => `$${v.toLocaleString()}`}
                tick={{ fontSize: 10, fill: "oklch(0.556 0 0)" }}
                axisLine={false}
                tickLine={false}
                width={65}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(0.205 0 0)",
                  border: "1px solid oklch(1 0 0 / 10%)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  padding: "8px 12px",
                }}
                labelFormatter={formatTime}
                formatter={(value: any) => [formatPrice(value), "Price"]}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={accentColor}
                strokeWidth={2}
                fill={`url(#grad-${symbol})`}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: accentColor,
                  stroke: "oklch(0.205 0 0)",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Stats Row */}
      {data.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border/40 pt-3">
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground">Open</p>
            <p className="text-xs font-semibold tabular-nums">
              {formatPrice(data[0].price)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground">High</p>
            <p className="text-xs font-semibold tabular-nums">
              {formatPrice(Math.max(...data.map((d) => d.high)))}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground">Low</p>
            <p className="text-xs font-semibold tabular-nums">
              {formatPrice(Math.min(...data.map((d) => d.low)))}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
