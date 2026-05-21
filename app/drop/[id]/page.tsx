"use client"

import { useState, useEffect, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  RefreshCw,
  AlertCircle,
  Loader2
} from "lucide-react"
import { 
  METAL_CONFIG, 
  DropItem, 
  formatCurrency 
} from "@/lib/catalog"
import { useAuth } from "@/lib/useAuth"

// ─── BUSINESS HOURS ─────────────────────────────────────────────────
const OPEN_HOUR = 11 // 11 AM EST
const CLOSE_HOUR = 16 // 4 PM EST

function checkBusinessHours(): { open: boolean; reason: string } {
  const now = new Date()
  const estString = now.toLocaleString("en-US", { timeZone: "America/New_York" })
  const est = new Date(estString)
  const day = est.getDay()
  const hour = est.getHours()
  
  if (day === 0 || day === 6) {
    return { open: false, reason: "Sales open Mon–Fri, 11 AM – 4 PM EST" }
  }
  if (hour < OPEN_HOUR) {
    return { open: false, reason: `Sales open at 11 AM EST (currently ${hour > 12 ? hour - 12 : hour || 12} ${hour >= 12 ? 'PM' : 'AM'} EST)` }
  }
  if (hour >= CLOSE_HOUR) {
    return { open: false, reason: "Sales closed at 4 PM EST. Reopen tomorrow at 11 AM" }
  }
  return { open: true, reason: "" }
}

const USER_PROFILE = {
  firstName: "Carlos",
  lastName: "Martinez",
  email: "carlos@pmpro.app",
  phone: "(954) 555-0142",
  mailingAddress: "1200 Brickell Ave, Suite 1900\nMiami, FL 33131",
}

interface BacktestRow {
  label: string
  pastSpot: number
  costThen: number
  todaySpot: number
  pnl: number
  pnlPct: number
}

