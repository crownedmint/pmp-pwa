"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Bookmark, X, Trash2, RotateCcw, Share2, Info, ChevronDown } from "lucide-react"
import PageHeader from "@/components/page-header"

interface SpotPrices {
  XAU: number
  XAG: number
  XPT: number
  XPD: number
}

type MetalType = "gold" | "silver" | "platinum" | "palladium"

const METAL_CONFIG: Record<MetalType, {
  name: string
  symbol: string
  color: string
  apiSymbol: keyof SpotPrices
  karats: { label: string; purity: number }[]
}> = {
  gold: {
    name: "Gold", symbol: "Au", color: "#D4AF37", apiSymbol: "XAU",
    karats: [
      { label: "24 Karat (.9999)", purity: 0.9999 },
      { label: "22 Karat (.9167)", purity: 0.9167 },
      { label: "18 Karat (.750)", purity: 0.750 },
      { label: "14 Karat (.5833)", purity: 0.5833 },
      { label: "12 Karat (.500)", purity: 0.500 },
      { label: "10 Karat (.4167)", purity: 0.4167 },
      { label: "9 Karat (.375)", purity: 0.375 },
    ],
  },
  silver: {
    name: "Silver", symbol: "Ag", color: "#C0C0C0", apiSymbol: "XAG",
    karats: [
      { label: ".999 Fine Silver", purity: 0.999 },
      { label: ".925 Sterling Silver", purity: 0.925 },
      { label: ".900 Coin Silver", purity: 0.900 },
      { label: ".800 European Silver", purity: 0.800 },
      { label: ".500 Silver", purity: 0.500 },
    ],
  },
  platinum: {
    name: "Platinum", symbol: "Pt", color: "#E5E4E2", apiSymbol: "XPT",
    karats: [
      { label: ".999 Pure Platinum", purity: 0.999 },
      { label: ".950 Platinum", purity: 0.950 },
      { label: ".900 Platinum", purity: 0.900 },
      { label: ".850 Platinum", purity: 0.850 },
    ],
  },
  palladium: {
    name: "Palladium", symbol: "Pd", color: "#B8B8B8", apiSymbol: "XPD",
    karats: [
      { label: ".999 Pure Palladium", purity: 0.999 },
      { label: ".950 Palladium", purity: 0.950 },
      { label: ".500 Palladium", purity: 0.500 },
    ],
  },
}

const WEIGHT_UNITS = [
  { key: "ozt", label: "Troy Ounces (ozt)", toOzt: 1 },
  { key: "g", label: "Grams (g)", toOzt: 1 / 31.1034768 },
  { key: "kg", label: "Kilograms (kg)", toOzt: 1000 / 31.1034768 },
  { key: "dwt", label: "Pennyweights (dwt)", toOzt: 1 / 20 },
  { key: "oz", label: "Ounces (oz)", toOzt: 28.349523 / 31.1034768 },
  { key: "lb", label: "Pounds (lb)", toOzt: 453.59237 / 31.1034768 },
  { key: "gr", label: "Grains (gr)", toOzt: 1 / 480 },
  { key: "tola", label: "Tola", toOzt: 11.6638 / 31.1034768 },
] as const

type WeightUnitKey = typeof WEIGHT_UNITS[number]["key"]

const STORAGE_KEY = "pm_pro_saved_calcs"

interface SavedCalc {
  id: string
  title: string
  metal: MetalType
  spotPrice: number
  unit: WeightUnitKey
  weights: string[]
  payoutPct: number
  timestamp: number
}

