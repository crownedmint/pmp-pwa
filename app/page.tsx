"use client"

import { useEffect, useState, useCallback } from "react"
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react"
import { SpotChart } from "@/components/spot-chart"

interface Metal {
  symbol: string
  name: string
  element: string
  price: number
  change: number
  changePercent: number
  timestamp: string
}

export default function MarketPage() {
  const [metals, setMetals] = useState<Metal[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMetal, setSelectedMetal] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>("")

  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch("/api/prices")
      const data = await res.json()
      if (data.metals) {
        setMetals(data.metals)
        setLastUpdated(
          new Date(data.updatedAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        )
      }
    } catch (err) {
      console.error("Failed to fetch prices:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPrices()
    const interval = setInterval(fetchPrices, 60_000) // refresh every 60s
    return () => clearInterval(interval)
  }, [fetchPrices])

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price)

  return (
    <div className="flex flex-col px-4">
      {/* Header */}
      <header className="flex items-center justify-between pt-2 pb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Market</h1>
          <p className="text-xs text-muted-foreground">
            {lastUpdated
              ? `Updated ${lastUpdated}`
              : "Live spot prices"}
          </p>
        </div>
        <button
          onClick={() => {
            setLoading(true)
            fetchPrices()
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 transition-all duration-200 active:scale-90"
        >
          <RefreshCw
            className={`h-4 w-4 text-primary ${loading ? "animate-spin" : ""}`}
          />
        </button>
      </header>

      {/* Spot Price Cards */}
      <div className="grid grid-cols-2 gap-3">
        {loading && metals.length === 0
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl border border-border/40 bg-card p-4"
              >
                <div className="h-3 w-16 rounded bg-muted" />
                <div className="mt-3 h-6 w-24 rounded bg-muted" />
                <div className="mt-3 h-3 w-20 rounded bg-muted" />
              </div>
            ))
          : metals.map((metal) => (
              <button
                key={metal.symbol}
                onClick={() =>
                  setSelectedMetal(
                    selectedMetal === metal.symbol ? null : metal.symbol
                  )
                }
                className={`relative overflow-hidden rounded-xl border bg-card p-4 text-left transition-all duration-200 active:scale-[0.97] ${
                  selectedMetal === metal.symbol
                    ? "border-primary/50 ring-1 ring-primary/20"
                    : "border-border/40"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                      {metal.name}
                    </p>
                    <p className="mt-1 text-lg font-bold tabular-nums">
                      {formatPrice(metal.price)}
                    </p>
                  </div>
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-[11px] font-bold text-primary">
                    {metal.element}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1">
                  {metal.change >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-400" />
                  )}
                  <span
                    className={`text-xs font-medium tabular-nums ${
                      metal.change >= 0
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {metal.change >= 0 ? "+" : ""}
                    {formatPrice(metal.change)} ({metal.changePercent}%)
                  </span>
                </div>
              </button>
            ))}
      </div>

      {/* Chart Section */}
      {selectedMetal && (
        <div className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <SpotChart
            symbol={selectedMetal}
            name={
              metals.find((m) => m.symbol === selectedMetal)?.name ||
              selectedMetal
            }
          />
        </div>
      )}

      {/* Tap hint */}
      {!selectedMetal && metals.length > 0 && (
        <p className="mt-4 text-center text-xs text-muted-foreground/60">
          Tap a metal to view chart
        </p>
      )}
    </div>
  )
}