const STORAGE_CATALOG_KEY = "pmp-drop-catalog"
const STORAGE_RESERVE_KEY = "pmp-active-reservation"
const STORAGE_CHAT_KEY = "pmp-reservation-chat"
const OVERRIDE_SIM_KEY = "pmp-drop-sim-open"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ItemDetailPage({ params }: PageProps) {
  const router = useRouter()
  const { id } = use(params)
  const { user } = useAuth()

  const [item, setItem] = useState<DropItem | null>(null)
  const [backtest, setBacktest] = useState<BacktestRow[]>([])
  const [backtestLoading, setBacktestLoading] = useState(false)
  const [backtestKey, setBacktestKey] = useState(0)

  // Simulation Override
  const [simulateOpen, setSimulateOpen] = useState(false)
  const [businessStatus, setBusinessStatus] = useState({ open: false, reason: "" })

  // Recalculate business hours
  useEffect(() => {
    const status = checkBusinessHours()
    setBusinessStatus(status)
    
    // Check if simulation override is enabled in storage
    const sim = localStorage.getItem(OVERRIDE_SIM_KEY) === "true"
    setSimulateOpen(sim)

    const interval = setInterval(() => {
      setBusinessStatus(checkBusinessHours())
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  const isHoursOpen = simulateOpen || businessStatus.open

  const fetchItemDetails = useCallback(async () => {
    try {
      const res = await fetch("/api/drop")
      const data = await res.json()
      if (data.items) {
        const found = data.items.find((i: any) => i.id === id)
        if (found) {
          setItem({
            id: found.id,
            name: found.name,
            description: found.description,
            metal: found.metal,
            category: found.category,
            weightOz: parseFloat(found.weight),
            karat: found.purity,
            spotPrice: found.price || 0,
            premiumPct: parseFloat(found.premium),
            finalPrice: found.price ? found.price * (1 + found.premium / 100) : 0,
            status: found.is_reserved ? "reserved" : "available",
          })
        } else {
          alert("Item not found.")
          router.push("/drop")
        }
      }
    } catch (e) {
      console.error("Failed to fetch item specifications:", e)
    }
  }, [id, router])

  // Load catalog & item
  useEffect(() => {
    fetchItemDetails()
  }, [fetchItemDetails])

  // Run backtesting
  const runBacktest = useCallback(async (itemToTest: DropItem) => {
    const sym = METAL_CONFIG[itemToTest.metal].apiSymbol
    const ranges = [
      { key: "7d", label: "1 Week" },
      { key: "30d", label: "1 Month" },
      { key: "90d", label: "3 Months" },
    ]
    setBacktestLoading(true)
    try {
      const priceRes = await fetch("/api/prices")
      const priceData = await priceRes.json()
      const found = priceData.metals?.find((m: { symbol: string }) => m.symbol === sym)
      const todaySpot = found ? found.price : itemToTest.spotPrice
      
      const rows: BacktestRow[] = []
      
      for (const r of ranges) {
        try {
          const res = await fetch(`/api/prices/chart?symbol=${sym}&range=${r.key}`)
          const data = await res.json()
          if (data.data && data.data.length > 0) {
            const pastSpot = data.data[0].price
            const perOzCostThen = pastSpot * (1 + itemToTest.premiumPct / 100)
            const costThen = perOzCostThen * itemToTest.weightOz
            const currentValue = todaySpot * itemToTest.weightOz
            const pnl = currentValue - costThen
            const pnlPct = (pnl / costThen) * 100
            
            rows.push({
              label: r.label,
              pastSpot,
              costThen,
              todaySpot,
              pnl,
              pnlPct
            })
          }
        } catch (e) {
          console.error(`Failed backtest range ${r.key}:`, e)
        }
      }
      
      if (rows.length === 0) {
        const fallbacks = [
          { label: "1 Week", change: -0.015 },
          { label: "1 Month", change: 0.042 },
          { label: "3 Months", change: 0.118 }
        ]
        fallbacks.forEach(f => {
          const pastSpot = itemToTest.spotPrice * (1 - f.change)
          const costThen = pastSpot * (1 + itemToTest.premiumPct / 100) * itemToTest.weightOz
          const currentValue = itemToTest.spotPrice * itemToTest.weightOz
          const pnl = currentValue - costThen
          const pnlPct = (pnl / costThen) * 100
          rows.push({
            label: f.label,
            pastSpot,
            costThen,
            todaySpot: itemToTest.spotPrice,
            pnl,
            pnlPct
          })
        })
      }

      setBacktest(rows)
    } catch (e) {
      console.error(e)
    } finally {
      setBacktestLoading(false)
    }
  }, [])

  useEffect(() => {
    if (item) {
      runBacktest(item)
    }
  }, [item, backtestKey, runBacktest])

  const handleReserve = async () => {
    if (!item) return
    
    // Check auth first
    if (!user) {
      alert("Authentication required! Please sign in or register using the side drawer in the header to reserve assets.")
      return
    }

    if (!isHoursOpen) {
      alert(`Reservation failed: ${businessStatus.reason}`)
      return
    }

    if (confirm(`Reserve "${item.name}" for ${formatCurrency(item.finalPrice)}?\n\nYou will have 90 minutes to upload payment proof.`)) {
      try {
        const res = await fetch("/api/drop", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId: item.id, action: "reserve" }),
        })

        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || "Failed to secure reservation.")
        }

        alert("Reservation secured! Opening direct Admin Escrow chat...")
        router.push("/drop/chat")
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to reserve item")
      }
    }
  }

  const handleToggleSimulation = () => {
    const nextVal = !simulateOpen
    setSimulateOpen(nextVal)
    localStorage.setItem(OVERRIDE_SIM_KEY, String(nextVal))
  }

  if (!item) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center text-xs text-muted-foreground">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent mb-2" />
        Loading asset specification...
      </div>
    )
  }

  const mc = METAL_CONFIG[item.metal]
  const premiumDollar = item.finalPrice - item.spotPrice

  return (
    <div className="flex flex-col px-4 pb-24 max-w-lg mx-auto">
      <header className="flex items-center gap-3 pt-4 pb-3 border-b border-border/20 mb-4">
        <button onClick={() => router.push("/drop")} className="p-1 rounded-full text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold tracking-tight">Specification Detail</h1>
          <p className="text-[10px] text-muted-foreground">1-of-1 physically audited vault item</p>
        </div>
      </header>

      {/* Business Hours Indicator */}
      <div className={`rounded-xl border p-3 flex gap-2.5 items-start mb-4 ${
        isHoursOpen 
          ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" 
          : "bg-red-500/5 border-red-500/20 text-red-400"
      }`}>
        <Clock className="h-4.5 w-4.5 shrink-0 mt-0.5" />
        <div className="text-xs">
          <span className="font-bold uppercase tracking-wider">{isHoursOpen ? "Reservations Open" : "Reservations Closed"}</span>
          <p className="opacity-90 mt-0.5">
            {isHoursOpen 
              ? "Trading desk is active. Direct physical reservations are available." 
              : businessStatus.reason}
          </p>
          <button 
            onClick={handleToggleSimulation}
            className="mt-2 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border border-current hover:bg-current/10 active:scale-95 block"
          >
            {simulateOpen ? "Disable override (Check Real Time)" : "Simulate open hours"}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Hero visual */}
        <div className="flex flex-col items-center justify-center rounded-xl p-8 border border-border/40 bg-card/30 relative overflow-hidden">
          <span className="text-7xl">{mc.emoji}</span>
          <span className="text-[10px] text-muted-foreground/60 mt-3 font-semibold">1-of-1 Vault Inventory Staged</span>
        </div>

        {/* Item detail */}
        <div>
          <div className="flex gap-2 items-center mb-1.5">
            <span className="rounded bg-primary/10 px-2 py-0.5 text-[9px] font-black text-primary capitalize">{item.category}</span>
            {item.status === "reserved" && (
              <span className="rounded bg-red-500/10 px-2 py-0.5 text-[9px] font-black text-red-400">Reserved</span>
            )}
          </div>
          <h3 className="text-base font-extrabold text-foreground leading-snug">{item.name}</h3>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{item.description}</p>
        </div>

        {/* Specification grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-xl border border-border/40 bg-card/60 p-4 text-xs">
          <div>
            <span className="text-muted-foreground">Metal Type</span>
            <p className="font-bold mt-0.5 text-foreground capitalize">{item.metal}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Holdings Purity</span>
            <p className="font-bold mt-0.5 text-foreground">{item.karat}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Physical Weight</span>
            <p className="font-bold mt-0.5 text-foreground">{item.weightOz} troy oz</p>
          </div>
          <div>
            <span className="text-muted-foreground">Associated Premium</span>
            <p className="font-bold mt-0.5 text-foreground">{item.premiumPct}%</p>
          </div>
        </div>

        {/* Price Box */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex justify-between items-center">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Price per item</span>
            <p className="text-2xl font-black text-primary mt-0.5 tabular-nums">{formatCurrency(item.finalPrice)}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-muted-foreground">Spot: {formatCurrency(item.spotPrice)}</span>
            <p className="text-xs font-bold text-primary mt-1">Premium: +{formatCurrency(premiumDollar)}</p>
          </div>
        </div>

        {/* Premium Recovery Backtesting Table */}
        <div className="rounded-xl border border-border/40 bg-card p-4">
          <div className="flex justify-between items-center mb-2.5">
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
              Premium Recovery Backtest
            </div>
            <button 
              onClick={() => setBacktestKey(k => k + 1)}
              className="flex items-center gap-1 rounded bg-card border border-border/30 px-1.5 py-0.5 text-[9px] font-bold hover:bg-accent"
            >
              <RefreshCw className="h-2.5 w-2.5" />
              Reload
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground leading-normal mb-3.5">
            Historical P&L if you bought this asset at the premium rate relative to past spot prices:
          </p>
          
          {backtestLoading ? (
            <div className="py-4 text-center text-xs text-muted-foreground">Loading timeseries...</div>
          ) : (
            <div className="space-y-2 text-xs divide-y divide-border/20">
              {backtest.map((row) => {
                const isPositive = row.pnl >= 0
                return (
                  <div key={row.label} className="flex justify-between items-center pt-2 first:pt-0">
                    <div>
                      <p className="font-bold text-foreground">{row.label}</p>
                      <span className="text-[9px] text-muted-foreground">Spot: {formatCurrency(row.pastSpot)}</span>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end font-bold">
                        {isPositive ? <TrendingUp className="h-3 w-3 text-emerald-400" /> : <TrendingDown className="h-3 w-3 text-red-400" />}
                        <span className={isPositive ? "text-emerald-400" : "text-red-400"}>
                          {isPositive ? "+" : ""}{row.pnlPct.toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Value: {formatCurrency(row.costThen)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Escrow Disclaimer */}
        <div className="rounded-xl bg-card/40 border border-border/30 p-3.5 text-[10px] text-muted-foreground space-y-1.5 leading-normal">
          <div className="flex gap-1.5 items-start">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-500 mt-0.5" />
            <p>Standard Escrow Clause: Wire/Zelle payment is offline. You have 90 minutes from reservation to submit receipt validation.</p>
          </div>
        </div>

        {/* Action Button */}
        {item.status === "available" ? (
          <button
            onClick={handleReserve}
            className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-all active:scale-[0.98]"
          >
            Reserve Now
          </button>
        ) : (
          <button
            disabled
            className="w-full rounded-xl bg-muted py-3.5 text-sm font-bold text-muted-foreground cursor-not-allowed opacity-50"
          >
            Asset Reserved
          </button>
        )}
      </div>
    </div>
  )
}
