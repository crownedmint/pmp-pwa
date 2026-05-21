"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  TrendingUp, 
  Coins, 
  RefreshCw, 
  Info, 
  Loader2,
  Sparkles,
  ArrowRightLeft
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface PricePoint {
  time: string
  price: number
}

interface RatioPoint {
  time: string
  ratio: number
}

export default function GoldSilverRatioPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [goldPrice, setGoldPrice] = useState(0)
  const [silverPrice, setSilverPrice] = useState(0)
  const [ratioChartData, setRatioChartData] = useState<RatioPoint[]>([])
  
  // Calculator state
  const [calcSource, setCalcSource] = useState<"gold" | "silver">("gold")
  const [inputWeight, setInputWeight] = useState<number>(1)
  const [outputWeight, setOutputWeight] = useState<number>(0)

  const fetchRatioData = async () => {
    setLoading(true)
    try {
      // 1. Fetch current spot prices
      const pricesRes = await fetch("/api/prices")
      const pricesJson = await pricesRes.json()
      if (pricesJson.metals) {
        const gold = pricesJson.metals.find((m: any) => m.symbol === "XAU")?.price || 0
        const silver = pricesJson.metals.find((m: any) => m.symbol === "XAG")?.price || 0
        setGoldPrice(gold)
        setSilverPrice(silver)
      }

      // 2. Fetch 7d historical charts to compute ratio history
      const [goldChartRes, silverChartRes] = await Promise.all([
        fetch("/api/prices/chart?symbol=XAU&range=7d"),
        fetch("/api/prices/chart?symbol=XAG&range=7d")
      ])
      const goldChart = await goldChartRes.json()
      const silverChart = await silverChartRes.json()

      if (goldChart.data && silverChart.data) {
        // Map silver timeseries to a map for O(1) lookup
        const silverMap = new Map<string, number>()
        silverChart.data.forEach((p: PricePoint) => {
          // Normalize to minutes or date string depending on format
          silverMap.set(p.time, p.price)
        })

        // Generate ratio timeseries
        const computed: RatioPoint[] = []
        goldChart.data.forEach((g: PricePoint) => {
          const sPrice = silverMap.get(g.time)
          if (sPrice && sPrice > 0) {
            computed.push({
              time: g.time,
              ratio: parseFloat((g.price / sPrice).toFixed(2))
            })
          }
        })
        setRatioChartData(computed)
      }
    } catch (err) {
      console.error("Failed to load ratio details:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRatioData()
  }, [])

  const currentRatio = goldPrice > 0 && silverPrice > 0 ? goldPrice / silverPrice : 0

  // Calculate swap conversions
  useEffect(() => {
    if (currentRatio <= 0) return
    if (calcSource === "gold") {
      setOutputWeight(parseFloat((inputWeight * currentRatio).toFixed(2)))
    } else {
      setOutputWeight(parseFloat((inputWeight / currentRatio).toFixed(4)))
    }
  }, [inputWeight, calcSource, currentRatio])

  const formatTime = (time: any) => {
    const d = new Date(time)
    return d.toLocaleDateString([], { month: "short", day: "numeric" })
  }

  // Trading signals
  const getTradingSignal = () => {
    if (currentRatio <= 0) return { label: "Calculating...", desc: "", color: "text-muted-foreground" }
    // Historical baseline: Ratio above 80 is high (silver is cheap relative to gold), below 60 is low (gold is cheap)
    if (currentRatio > 80) {
      return {
        label: "Silver Buy Alert",
        desc: "The ratio is historically high. Silver is undervalued relative to Gold. Swap Gold for Silver or buy physical Silver.",
        color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
      }
    } else if (currentRatio < 60) {
      return {
        label: "Gold Buy Alert",
        desc: "The ratio is historically low. Gold is cheap relative to Silver. Swap Silver to Gold or buy physical Gold.",
        color: "text-amber-400 bg-amber-500/10 border-amber-500/20"
      }
    }
    return {
      label: "Neutral Range",
      desc: "The ratio is in a standard historical range. Accumulate gold/silver based on custom target weights.",
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20"
    }
  }

  const signal = getTradingSignal()

  return (
    <div className="flex flex-col px-4 pb-24 max-w-lg mx-auto">
      <header className="flex items-center gap-3 pt-4 pb-3 border-b border-border/20 mb-4">
        <button onClick={() => router.back()} className="p-1 rounded-full text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold tracking-tight">Gold-to-Silver Ratio</h1>
          <p className="text-[10px] text-muted-foreground">Arbitrage opportunities & historical analysis</p>
        </div>
      </header>

      {loading ? (
        <div className="flex h-[60vh] flex-col items-center justify-center text-xs text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
          Analyzing precious metals spot ratios...
        </div>
      ) : (
        <div className="space-y-4">
          {/* Main Ratio Card */}
          <section className="rounded-xl border border-border/40 bg-card p-5 text-center relative overflow-hidden shadow-md">
            <div className="absolute top-0 right-0 p-3">
              <button 
                onClick={fetchRatioData}
                className="p-1.5 rounded-full hover:bg-muted/40 transition-colors text-muted-foreground active:scale-95"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
            
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Current Gold-to-Silver Ratio</p>
            <h2 className="text-4xl font-black text-foreground mt-1.5 tabular-nums">
              {currentRatio.toFixed(2)}
            </h2>
            <p className="text-[10px] text-muted-foreground mt-1">
              It takes <span className="font-bold text-foreground">{currentRatio.toFixed(1)} ounces</span> of Silver to purchase 1 ounce of Gold.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border/20 pt-4 text-left">
              <div>
                <p className="text-[9px] text-muted-foreground uppercase font-bold">Gold Spot</p>
                <p className="text-sm font-bold text-amber-500 tabular-nums">${goldPrice.toLocaleString()}</p>
              </div>
              <div className="border-l border-border/20 pl-4">
                <p className="text-[9px] text-muted-foreground uppercase font-bold">Silver Spot</p>
                <p className="text-sm font-bold text-slate-300 tabular-nums">${silverPrice.toLocaleString()}</p>
              </div>
            </div>
          </section>

          {/* Historical Ratio Chart */}
          {ratioChartData.length > 0 && (
            <section className="rounded-xl border border-border/40 bg-card p-4 space-y-3 shadow-xs">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Historical Ratio (7 Days)
                </h3>
              </div>
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ratioChartData} margin={{ top: 2, right: 0, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="ratioGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="time"
                      tickFormatter={formatTime}
                      tick={{ fontSize: 9, fill: "oklch(0.556 0 0)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={["dataMin - 1", "dataMax + 1"]}
                      tick={{ fontSize: 9, fill: "oklch(0.556 0 0)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "oklch(0.205 0 0)",
                        border: "1px solid oklch(1 0 0 / 10%)",
                        borderRadius: "8px",
                        fontSize: "11px",
                      }}
                      labelFormatter={formatTime}
                      formatter={(v: any) => [v, "Ratio"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="ratio"
                      stroke="#D4AF37"
                      strokeWidth={2}
                      fill="url(#ratioGrad)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {/* Stacking signal alert */}
          <section className={`rounded-xl border p-4.5 shadow-sm text-left flex items-start gap-3 ${signal.color}`}>
            <Info className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                {signal.label}
              </h4>
              <p className="text-[10px] leading-relaxed mt-1">{signal.desc}</p>
            </div>
          </section>

          {/* Swap Conversion Calculator */}
          <section className="rounded-xl border border-border/40 bg-card p-4 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <ArrowRightLeft className="h-4 w-4 text-primary" />
              Arbitrage Swap Calculator
            </h3>

            <div className="grid grid-cols-2 gap-3.5">
              {/* Input metal box */}
              <div className="rounded-lg border border-border/30 bg-background/50 p-3 space-y-1.5">
                <label className="text-[9px] font-bold text-muted-foreground uppercase">Convert From</label>
                <div className="flex gap-2">
                  <select 
                    value={calcSource} 
                    onChange={(e) => setCalcSource(e.target.value as any)}
                    className="bg-transparent text-xs font-extrabold text-foreground outline-none cursor-pointer"
                  >
                    <option value="gold">Gold (oz)</option>
                    <option value="silver">Silver (oz)</option>
                  </select>
                  <input
                    type="number"
                    value={inputWeight}
                    onChange={(e) => setInputWeight(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full text-right text-xs font-bold bg-transparent outline-none tabular-nums"
                  />
                </div>
              </div>

              {/* Output metal box */}
              <div className="rounded-lg border border-border/30 bg-muted/20 p-3 space-y-1.5">
                <label className="text-[9px] font-bold text-muted-foreground uppercase">Equivalent Value</label>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold text-foreground uppercase">
                    {calcSource === "gold" ? "Silver (oz)" : "Gold (oz)"}
                  </span>
                  <span className="text-xs font-bold text-primary tabular-nums">
                    {outputWeight.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
