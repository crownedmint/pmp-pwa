"use client"

import { useState, useMemo, useEffect, useRef, Suspense, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { 
  ShoppingBag, 
  Search, 
  X, 
  Clock, 
  Send,
  ShieldCheck,
  Loader2
} from "lucide-react"
import PageHeader from "@/components/page-header"
import { 
  METAL_CONFIG, 
  CATEGORIES, 
  formatCurrency, 
  DropItem, 
  MetalType, 
  ItemCategory 
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
}

interface ChatMessage {
  id: string
  sender: "system" | "admin" | "user"
  text: string
  timestamp: Date
}

const MOCK_PAST_PURCHASES = [
  { id: "p1", name: "1oz Gold Buffalo (2024)", date: "Oct 12, 2025", status: "Secured", finalPrice: 2380.00, metal: "gold", category: "coin" },
  { id: "p2", name: "10oz Silver Bar — RCM", date: "Sep 28, 2025", status: "Shipped", finalPrice: 290.50, metal: "silver", category: "bar" },
  { id: "p3", name: "1/4oz Gold Krugerrand (1980)", date: "Aug 04, 2025", status: "Secured", finalPrice: 595.20, metal: "gold", category: "coin" },
]

const STORAGE_CATALOG_KEY = "pmp-drop-catalog"
const STORAGE_RESERVE_KEY = "pmp-active-reservation"
const STORAGE_CHAT_KEY = "pmp-reservation-chat"
const OVERRIDE_SIM_KEY = "pmp-drop-sim-open"

function DropPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  const [dropView, setDropView] = useState<"catalog" | "activity">("catalog")
  const [catalog, setCatalog] = useState<DropItem[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [filterMetal, setFilterMetal] = useState<MetalType | "all">("all")
  const [filterCat, setFilterCat] = useState<ItemCategory | "all">("all")
  const [sortBy, setSortBy] = useState<"price-asc" | "price-desc" | "weight" | "premium">("price-desc")
  const [showAvailableOnly, setShowAvailableOnly] = useState(true)

  // Simulation Override
  const [simulateOpen, setSimulateOpen] = useState(false)
  const [businessStatus, setBusinessStatus] = useState({ open: false, reason: "" })

  // Active Reservation
  const [chatItem, setChatItem] = useState<DropItem | null>(null)
  const [reserveSeconds, setReserveSeconds] = useState(0)
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Handle active view tab from query parameters
  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab === "activity") {
      setDropView("activity")
    }
  }, [searchParams])

  // Recalculate business hours
  useEffect(() => {
    const status = checkBusinessHours()
    setBusinessStatus(status)

    const sim = localStorage.getItem(OVERRIDE_SIM_KEY) === "true"
    setSimulateOpen(sim)

    const interval = setInterval(() => {
      setBusinessStatus(checkBusinessHours())
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  const isHoursOpen = simulateOpen || businessStatus.open

  const fetchCatalog = useCallback(async () => {
    try {
      const res = await fetch("/api/drop")
      const data = await res.json()
      if (data.items) {
        // Map database schema to catalog component expectations
        const mappedItems: DropItem[] = data.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          metal: item.metal,
          category: item.category,
          weightOz: item.weight,
          karat: item.purity,
          spotPrice: item.price || 0,
          premiumPct: item.premium,
          finalPrice: item.price ? item.price * (1 + item.premium / 100) : 0,
          status: item.is_reserved ? "reserved" : "available",
          reservedBy: item.reservedBy,
          expiredAt: item.expiredAt,
        }))
        setCatalog(mappedItems)

        // Check if current user has an active reservation
        if (user) {
          const userRes = mappedItems.find(i => i.reservedBy === user.id && i.status === "reserved")
          if (userRes && userRes.expiredAt) {
            const exp = new Date(userRes.expiredAt).getTime()
            const diff = Math.floor((exp - Date.now()) / 1000)
            if (diff > 0) {
              setChatItem(userRes)
              setReserveSeconds(diff)
            } else {
              setChatItem(null)
              setReserveSeconds(0)
            }
          } else {
            setChatItem(null)
            setReserveSeconds(0)
          }
        } else {
          setChatItem(null)
          setReserveSeconds(0)
        }
      }
    } catch (err) {
      console.error("Failed to load catalog:", err)
    } finally {
      setCatalogLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchCatalog()
  }, [fetchCatalog])

  // Timer countdown
  useEffect(() => {
    if (reserveSeconds > 0 && chatItem) {
      timerRef.current = setInterval(() => {
        setReserveSeconds(s => {
          if (s <= 1) {
            if (timerRef.current) clearInterval(timerRef.current)
            fetchCatalog()
            return 0
          }
          return s - 1
        })
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [reserveSeconds, chatItem, fetchCatalog])

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, "0")}`
  }

  const handleToggleSimulation = () => {
    const nextVal = !simulateOpen
    setSimulateOpen(nextVal)
    localStorage.setItem(OVERRIDE_SIM_KEY, String(nextVal))
  }

  // Filter Catalog
  const filteredCatalog = useMemo(() => {
    let list = [...catalog]
    if (showAvailableOnly) {
      list = list.filter(i => i.status === "available")
    }
    if (filterMetal !== "all") {
      list = list.filter(i => i.metal === filterMetal)
    }
    if (filterCat !== "all") {
      list = list.filter(i => i.category === filterCat)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(i => 
        i.name.toLowerCase().includes(q) || 
        i.description.toLowerCase().includes(q)
      )
    }
    
    list.sort((a, b) => {
      if (sortBy === "price-asc") return a.finalPrice - b.finalPrice
      if (sortBy === "price-desc") return b.finalPrice - a.finalPrice
      if (sortBy === "weight") return b.weightOz - a.weightOz
      return a.premiumPct - b.premiumPct
    })

    return list
  }, [catalog, searchQuery, filterMetal, filterCat, sortBy, showAvailableOnly])

  const totalValueAvailable = useMemo(() => {
    return catalog.filter(i => i.status === "available").reduce((s, i) => s + i.finalPrice, 0)
  }, [catalog])

  return (
    <div className="flex flex-col px-4 pb-24">
      <PageHeader title="The Drop" subtitle="Scaffolded Live Physical Inventory" />

      {/* Catalog toggle & Stats */}
      <div className="flex w-full rounded-xl bg-card border border-border/40 p-1 mb-4">
        <button
          onClick={() => setDropView("catalog")}
          className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all active:scale-[0.98] ${
            dropView === "catalog"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Live Catalog
        </button>
        <button
          onClick={() => setDropView("activity")}
          className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all active:scale-[0.98] ${
            dropView === "activity"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          My Activity
          {chatItem && (
            <span className="ml-1.5 h-2 w-2 rounded-full bg-red-500 inline-block align-middle animate-pulse" />
          )}
        </button>
      </div>

      {dropView === "catalog" ? (
        catalogLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-xs text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
            Synchronizing live catalog holdings...
          </div>
        ) : (
          // CATALOG VIEW
          <div className="space-y-4">
          
          {/* Business hours banner */}
          <div className={`rounded-xl border p-3 flex gap-2.5 items-start ${
            isHoursOpen 
              ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" 
              : "bg-red-500/5 border-red-500/20 text-red-400"
          }`}>
            <Clock className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold uppercase tracking-wider">{isHoursOpen ? "Reservations Open" : "Reservations Closed"}</span>
              <p className="opacity-90 mt-0.5">
                {isHoursOpen 
                  ? "Standard trading operations are active. You can reserve vault inventory offline." 
                  : businessStatus.reason || "Sales closed. Open Mon-Fri 11 AM - 4 PM EST"}
              </p>
              <button 
                onClick={handleToggleSimulation}
                className="mt-2 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border border-current hover:bg-current/10 active:scale-95 block"
              >
                {simulateOpen ? "Disable override (Check Real Time)" : "Simulate open hours"}
              </button>
            </div>
          </div>

          {/* Header statistics bubbles */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-border/40 bg-card/60 p-3">
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Available Assets</span>
              <p className="text-lg font-bold mt-0.5 text-foreground">{catalog.filter(c => c.status === "available").length} items</p>
            </div>
            <div className="rounded-xl border border-border/40 bg-card/60 p-3">
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Catalog Value</span>
              <p className="text-lg font-bold mt-0.5 text-foreground">{formatCurrency(totalValueAvailable)}</p>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex gap-2 items-center rounded-xl border border-border/40 bg-card/60 px-3.5 py-2.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search collectible catalog..."
              className="w-full bg-transparent text-xs font-semibold outline-none placeholder:text-muted-foreground/60"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Metal Filter Pills */}
          <div className="flex gap-1.5 overflow-x-auto py-1 scrollbar-none">
            <button
              onClick={() => setFilterMetal("all")}
              className={`rounded-lg border px-3 py-1 text-xs font-semibold whitespace-nowrap active:scale-95 ${
                filterMetal === "all"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/30 bg-card/60 text-muted-foreground"
              }`}
            >
              All Metals
            </button>
            {Object.keys(METAL_CONFIG).map((k) => {
              const cfg = METAL_CONFIG[k as MetalType]
              return (
                <button
                  key={k}
                  onClick={() => setFilterMetal(k as MetalType)}
                  className={`rounded-lg border px-3 py-1 text-xs font-semibold whitespace-nowrap active:scale-95 flex items-center gap-1 ${
                    filterMetal === k
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/30 bg-card/60 text-muted-foreground"
                  }`}
                >
                  <span>{cfg.emoji}</span>
                  {cfg.label}
                </button>
              )
            })}
          </div>

          {/* Category Filter Pills & Sort Options */}
          <div className="flex gap-1.5 items-center justify-between overflow-x-auto py-1 scrollbar-none">
            <div className="flex gap-1.5">
              <button
                onClick={() => setFilterCat("all")}
                className={`rounded-lg border px-3 py-1 text-xs font-semibold whitespace-nowrap active:scale-95 ${
                  filterCat === "all"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/30 bg-card/60 text-muted-foreground"
                }`}
              >
                All Categories
              </button>
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setFilterCat(c.key)}
                  className={`rounded-lg border px-3 py-1 text-xs font-semibold whitespace-nowrap active:scale-95 ${
                    filterCat === c.key
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/30 bg-card/60 text-muted-foreground"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 border border-border/30 rounded-lg p-0.5 bg-card/40 shrink-0">
              {(["price-asc", "price-desc", "weight", "premium"] as const).map(opt => (
                <button
                  key={opt}
                  onClick={() => setSortBy(opt)}
                  className={`px-1.5 py-0.5 text-[8px] font-black rounded uppercase transition-all ${
                    sortBy === opt
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {opt === "price-asc" ? "Price ↑" : opt === "price-desc" ? "Price ↓" : opt}
                </button>
              ))}
            </div>
          </div>

          {/* Available check */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="availOnly"
              checked={showAvailableOnly}
              onChange={(e) => setShowAvailableOnly(e.target.checked)}
              className="accent-primary"
            />
            <label htmlFor="availOnly" className="text-xs font-bold text-muted-foreground cursor-pointer select-none">
              Hide Reserved Items ({catalog.filter(i => i.status === "reserved").length} items hidden)
            </label>
          </div>

          {/* Catalog Grid */}
          {filteredCatalog.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border/30 rounded-2xl">
              <ShoppingBag className="h-10 w-10 text-muted-foreground/30 mb-2" />
              <p className="text-sm font-semibold text-muted-foreground">No items match filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredCatalog.map((item) => {
                const cfg = METAL_CONFIG[item.metal]
                return (
                  <div
                    key={item.id}
                    onClick={() => router.push(`/drop/${item.id}`)}
                    className="group relative rounded-xl border border-border/40 bg-card p-3 cursor-pointer transition-all hover:border-primary/45 hover:bg-card/90 active:scale-[0.98] flex flex-col justify-between"
                  >
                    {/* Metal Emoji and type badge */}
                    <div className="flex aspect-square items-center justify-center rounded-lg bg-background/50 border border-border/20 relative">
                      <span className="text-4xl">{cfg.emoji}</span>
                      <span className="absolute bottom-2 left-2 rounded px-1.5 py-0.5 text-[8px] font-black text-black bg-primary uppercase">
                        {item.category}
                      </span>
                      {item.status === "reserved" && (
                        <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
                          <span className="rounded bg-red-500 px-2 py-0.5 text-[9px] font-black text-white">RESERVED</span>
                        </div>
                      )}
                      
                      <span 
                        className="absolute top-2 right-2 rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                        style={{ backgroundColor: cfg.color + '20', color: cfg.color }}
                      >
                        +{item.premiumPct}%
                      </span>
                    </div>

                    <div className="mt-3 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-extrabold text-foreground leading-tight line-clamp-2">{item.name}</h4>
                        <p className="text-[10px] text-muted-foreground mt-1 font-semibold">
                          {item.weightOz} oz · {item.karat}
                        </p>
                      </div>
                      <div className="mt-2.5">
                        <p className="text-sm font-extrabold text-foreground tabular-nums">{formatCurrency(item.finalPrice)}</p>
                        <p className="text-[9px] text-muted-foreground/60 tabular-nums">Spot: {formatCurrency(item.spotPrice)}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

        </div>
      )
      ) : (
        // MY ACTIVITY VIEW
        <div className="space-y-4">
          
          {/* Active Reservations Section */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-2.5">Active Reservations</h3>
            {chatItem && reserveSeconds > 0 ? (
              <div 
                onClick={() => router.push("/drop/chat")}
                className="rounded-xl border border-primary/20 bg-primary/5 p-4 cursor-pointer transition-all hover:bg-primary/10 active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl shrink-0">{METAL_CONFIG[chatItem.metal].emoji}</span>
                    <div>
                      <h4 className="text-sm font-bold text-foreground leading-tight line-clamp-1">{chatItem.name}</h4>
                      <p className="text-[10px] text-muted-foreground mt-1">Pending payment verification</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-extrabold text-foreground">{formatCurrency(chatItem.finalPrice)}</p>
                    <div className="mt-1 flex items-center justify-end gap-1 text-[10px] font-bold text-red-400">
                      <Clock className="h-3 w-3 shrink-0" />
                      <span>{formatTimer(reserveSeconds)}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3.5 border-t border-border/20 pt-2.5 flex items-center justify-between text-[10px] font-bold text-primary">
                  <span>Open transaction chat with Admin desk</span>
                  <span>➔</span>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border/30 bg-card/20 p-8 text-center">
                <p className="text-xs text-muted-foreground">No active reservations.</p>
              </div>
            )}
          </div>

          {/* Past Transactions Section */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-2.5">Past Purchases</h3>
            <div className="space-y-2.5">
              {MOCK_PAST_PURCHASES.map(p => {
                const cfg = METAL_CONFIG[p.metal as MetalType]
                return (
                  <div key={p.id} className="rounded-xl border border-border/40 bg-card p-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl shrink-0">{cfg.emoji}</span>
                      <div>
                        <h4 className="text-xs font-extrabold text-foreground leading-tight line-clamp-1">{p.name}</h4>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">{p.date}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-extrabold text-foreground">{formatCurrency(p.finalPrice)}</p>
                      <span className={`inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        p.status === "Secured" ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"
                      }`}>
                        {p.status}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

export default function DropPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[80vh] flex-col items-center justify-center text-xs text-muted-foreground">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent mb-2" />
        Loading physical inventory catalog...
      </div>
    }>
      <DropPageContent />
    </Suspense>
  )
}
