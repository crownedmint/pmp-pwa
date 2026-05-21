"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Trash2, 
  Plus, 
  Scale, 
  TrendingUp, 
  Percent, 
  Loader2, 
  Coins 
} from "lucide-react"

interface ScrapItem {
  id: string
  name: string
  metal: "gold" | "silver"
  weight: number
  weightUnit: "g" | "oz"
  purity: string // e.g. '14K', '10K', '.925'
}

export default function MultiScrapEstimatorPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [goldPrice, setGoldPrice] = useState(0)
  const [silverPrice, setSilverPrice] = useState(0)
  
  // Scrap item list state
  const [items, setItems] = useState<ScrapItem[]>([
    { id: "1", name: "14K Cuban Link Fragment", metal: "gold", weight: 14.5, weightUnit: "g", purity: "14K (58.3%)" },
    { id: "2", name: "Sterling Silver Spoon Set", metal: "silver", weight: 120.0, weightUnit: "g", purity: "Sterling (92.5%)" },
  ])

  // New item form state
  const [newName, setNewName] = useState("")
  const [newMetal, setNewMetal] = useState<"gold" | "silver">("gold")
  const [newWeight, setNewWeight] = useState("")
  const [newUnit, setNewUnit] = useState<"g" | "oz">("g")
  const [newPurity, setNewPurity] = useState("14K (58.3%)")

  // Dealer payout slider state
  const [payoutRate, setPayoutRate] = useState<number>(85) // default 85% payout

  const fetchSpotPrices = async () => {
    try {
      const res = await fetch("/api/prices")
      const json = await res.json()
      if (json.metals) {
        const gold = json.metals.find((m: any) => m.symbol === "XAU")?.price || 0
        const silver = json.metals.find((m: any) => m.symbol === "XAG")?.price || 0
        setGoldPrice(gold)
        setSilverPrice(silver)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSpotPrices()
  }, [])

  const purityFactors: Record<string, number> = {
    // Gold
    "10K (41.7%)": 0.417,
    "14K (58.3%)": 0.583,
    "18K (75.0%)": 0.750,
    "22K (91.7%)": 0.917,
    "24K (99.9%)": 0.999,
    // Silver
    "Sterling (92.5%)": 0.925,
    "Fine (99.9%)": 0.999
  }

  const purityOptions = {
    gold: ["10K (41.7%)", "14K (58.3%)", "18K (75.0%)", "22K (91.7%)", "24K (99.9%)"],
    silver: ["Sterling (92.5%)", "Fine (99.9%)"]
  }

  // Handle metal type toggle in form
  useEffect(() => {
    setNewPurity(purityOptions[newMetal][0])
  }, [newMetal])

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault()
    const weightNum = parseFloat(newWeight)
    if (!weightNum || weightNum <= 0) return

    const newItem: ScrapItem = {
      id: Math.random().toString(),
      name: newName.trim() || `${newPurity} Scrap Lot`,
      metal: newMetal,
      weight: weightNum,
      weightUnit: newUnit,
      purity: newPurity
    }

    setItems([...items, newItem])
    setNewName("")
    setNewWeight("")
  }

  const handleDeleteItem = (id: string) => {
    setItems(items.filter(i => i.id !== id))
  }

  // Calculate math
  const getItemMelt = (item: ScrapItem) => {
    const factor = purityFactors[item.purity] || 0
    let weightInOz = item.weight
    if (item.weightUnit === "g") {
      weightInOz = item.weight / 31.1034768 // Grams to Troy Ounce divisor
    }
    const spot = item.metal === "gold" ? goldPrice : silverPrice
    return weightInOz * factor * spot
  }

  const totalMeltValue = items.reduce((sum, item) => sum + getItemMelt(item), 0)
  const totalPayout = totalMeltValue * (payoutRate / 100)
  const dealerMargin = totalMeltValue - totalPayout

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(val)

  return (
    <div className="flex flex-col px-4 pb-24 max-w-lg mx-auto">
      <header className="flex items-center gap-3 pt-4 pb-3 border-b border-border/20 mb-4">
        <button onClick={() => router.back()} className="p-1 rounded-full text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold tracking-tight">Multi-Item Scrap Estimator</h1>
          <p className="text-[10px] text-muted-foreground">Estimate estate scrap jewelry & bullion layouts</p>
        </div>
      </header>

      {loading ? (
        <div className="flex h-[60vh] flex-col items-center justify-center text-xs text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
          Loading live spot calculations...
        </div>
      ) : (
        <div className="space-y-4">
          {/* Quick Spot Reference Card */}
          <section className="grid grid-cols-2 gap-3.5 rounded-xl border border-border/40 bg-card p-3 shadow-xs">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-500" />
              <div>
                <p className="text-[8px] text-muted-foreground font-bold uppercase">Gold Spot</p>
                <p className="text-xs font-bold tabular-nums">{formatCurrency(goldPrice)} /oz</p>
              </div>
            </div>
            <div className="flex items-center gap-2 border-l border-border/20 pl-4">
              <TrendingUp className="h-4 w-4 text-slate-300" />
              <div>
                <p className="text-[8px] text-muted-foreground font-bold uppercase">Silver Spot</p>
                <p className="text-xs font-bold tabular-nums">{formatCurrency(silverPrice)} /oz</p>
              </div>
            </div>
          </section>

          {/* Form to Add New Item */}
          <section className="rounded-xl border border-border/40 bg-card p-4 space-y-3.5 shadow-sm">
            <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Plus className="h-4 w-4 text-primary" />
              Add Scrap Item
            </h3>

            <form onSubmit={handleAddItem} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewMetal("gold")}
                  className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                    newMetal === "gold"
                      ? "border-amber-500 bg-amber-500/10 text-amber-500"
                      : "border-border/30 bg-background/50 text-muted-foreground"
                  }`}
                >
                  🥇 Gold
                </button>
                <button
                  type="button"
                  onClick={() => setNewMetal("silver")}
                  className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                    newMetal === "silver"
                      ? "border-slate-400 bg-slate-400/10 text-slate-400"
                      : "border-border/30 bg-background/50 text-muted-foreground"
                  }`}
                >
                  🥈 Silver
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-1">Item Label / Nickname</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Broken Ring, Chain"
                    className="w-full bg-background/50 border border-border/30 rounded-lg px-2.5 py-2 text-xs font-semibold outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-1">Purity Grade</label>
                  <select
                    value={newPurity}
                    onChange={(e) => setNewPurity(e.target.value)}
                    className="w-full bg-background/50 border border-border/30 rounded-lg px-2 py-2 text-xs font-semibold outline-none focus:border-primary text-foreground"
                  >
                    {purityOptions[newMetal].map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-1">Weight</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-background/50 border border-border/30 rounded-lg px-2.5 py-2 text-xs font-bold outline-none focus:border-primary text-foreground"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-1">Unit</label>
                  <select
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value as any)}
                    className="w-full bg-background/50 border border-border/30 rounded-lg px-2 py-2 text-xs font-semibold outline-none focus:border-primary text-foreground"
                  >
                    <option value="g">Grams (g)</option>
                    <option value="oz">Troy Oz (oz)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-black py-2.5 rounded-xl transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Add Item to Lot
              </button>
            </form>
          </section>

          {/* Active Items list */}
          <section className="rounded-xl border border-border/40 bg-card p-4 space-y-3 shadow-xs">
            <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-2">
              <Scale className="h-4 w-4 text-primary" />
              Scrap Lot items ({items.length})
            </h3>

            {items.length === 0 ? (
              <p className="text-[10px] text-muted-foreground text-center py-4">No items added yet. Use the form above to add scrap.</p>
            ) : (
              <div className="divide-y divide-border/20 space-y-2.5">
                {items.map((item, idx) => {
                  const melt = getItemMelt(item)
                  return (
                    <div key={item.id} className="flex justify-between items-center pt-2.5 first:pt-0 gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] rounded-sm bg-muted px-1 py-0.5 font-bold uppercase text-muted-foreground">
                            {item.metal}
                          </span>
                          <h4 className="text-xs font-bold text-foreground line-clamp-1">{item.name}</h4>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {item.weight} {item.weightUnit} @ {item.purity}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-xs font-extrabold text-foreground tabular-nums">{formatCurrency(melt)}</p>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 text-muted-foreground hover:text-red-400 active:scale-90 transition-all rounded-md"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* Dealer Payout Payout Rate slider */}
          {items.length > 0 && (
            <section className="rounded-xl border border-border/40 bg-card p-4 space-y-3 shadow-sm">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Percent className="h-4 w-4 text-primary" />
                  Dealer Payout Rate
                </h3>
                <span className="text-xs font-black text-primary tabular-nums">{payoutRate}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={payoutRate}
                onChange={(e) => setPayoutRate(parseInt(e.target.value))}
                className="w-full accent-primary h-1 bg-muted rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-[9px] text-muted-foreground leading-normal mt-1">
                Refiners & pawn shops typically pay between 60% and 90% of spot gold melt value. Adjust this slider to match your buyer's offer.
              </p>
            </section>
          )}

          {/* Melt Payout Calculations Footer Box */}
          {items.length > 0 && (
            <section className="rounded-xl border-2 border-primary bg-primary/5 p-4.5 space-y-3 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-primary to-amber-600" />
              
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] text-muted-foreground font-semibold">Total Spot Melt Value (100%):</p>
                  <p className="text-xs font-bold text-foreground/80 tabular-nums">{formatCurrency(totalMeltValue)}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[10px] text-muted-foreground font-semibold">Dealer Buy Margin ({100 - payoutRate}%):</p>
                  <p className="text-xs font-bold text-red-400 tabular-nums">{formatCurrency(dealerMargin)}</p>
                </div>
                <hr className="border-border/30 my-2" />
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[9px] font-black text-primary uppercase tracking-widest">Estimated Payout ({payoutRate}%)</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">Based on live index spot price</p>
                  </div>
                  <p className="text-xl font-black text-primary tabular-nums">{formatCurrency(totalPayout)}</p>
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