export default function CalcPage() {
  const [metalTab, setMetalTab] = useState<MetalType | "saved">("gold")
  const [spotPriceInput, setSpotPriceInput] = useState("")
  const [baseSpotOzt, setBaseSpotOzt] = useState(0) // Spot price always stored per troy oz
  const [unit, setUnit] = useState<WeightUnitKey>("g")
  const [weights, setWeights] = useState<string[]>([])
  const [payoutPercent, setPayoutPercent] = useState(98)
  const [savedCalcs, setSavedCalcs] = useState<SavedCalc[]>([])
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [saveTitle, setSaveTitle] = useState("")
  const [loadingPrices, setLoadingPrices] = useState(true)

  const activeMetal = metalTab === "saved" ? "gold" : metalTab
  const config = METAL_CONFIG[activeMetal]
  const pendingCalcRef = useRef<SavedCalc | null>(null)
  const skipFetchRef = useRef(false)

  // Initialize weights array when metal changes
  useEffect(() => {
    if (metalTab !== "saved") {
      if (pendingCalcRef.current) {
        const calc = pendingCalcRef.current
        pendingCalcRef.current = null
        skipFetchRef.current = true
        setSpotPriceInput(calc.spotPrice.toFixed(2))
        setUnit(calc.unit)
        setPayoutPercent(calc.payoutPct)
        setWeights(calc.weights)
      } else {
        setWeights(new Array(METAL_CONFIG[metalTab].karats.length).fill(""))
      }
    }
  }, [metalTab])

  // Fetch prices
  const fetchPrices = useCallback(async (metal: MetalType, targetUnit?: WeightUnitKey) => {
    try {
      const res = await fetch("/api/prices")
      const data = await res.json()
      if (data.metals) {
        const symbol = METAL_CONFIG[metal].apiSymbol
        const found = data.metals.find((m: { symbol: string }) => m.symbol === symbol)
        if (found) {
          const priceOzt = found.price
          setBaseSpotOzt(priceOzt)
          const activeUnit = targetUnit || unit
          const uConfig = WEIGHT_UNITS.find(w => w.key === activeUnit)!
          setSpotPriceInput((priceOzt * uConfig.toOzt).toFixed(2))
        }
      }
    } catch (e) {
      console.error("Failed to load live spot price:", e)
    } finally {
      setLoadingPrices(false)
    }
  }, [unit])

  useEffect(() => {
    if (metalTab === "saved") return
    if (skipFetchRef.current) {
      skipFetchRef.current = false
      return
    }
    setLoadingPrices(true)
    fetchPrices(metalTab)
  }, [metalTab, fetchPrices])

  // Convert spot price when unit changes
  const handleUnitChange = (newUnit: WeightUnitKey) => {
    if (baseSpotOzt > 0) {
      const uConfig = WEIGHT_UNITS.find(u => u.key === newUnit)!
      setSpotPriceInput((baseSpotOzt * uConfig.toOzt).toFixed(2))
    }
    setUnit(newUnit)
  }

  // Load saved calculations
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        setSavedCalcs(JSON.parse(saved))
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  // Calculations
  const displaySpot = parseFloat(spotPriceInput) || 0
  const unitConfig = WEIGHT_UNITS.find(u => u.key === unit)!
  const spotPricePerOzt = unitConfig.toOzt > 0 ? displaySpot / unitConfig.toOzt : 0

  const lineItems = config.karats.map((k, i) => {
    const rawWeight = parseFloat(weights[i] || "0") || 0
    const oztWeight = rawWeight * unitConfig.toOzt
    const fineOzt = oztWeight * k.purity
    const estValue = fineOzt * spotPricePerOzt
    return { label: k.label, purity: k.purity, rawWeight, oztWeight, fineOzt, estValue }
  })

  const totalRawWeight = lineItems.reduce((s, l) => s + l.rawWeight, 0)
  const totalWeightOzt = lineItems.reduce((s, l) => s + l.oztWeight, 0)
  const totalFineOzt = lineItems.reduce((s, l) => s + l.fineOzt, 0)
  const totalMeltValue = lineItems.reduce((s, l) => s + l.estValue, 0)
  const payoutValue = totalMeltValue * (payoutPercent / 100)
  const estimatedProfit = totalMeltValue - payoutValue

  // Format currency
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(val)

  // Save calculation
  const handleSave = () => {
    if (!saveTitle.trim()) return
    const newCalc: SavedCalc = {
      id: Date.now().toString(),
      title: saveTitle.trim(),
      metal: activeMetal,
      spotPrice: displaySpot,
      unit,
      weights: [...weights],
      payoutPct: payoutPercent,
      timestamp: Date.now(),
    }
    const updated = [newCalc, ...savedCalcs]
    setSavedCalcs(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setSaveTitle("")
    setShowSaveModal(false)
  }

  // Load saved calc
  const handleLoad = (calc: SavedCalc) => {
    pendingCalcRef.current = calc
    setMetalTab(calc.metal)
  }

  // Delete saved calc
  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = savedCalcs.filter(c => c.id !== id)
    setSavedCalcs(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  // Share calculation
  const handleShare = () => {
    const uLabel = unitConfig.label
    let text = `Precious Metals Pro Valuation\nMetal: ${config.name}\nSpot Price: ${formatCurrency(displaySpot)} per ${unitConfig.key}\n\n`
    let hasItems = false
    lineItems.forEach(item => {
      if (item.rawWeight > 0) {
        hasItems = true
        text += `• ${item.rawWeight} ${unitConfig.key} of ${item.label}\n  Melt Value: ${formatCurrency(item.estValue)}\n`
      }
    })
    if (!hasItems) text += "No items added.\n"
    text += `\nTotal Weight: ${totalRawWeight.toFixed(2)} ${unitConfig.key}\nEst Fine Weight: ${totalFineOzt.toFixed(4)} ozt\n`
    text += `Dealer Payout (${payoutPercent}%): ${formatCurrency(payoutValue)}\n`
    text += `Est. Profit: ${formatCurrency(estimatedProfit)}\n\nCalculated via Precious Metals Pro`
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
      alert("Calculation details copied to clipboard!")
    }
  }

  const handleReset = () => {
    setWeights(new Array(config.karats.length).fill(""))
    setPayoutPercent(98)
    fetchPrices(activeMetal)
  }

  return (
    <div className="flex flex-col px-4 pb-24">
      <PageHeader 
        title="Scrap Calculator" 
        subtitle={metalTab === "saved" ? "Saved lots" : `Live ${config.name} spot: ${formatCurrency(displaySpot)}/${unit}`} 
      />

      {/* Navigation Tabs */}
      <div className="flex gap-1.5 overflow-x-auto py-2 scrollbar-none mb-3">
        {(["gold", "silver", "platinum", "palladium", "saved"] as const).map((tab) => {
          const isActive = metalTab === tab
          const tabColor = tab !== "saved" ? METAL_CONFIG[tab].color : "#888888"
          return (
            <button
              key={tab}
              onClick={() => setMetalTab(tab)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap active:scale-95 ${
                isActive
                  ? "text-black"
                  : "border-border/30 bg-card/60 text-muted-foreground"
              }`}
              style={isActive ? { backgroundColor: tabColor, borderColor: tabColor } : {}}
            >
              {tab}
            </button>
          )
        })}
      </div>

      {metalTab === "saved" ? (
        // Saved list
        <div className="space-y-3">
          {savedCalcs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Bookmark className="mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">No saved valuations</p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                Save a scrap calculation to view it here.
              </p>
            </div>
          ) : (
            savedCalcs.map((calc) => {
              const mCfg = METAL_CONFIG[calc.metal]
              const uCfg = WEIGHT_UNITS.find(u => u.key === calc.unit)!
              const wSum = calc.weights.reduce((sum, w) => sum + (parseFloat(w) || 0), 0)
              return (
                <div
                  key={calc.id}
                  onClick={() => handleLoad(calc)}
                  className="group relative rounded-xl border border-border/40 bg-card p-4 transition-all hover:border-primary/40 active:bg-accent/40 cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span 
                          className="rounded px-1.5 py-0.5 text-[10px] font-bold text-black"
                          style={{ backgroundColor: mCfg.color }}
                        >
                          {mCfg.symbol}
                        </span>
                        <h3 className="text-sm font-semibold">{calc.title}</h3>
                      </div>
                      <p className="text-[11px] text-muted-foreground/80 mt-1">
                        {wSum.toFixed(2)} {calc.unit} · {calc.payoutPct}% payout · Spot {formatCurrency(calc.spotPrice)}/{calc.unit}
                      </p>
                      <p className="text-[10px] text-muted-foreground/50 mt-1">
                        Saved {new Date(calc.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDelete(calc.id, e)}
                      className="rounded-full p-2 text-muted-foreground/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      ) : (
        // Live Calculator Screen
        <div className="space-y-4">
          
          {/* Controls Bar */}
          <div className="flex gap-2">
            {/* Spot Price Input */}
            <div className="flex-1 rounded-xl border border-border/40 bg-card/60 p-3">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Spot Price per unit
              </label>
              <div className="mt-1 flex items-center">
                <span className="text-sm font-bold text-muted-foreground mr-1">$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={spotPriceInput}
                  onChange={(e) => setSpotPriceInput(e.target.value)}
                  className="w-full bg-transparent text-sm font-bold text-foreground outline-none tabular-nums"
                  placeholder="Enter spot..."
                />
              </div>
            </div>

            {/* Weight Unit Picker */}
            <div className="w-[120px] rounded-xl border border-border/40 bg-card/60 p-3 flex flex-col justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Unit
              </label>
              <div className="relative mt-1 flex items-center">
                <select
                  value={unit}
                  onChange={(e) => handleUnitChange(e.target.value as WeightUnitKey)}
                  className="w-full bg-transparent text-xs font-bold text-foreground outline-none cursor-pointer pr-4 appearance-none"
                >
                  {WEIGHT_UNITS.map((u) => (
                    <option key={u.key} value={u.key} className="bg-background">
                      {u.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground absolute right-0 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Scrap Inputs Table */}
          <section className="rounded-xl border border-border/40 bg-card/40 p-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-primary mb-3">
              Weights Entry ({unit})
            </h2>
            <div className="divide-y divide-border/20">
              {config.karats.map((k, idx) => {
                const rawWeight = parseFloat(weights[idx] || "0") || 0
                const rowValue = rawWeight * unitConfig.toOzt * k.purity * spotPricePerOzt
                return (
                  <div key={k.label} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0 gap-4">
                    <div className="flex-1">
                      <span className="text-xs font-semibold text-foreground">{k.label}</span>
                      <p className="text-[10px] text-muted-foreground">Purity: {(k.purity * 100).toFixed(1)}%</p>
                    </div>
                    <div className="w-[100px] shrink-0">
                      <input
                        type="number"
                        inputMode="decimal"
                        value={weights[idx] || ""}
                        onChange={(e) => {
                          const next = [...weights]
                          next[idx] = e.target.value
                          setWeights(next)
                        }}
                        placeholder="0.0"
                        className="w-full rounded-lg border border-border/30 bg-background/50 px-3 py-1.5 text-right text-xs font-bold tabular-nums outline-none focus:border-primary"
                      />
                    </div>
                    <div className="w-[80px] shrink-0 text-right">
                      <span className="text-xs font-bold tabular-nums text-muted-foreground">
                        {rowValue > 0 ? formatCurrency(rowValue) : "$0.00"}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Dealer Payout % Spot slider */}
          <section className="rounded-xl border border-border/40 bg-card/60 p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Payout Percentage of Spot
              </label>
              <span className="text-xs font-extrabold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {payoutPercent}%
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="100"
              step="0.5"
              value={payoutPercent}
              onChange={(e) => setPayoutPercent(parseFloat(e.target.value))}
              className="w-full accent-primary h-1.5 bg-border/40 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[9px] font-bold text-muted-foreground/60 mt-1">
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </section>

          {/* Dealer's Buying Guide Card */}
          {totalRawWeight > 0 && (
            <section className="rounded-xl border border-primary/20 bg-primary/5 p-4 shadow-sm animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-widest mb-3">
                <Info className="h-3.5 w-3.5" />
                Dealer's Buying Guide
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-muted-foreground">Total Entered Weight</p>
                  <p className="text-sm font-bold mt-0.5 tabular-nums">
                    {totalRawWeight.toFixed(2)} {unit}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Est. Fine Gold Content</p>
                  <p className="text-sm font-bold mt-0.5 tabular-nums">
                    {totalFineOzt.toFixed(4)} ozt
                  </p>
                </div>
                <div className="col-span-2 border-t border-border/20 pt-2.5">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[11px] font-semibold text-muted-foreground">Full Melt Value:</span>
                    <span className="text-sm font-bold text-foreground tabular-nums">
                      {formatCurrency(totalMeltValue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline mt-1.5">
                    <span className="text-xs font-bold text-primary">Payout to Seller ({payoutPercent}%):</span>
                    <span className="text-lg font-black text-primary tabular-nums">
                      {formatCurrency(payoutValue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline mt-1 border-t border-dashed border-border/20 pt-1.5">
                    <span className="text-[11px] font-semibold text-emerald-400">Estimated Profit:</span>
                    <span className="text-sm font-extrabold text-emerald-400 tabular-nums">
                      {formatCurrency(estimatedProfit)} ({(100 - payoutPercent).toFixed(1)}% margin)
                    </span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Action Row */}
          {totalRawWeight > 0 && (
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleReset}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-border/40 bg-card py-3.5 text-xs font-bold text-muted-foreground transition-all active:scale-95"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-border/40 bg-card py-3.5 text-xs font-bold text-muted-foreground transition-all active:scale-95"
              >
                <Share2 className="h-3.5 w-3.5" />
                Share
              </button>
              <button
                onClick={() => {
                  setSaveTitle("")
                  setShowSaveModal(true)
                }}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-primary py-3.5 text-xs font-bold text-primary-foreground transition-all active:scale-95"
              >
                <Bookmark className="h-3.5 w-3.5" />
                Save Lot
              </button>
            </div>
          )}

        </div>
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-t-2xl border-t border-border/40 bg-background p-6 animate-in slide-in-from-bottom duration-300">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold">Save Calculation</h3>
              <button
                onClick={() => setShowSaveModal(false)}
                className="rounded-full p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick summary */}
            <div className="mb-4 rounded-xl bg-card p-4 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Metal:</span>
                <span className="font-bold text-foreground capitalize">{config.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total weight:</span>
                <span className="font-bold text-foreground">{totalRawWeight.toFixed(2)} {unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Seller Payout:</span>
                <span className="font-extrabold text-primary">{formatCurrency(payoutValue)}</span>
              </div>
            </div>

            {/* Lot Name Input */}
            <input
              type="text"
              autoFocus
              value={saveTitle}
              onChange={(e) => setSaveTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="e.g. John Doe 14K chains lot..."
              className="mb-4 w-full rounded-xl border border-border/40 bg-card px-4 py-3 text-sm font-medium text-foreground outline-none focus:border-primary"
            />

            <button
              onClick={handleSave}
              disabled={!saveTitle.trim()}
              className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-all active:scale-[0.98] disabled:opacity-40"
            >
              Confirm Save
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
