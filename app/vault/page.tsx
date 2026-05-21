"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  Plus, 
  Trash2, 
  Archive, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Info, 
  Image as ImageIcon,
  CheckCircle,
  X,
  ChevronDown,
  Loader2,
  Lock,
  Mail,
  User
} from "lucide-react"
import PageHeader from "@/components/page-header"
import { useAuth } from "@/lib/useAuth"

type MetalType = "gold" | "silver" | "platinum" | "palladium"
type CategoryType = "coin" | "bar" | "round" | "jewelry" | "scrap"
type VaultTab = "portfolio" | "archive" | "goals"

const METALS: { key: MetalType; name: string; color: string; apiSymbol: string }[] = [
  { key: "gold", name: "Gold", color: "#D4AF37", apiSymbol: "XAU" },
  { key: "silver", name: "Silver", color: "#C0C0C0", apiSymbol: "XAG" },
  { key: "platinum", name: "Platinum", color: "#E5E4E2", apiSymbol: "XPT" },
  { key: "palladium", name: "Palladium", color: "#B8B8B8", apiSymbol: "XPD" },
]

const CATEGORIES: { key: CategoryType; label: string }[] = [
  { key: "coin", label: "Coin" },
  { key: "bar", label: "Bar" },
  { key: "round", label: "Round" },
  { key: "jewelry", label: "Jewelry" },
  { key: "scrap", label: "Scrap" },
]

const PURITY_OPTIONS: Record<MetalType, { label: string; value: number }[]> = {
  gold: [
    { label: "24K (.9999)", value: 0.9999 },
    { label: "22K (.916)", value: 0.9167 },
    { label: "18K (.750)", value: 0.750 },
    { label: "14K (.583)", value: 0.5833 },
    { label: "10K (.417)", value: 0.4167 },
    { label: "9K (.375)", value: 0.375 },
  ],
  silver: [
    { label: ".999 Fine Silver", value: 0.999 },
    { label: ".925 Sterling Silver", value: 0.925 },
    { label: ".900 Coin Silver", value: 0.900 },
    { label: ".800 Silver", value: 0.800 },
  ],
  platinum: [
    { label: ".999 Pure Platinum", value: 0.999 },
    { label: ".950 Platinum", value: 0.950 },
    { label: ".900 Platinum", value: 0.900 },
  ],
  palladium: [
    { label: ".999 Pure Palladium", value: 0.999 },
    { label: ".950 Palladium", value: 0.950 },
    { label: ".500 Palladium", value: 0.500 },
  ],
}

const WEIGHT_UNITS = [
  { key: "ozt", label: "Troy Oz", toOzt: 1 },
  { key: "g", label: "Grams", toOzt: 1 / 31.1034768 },
  { key: "kg", label: "Kilograms", toOzt: 1000 / 31.1034768 },
  { key: "dwt", label: "Pennyweights", toOzt: 1 / 20 },
  { key: "oz", label: "Avoirdupois Oz", toOzt: 28.349523 / 31.1034768 },
  { key: "lb", label: "Pounds", toOzt: 453.59237 / 31.1034768 },
] as const

type WeightUnitKey = typeof WEIGHT_UNITS[number]["key"]

interface VaultItem {
  id: string
  title: string
  description: string
  imageUri: string | null // base64 string
  metal: MetalType
  category: CategoryType
  weight: number
  weightUnit: WeightUnitKey
  purity: number
  purchasePrice: number
  purchaseDate: string
  spotAtPurchase: number
  targetGrowth: { type: "percent" | "fixed"; value: number }
  archived: boolean
  archivedAt: number | null
  createdAt: number
}

const STORAGE_KEY = "pm_pro_vault_items"

export default function VaultPage() {
  const { user, loading, refresh } = useAuth()

  const [tab, setTab] = useState<VaultTab>("portfolio")
  const [items, setItems] = useState<VaultItem[]>([])
  const [loadingVault, setLoadingVault] = useState(true)

  // Goals State
  interface VaultGoal {
    id: string
    metal: MetalType
    targetWeight: number
    weightUnit: string
    targetDate: string | null
  }
  const [goals, setGoals] = useState<VaultGoal[]>([])
  const [loadingGoals, setLoadingGoals] = useState(true)
  const [showAddGoalModal, setShowAddGoalModal] = useState(false)
  const [gMetal, setGMetal] = useState<MetalType>("gold")
  const [gWeight, setGWeight] = useState("")
  const [gUnit, setGUnit] = useState("oz")
  const [gDate, setGDate] = useState("")

  // Auth Form State for Vault Page
  const [authMode, setAuthMode] = useState<"login" | "register">("login")
  const [authName, setAuthName] = useState("")
  const [authEmail, setAuthEmail] = useState("")
  const [authPassword, setAuthPassword] = useState("")
  const [authError, setAuthError] = useState("")
  const [submittingAuth, setSubmittingAuth] = useState(false)

  const [spotPrices, setSpotPrices] = useState<Record<MetalType, number>>({
    gold: 0,
    silver: 0,
    platinum: 0,
    palladium: 0,
  })
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<VaultItem | null>(null)
  
  // Filters & Sorting
  const [filterMetal, setFilterMetal] = useState<MetalType | "all">("all")
  const [filterCat, setFilterCat] = useState<CategoryType | "all">("all")
  const [sortBy, setSortBy] = useState<"date" | "value" | "gain">("date")

  // Target editing in detail modal
  const [editingTarget, setEditingTarget] = useState(false)
  const [editTargetType, setEditTargetType] = useState<"percent" | "fixed">("percent")
  const [editTargetVal, setEditTargetVal] = useState("")

  // Add Item form state
  const [fTitle, setFTitle] = useState("")
  const [fDesc, setFDesc] = useState("")
  const [fImage, setFImage] = useState<string | null>(null)
  const [fMetal, setFMetal] = useState<MetalType>("gold")
  const [fCat, setFCat] = useState<CategoryType>("coin")
  const [fWeight, setFWeight] = useState("")
  const [fUnit, setFUnit] = useState<WeightUnitKey>("ozt")
  const [fPurity, setFPurity] = useState(0.9999)
  const [fPrice, setFPrice] = useState("")
  const [fSpot, setFSpot] = useState("")
  const [fDate, setFDate] = useState("")
  const [fTargetType, setFTargetType] = useState<'percent' | 'fixed'>('percent')
  const [fTargetVal, setFTargetVal] = useState("")

  // Fetch Vault Items from DB
  const fetchVaultItems = useCallback(async () => {
    if (!user) return
    setLoadingVault(true)
    try {
      const res = await fetch("/api/vault")
      const data = await res.json()
      if (data.items) {
        const mapped: VaultItem[] = data.items.map((row: any) => ({
          id: String(row.id),
          title: row.title,
          description: row.description || "",
          imageUri: null,
          metal: row.metal,
          category: row.category,
          weight: parseFloat(row.weight),
          weightUnit: row.weightUnit,
          purity: parseFloat(row.purity),
          purchasePrice: parseFloat(row.purchasePrice),
          purchaseDate: row.purchaseDate,
          spotAtPurchase: parseFloat(row.purchaseSpotPrice),
          targetGrowth: {
            type: row.targetGrowthType || "percent",
            value: row.targetGrowth ? parseFloat(row.targetGrowth) : 0,
          },
          archived: row.isArchived,
          archivedAt: null,
          createdAt: new Date(row.createdAt).getTime(),
        }))
        setItems(mapped)
      }
    } catch (err) {
      console.error("Failed to load vault items:", err)
    } finally {
      setLoadingVault(false)
    }
  }, [user])

  // Load vault items
  useEffect(() => {
    if (user) {
      fetchVaultItems()
    }
  }, [user, fetchVaultItems])

  const fetchVaultGoals = useCallback(async () => {
    if (!user) return
    setLoadingGoals(true)
    try {
      const res = await fetch("/api/vault/goals")
      const data = await res.json()
      if (data.goals) {
        setGoals(data.goals)
      }
    } catch (err) {
      console.error("Failed to load goals:", err)
    } finally {
      setLoadingGoals(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchVaultGoals()
    }
  }, [user, fetchVaultGoals])

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    const weightVal = parseFloat(gWeight)
    if (!weightVal || weightVal <= 0) return

    try {
      const res = await fetch("/api/vault/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metal: gMetal,
          targetWeight: weightVal,
          weightUnit: gUnit,
          targetDate: gDate || null
        })
      })

      if (res.ok) {
        setShowAddGoalModal(false)
        setGWeight("")
        setGDate("")
        fetchVaultGoals()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteGoal = async (id: string) => {
    if (!confirm("Are you sure you want to delete this stacking goal?")) return
    try {
      const res = await fetch(`/api/vault/goals?id=${id}`, {
        method: "DELETE"
      })
      if (res.ok) {
        fetchVaultGoals()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const getStackedWeightByMetal = (metal: MetalType) => {
    return items
      .filter(item => item.metal === metal && !item.archived)
      .reduce((sum, item) => {
        const unitConfig = WEIGHT_UNITS.find(u => u.key === item.weightUnit)
        const toOzt = unitConfig ? unitConfig.toOzt : 1
        const weightInOzt = item.weight * toOzt
        const pureOzt = weightInOzt * item.purity
        return sum + pureOzt
      }, 0)
  }

  const getLivePremium = () => {
    const weightNum = parseFloat(fWeight)
    const priceNum = parseFloat(fPrice)
    const spotNum = parseFloat(fSpot)
    if (!weightNum || !priceNum || !spotNum || weightNum <= 0 || priceNum <= 0 || spotNum <= 0) {
      return null
    }

    const unitConfig = WEIGHT_UNITS.find(u => u.key === fUnit)
    const toOzt = unitConfig ? unitConfig.toOzt : 1
    const weightInOzt = weightNum * toOzt
    const pureOzt = weightInOzt * fPurity
    const meltVal = pureOzt * spotNum
    const premiumVal = priceNum - meltVal
    const premiumPct = (premiumVal / meltVal) * 100

    let rating = "High Premium"
    let color = "text-red-400 bg-red-500/10 border-red-500/20"
    if (premiumPct < 5) {
      rating = "Low Premium (Excellent Stack)"
      color = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    } else if (premiumPct <= 15) {
      rating = "Moderate Premium (Collectible / Standard)"
      color = "text-amber-400 bg-amber-500/10 border-amber-500/20"
    }

    return {
      meltValue: meltVal,
      premiumValue: premiumVal,
      premiumPercent: premiumPct,
      rating,
      color
    }
  }

  // Fetch current spot prices
  const fetchSpotPrices = useCallback(async () => {
    try {
      const res = await fetch("/api/prices")
      const data = await res.json()
      if (data.metals) {
        const prices: Record<MetalType, number> = {
          gold: 0,
          silver: 0,
          platinum: 0,
          palladium: 0,
        }
        data.metals.forEach((m: { symbol: string; price: number }) => {
          if (m.symbol === "XAU") prices.gold = m.price
          if (m.symbol === "XAG") prices.silver = m.price
          if (m.symbol === "XPT") prices.platinum = m.price
          if (m.symbol === "XPD") prices.palladium = m.price
        })
        setSpotPrices(prices)
      }
    } catch (e) {
      console.error("Failed to fetch prices:", e)
    }
  }, [])

  useEffect(() => {
    fetchSpotPrices()
  }, [fetchSpotPrices])

  // Auto-set spot price and purity in Add Item form when metal selection changes
  useEffect(() => {
    if (spotPrices[fMetal]) {
      setFSpot(spotPrices[fMetal].toFixed(2))
    }
    const purities = PURITY_OPTIONS[fMetal]
    if (purities && purities.length > 0) {
      setFPurity(purities[0].value)
    }
  }, [fMetal, spotPrices])

  // Calculations per item
  const getCurrentValue = (item: VaultItem): number => {
    const spotOzt = spotPrices[item.metal] || 0
    const unitConv = WEIGHT_UNITS.find(u => u.key === item.weightUnit)!.toOzt
    return item.weight * unitConv * item.purity * spotOzt
  }

  const getTargetPrice = (item: VaultItem): number => {
    if (item.targetGrowth.type === "percent") {
      return item.purchasePrice * (1 + item.targetGrowth.value / 100)
    }
    return item.targetGrowth.value
  }

  const isAtTarget = (item: VaultItem): boolean => {
    return getCurrentValue(item) >= getTargetPrice(item)
  }

  // Filter lists
  const activeItems = items.filter(i => !i.archived)
  const archivedItems = items.filter(i => i.archived)

  let displayItems = tab === "portfolio" ? activeItems : archivedItems
  if (filterMetal !== "all") displayItems = displayItems.filter(i => i.metal === filterMetal)
  if (filterCat !== "all") displayItems = displayItems.filter(i => i.category === filterCat)
  
  if (sortBy === "value") {
    displayItems = [...displayItems].sort((a, b) => getCurrentValue(b) - getCurrentValue(a))
  } else if (sortBy === "gain") {
    displayItems = [...displayItems].sort((a, b) => (getCurrentValue(b) - b.purchasePrice) - (getCurrentValue(a) - a.purchasePrice))
  } else {
    displayItems = [...displayItems].sort((a, b) => b.createdAt - a.createdAt)
  }

  // Summary Metrics
  const totalValue = activeItems.reduce((s, i) => s + getCurrentValue(i), 0)
  const totalInvested = activeItems.reduce((s, i) => s + i.purchasePrice, 0)
  const totalGain = totalValue - totalInvested
  const totalGainPct = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0
  const itemsAtTarget = activeItems.filter(isAtTarget).length

  // Metal Allocation Breakdown
  const metalBreakdown = METALS.map(m => {
    const metalItems = activeItems.filter(i => i.metal === m.key)
    const val = metalItems.reduce((s, i) => s + getCurrentValue(i), 0)
    return { ...m, value: val, pct: totalValue > 0 ? (val / totalValue) * 100 : 0 }
  }).filter(m => m.value > 0)

  // File Upload base64 parsing
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Add Item Submit
  const handleAddItem = async () => {
    if (!fTitle.trim() || !fWeight || !fPrice) {
      alert("Please fill in Title, Weight, and Purchase Price.")
      return
    }

    try {
      const res = await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: fTitle.trim(),
          description: fDesc.trim(),
          metal: fMetal,
          category: fCat,
          weight: parseFloat(fWeight) || 0,
          weightUnit: fUnit,
          purity: fPurity,
          purchasePrice: parseFloat(fPrice) || 0,
          purchaseSpotPrice: parseFloat(fSpot) || spotPrices[fMetal] || 0,
          purchaseDate: fDate || new Date().toISOString().split("T")[0],
          targetGrowth: parseFloat(fTargetVal) || 0,
          targetGrowthType: fTargetType,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to add item")
      }

      await fetchVaultItems()
      
      // Reset Form
      setFTitle("")
      setFDesc("")
      setFImage(null)
      setFWeight("")
      setFPrice("")
      setFTargetVal("")
      setShowAddModal(false)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to add vault item")
    }
  }

  // Delete Vault Item
  const handleDeleteItem = async (id: string) => {
    if (confirm("Are you sure you want to permanently delete this item?")) {
      try {
        const res = await fetch(`/api/vault?id=${id}`, {
          method: "DELETE",
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || "Failed to delete item")
        }

        await fetchVaultItems()
        setShowDetailModal(false)
        setSelectedItem(null)
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to delete vault item")
      }
    }
  }

  // Archive / Unarchive Vault Item
  const handleToggleArchive = async (item: VaultItem) => {
    try {
      const res = await fetch("/api/vault", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          isArchived: !item.archived,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to archive/unarchive item")
      }

      await fetchVaultItems()
      setShowDetailModal(false)
      setSelectedItem(null)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update item")
    }
  }

  // Update target details
  const handleSaveTarget = async () => {
    if (!selectedItem) return
    try {
      const res = await fetch("/api/vault", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedItem.id,
          targetGrowth: parseFloat(editTargetVal) || 0,
          targetGrowthType: editTargetType,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to update target details")
      }

      await fetchVaultItems()
      
      // Update selectedItem state in detail modal
      setSelectedItem({
        ...selectedItem,
        targetGrowth: {
          type: editTargetType,
          value: parseFloat(editTargetVal) || 0,
        },
      })
      setEditingTarget(false)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to save target")
    }
  }

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError("")
    setSubmittingAuth(true)

    try {
      const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register"
      const body = authMode === "login" 
        ? { email: authEmail, password: authPassword }
        : { name: authName, email: authEmail, password: authPassword }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed")
      }

      await refresh()
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setSubmittingAuth(false)
    }
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(val)

  if (loading) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center text-xs text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
        Authenticating vault ledger access...
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col px-4 pb-24 max-w-md mx-auto">
        <PageHeader title="Secure Vault Portfolio" subtitle="Synchronized physical assets database" />
        
        <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md p-6 mt-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-primary to-amber-600" />
          
          <div className="flex justify-center mb-6 mt-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary bg-primary/10 text-primary">
              <Lock className="h-8 w-8 animate-pulse" />
            </div>
          </div>

          <h2 className="text-base font-bold text-center tracking-tight text-foreground">Unlock Vault Portfolio</h2>
          <p className="text-xs text-muted-foreground text-center mt-1">Sign in or register below to track spot valuation, gains, and set growth alerts.</p>

          {/* Tab switches */}
          <div className="flex border-b border-border/20 mt-6 mb-5">
            <button
              onClick={() => { setAuthMode("login"); setAuthError(""); }}
              className={`flex-1 pb-2.5 text-xs font-bold transition-all border-b-2 ${
                authMode === "login" 
                  ? "border-primary text-foreground" 
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setAuthMode("register"); setAuthError(""); }}
              className={`flex-1 pb-2.5 text-xs font-bold transition-all border-b-2 ${
                authMode === "register" 
                  ? "border-primary text-foreground" 
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Register
            </button>
          </div>

          {authError && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-[10px] font-semibold text-red-400">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-3.5">
            {authMode === "register" && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Full Name</label>
                <div className="relative flex items-center rounded-xl border border-border/40 bg-card px-3 py-2.5 focus-within:border-primary/50">
                  <User className="absolute left-3.5 h-4 w-4 text-muted-foreground/60" />
                  <input
                    type="text"
                    required
                    placeholder="Carlos Martinez"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="w-full bg-transparent pl-7 text-xs font-semibold outline-none text-foreground placeholder:text-muted-foreground/40"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
              <div className="relative flex items-center rounded-xl border border-border/40 bg-card px-3 py-2.5 focus-within:border-primary/50">
                <Mail className="absolute left-3.5 h-4 w-4 text-muted-foreground/60" />
                <input
                  type="email"
                  required
                  placeholder="carlos@pmpro.app"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full bg-transparent pl-7 text-xs font-semibold outline-none text-foreground placeholder:text-muted-foreground/40"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Password</label>
              <div className="relative flex items-center rounded-xl border border-border/40 bg-card px-3 py-2.5 focus-within:border-primary/50">
                <Lock className="absolute left-3.5 h-4 w-4 text-muted-foreground/60" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full bg-transparent pl-7 text-xs font-semibold outline-none text-foreground placeholder:text-muted-foreground/40"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submittingAuth}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-xs font-black text-primary-foreground shadow-sm transition-all active:scale-[0.98] disabled:opacity-55 disabled:scale-100 mt-2"
            >
              {submittingAuth ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {authMode === "login" ? "Verifying..." : "Creating Account..."}
                </>
              ) : (
                authMode === "login" ? "Sign In to Vault" : "Create Account"
              )}
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (loadingVault) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center text-xs text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
        Synchronizing vault portfolio database...
      </div>
    )
  }

  return (
    <div className="flex flex-col px-4 pb-24">
      <PageHeader title="Vault Inventory" subtitle="Manage your precious metals portfolio" />

      {/* Tabs */}
      <div className="flex w-full rounded-xl bg-card/60 border border-border/40 p-1 mb-4">
        <button
          onClick={() => setTab("portfolio")}
          className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all active:scale-[0.98] ${
            tab === "portfolio"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Portfolio
        </button>
        <button
          onClick={() => setTab("goals")}
          className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all active:scale-[0.98] ${
            tab === "goals"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Goals
        </button>
        <button
          onClick={() => setTab("archive")}
          className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all active:scale-[0.98] ${
            tab === "archive"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Archive
        </button>
      </div>

      {tab === "portfolio" && (
        <>
          {/* Summary Stats Grid */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="rounded-xl border border-border/40 bg-card p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Portfolio Value</span>
              <p className="text-xl font-bold mt-0.5 tabular-nums text-foreground">{formatCurrency(totalValue)}</p>
            </div>
            <div className="rounded-xl border border-border/40 bg-card p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Invested Amount</span>
              <p className="text-xl font-bold mt-0.5 tabular-nums text-foreground">{formatCurrency(totalInvested)}</p>
            </div>
            <div className="rounded-xl border border-border/40 bg-card p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Gain / Loss</span>
              <p className={`text-xl font-bold mt-0.5 tabular-nums ${totalGain >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {totalGain >= 0 ? "+" : ""}{formatCurrency(totalGain)}
                <span className="text-xs font-medium ml-1">({totalGainPct.toFixed(1)}%)</span>
              </p>
            </div>
            <div className="rounded-xl border border-border/40 bg-card p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">At Growth Target</span>
              <p className="text-xl font-bold mt-0.5 text-primary">
                {itemsAtTarget} <span className="text-xs font-medium text-muted-foreground">/ {activeItems.length} items</span>
              </p>
            </div>
          </div>

          {/* Allocation stacked progress bar */}
          {metalBreakdown.length > 0 && (
            <div className="rounded-xl border border-border/40 bg-card p-4 mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2.5">Allocation by Metal</span>
              <div className="flex h-3 w-full rounded-full overflow-hidden bg-muted mb-3">
                {metalBreakdown.map(m => (
                  <div 
                    key={m.key} 
                    style={{ width: `${m.pct}%`, backgroundColor: m.color }}
                    title={`${m.name}: ${m.pct.toFixed(1)}%`}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {metalBreakdown.map(m => (
                  <div key={m.key} className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: m.color }} />
                    <span className="text-foreground capitalize">{m.name}</span>
                    <span>({m.pct.toFixed(1)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {tab !== "goals" && (
        <>
          {/* Filter and sorting row */}
          <div className="space-y-2 mb-4">
            {/* Metal Filters */}
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
              {METALS.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setFilterMetal(m.key)}
                  className={`rounded-lg border px-3 py-1 text-xs font-semibold whitespace-nowrap active:scale-95 ${
                    filterMetal === m.key
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/30 bg-card/60 text-muted-foreground"
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>

            {/* Category Filters + Sorting */}
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
                  All Types
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

              <div className="flex gap-1 items-center shrink-0 border border-border/30 rounded-lg p-0.5 bg-card/40">
                {(["date", "value", "gain"] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setSortBy(s)}
                    className={`px-2 py-0.5 text-[9px] font-bold rounded capitalize transition-all ${
                      sortBy === s
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Items list */}
          <div className="space-y-3">
            {displayItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 border border-dashed border-border/40 rounded-2xl bg-card/20 text-center">
                <p className="text-sm font-medium text-muted-foreground">No items found</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  {tab === "portfolio" ? "Click 'Add New Item' to start building your vault." : "No archived items."}
                </p>
              </div>
            ) : (
              displayItems.map((item) => {
                const val = getCurrentValue(item)
                const gain = val - item.purchasePrice
                const pct = item.purchasePrice > 0 ? (gain / item.purchasePrice) * 100 : 0
                const atTarget = isAtTarget(item)
                const mConfig = METALS.find(m => m.key === item.metal)!
                const uConfig = WEIGHT_UNITS.find(u => u.key === item.weightUnit)!

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedItem(item)
                      setEditTargetType(item.targetGrowth.type)
                      setEditTargetVal(item.targetGrowth.value.toString())
                      setEditingTarget(false)
                      setShowDetailModal(true)
                    }}
                    className="flex items-center gap-3 rounded-xl border border-border/40 bg-card p-3 transition-all hover:border-primary/45 hover:bg-card/90 active:scale-[0.99] cursor-pointer"
                  >
                    {item.imageUri ? (
                      <img src={item.imageUri} alt={item.title} className="h-12 w-12 rounded-lg object-cover bg-muted shrink-0" />
                    ) : (
                      <div 
                        className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-background/50 text-muted-foreground shrink-0"
                        style={{ borderColor: mConfig.color + '40' }}
                      >
                        <ImageIcon className="h-5 w-5 opacity-40" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-foreground truncate">{item.title}</h3>
                        {atTarget && <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span 
                          className="rounded px-1.5 py-0.5 text-[9px] font-bold text-black"
                          style={{ backgroundColor: mConfig.color }}
                        >
                          {mConfig.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase">{item.category}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground/75 mt-1 font-semibold">
                        {item.weight} {uConfig.label} · Purity {(item.purity * 100).toFixed(1)}%
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-foreground tabular-nums">{formatCurrency(val)}</p>
                      <p className={`text-[11px] font-semibold mt-0.5 tabular-nums ${gain >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {gain >= 0 ? "+" : ""}{pct.toFixed(1)}%
                      </p>
                      <p className="text-[9px] text-muted-foreground/60 mt-0.5">Paid {formatCurrency(item.purchasePrice)}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </>
      )}

      {tab === "goals" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-1">
            <div>
              <h3 className="text-sm font-bold text-foreground">Stacking Goals</h3>
              <p className="text-[9px] text-muted-foreground">Monitor aggregate metal weight holdings</p>
            </div>
            <button
              onClick={() => {
                setGWeight("")
                setGDate("")
                setShowAddGoalModal(true)
              }}
              className="rounded-xl bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 text-[10px] font-black uppercase active:scale-95 transition-all flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              New Goal
            </button>
          </div>

          {loadingGoals ? (
            <div className="flex h-40 flex-col items-center justify-center text-xs text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary mb-1.5" />
              Loading your stacking targets...
            </div>
          ) : goals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 border border-dashed border-border/40 rounded-2xl bg-card/20 text-center">
              <p className="text-xs font-semibold text-muted-foreground">No active stacking goals</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">
                Define target stack weights to track accumulation ratios.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {goals.map(goal => {
                const currentStacked = getStackedWeightByMetal(goal.metal)
                const pct = Math.min(100, goal.targetWeight > 0 ? (currentStacked / goal.targetWeight) * 100 : 0)
                const mConfig = METALS.find(m => m.key === goal.metal)!

                return (
                  <div key={goal.id} className="rounded-xl border border-border/40 bg-card p-4 space-y-3 shadow-xs relative">
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-red-400 active:scale-90 transition-all rounded-md"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>

                    <div className="flex items-center gap-2">
                      <span 
                        className="rounded px-1.5 py-0.5 text-[9px] font-black text-black capitalize"
                        style={{ backgroundColor: mConfig.color }}
                      >
                        {mConfig.name}
                      </span>
                      <h4 className="text-xs font-bold text-foreground">Stacking Target</h4>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                        <span>Stacked: {currentStacked.toFixed(2)} oz</span>
                        <span>Goal: {goal.targetWeight} {goal.weightUnit}</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ width: `${pct}%`, backgroundColor: mConfig.color }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[9px] font-semibold text-muted-foreground/75 pt-0.5">
                        <span>{pct.toFixed(1)}% Completed</span>
                        {goal.targetDate && (
                          <span>Target: {new Date(goal.targetDate).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Add Goal Modal */}
          {showAddGoalModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
              <div className="w-full max-w-sm rounded-2xl border border-border/40 bg-background p-5 animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-black uppercase tracking-wider">Set Stacking Target</h3>
                  <button onClick={() => setShowAddGoalModal(false)} className="rounded-full p-1 text-muted-foreground hover:text-foreground">
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>

                <form onSubmit={handleAddGoal} className="space-y-3.5">
                  <div>
                    <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-1">Precious Metal</label>
                    <select
                      value={gMetal}
                      onChange={(e) => setGMetal(e.target.value as MetalType)}
                      className="w-full rounded-xl border border-border/40 bg-card px-3 py-2.5 text-xs font-bold outline-none capitalize text-foreground"
                    >
                      {METALS.map(m => (
                        <option key={m.key} value={m.key} className="bg-background capitalize">{m.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-1">Target Weight</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={gWeight}
                        onChange={(e) => setGWeight(e.target.value)}
                        placeholder="e.g. 50"
                        className="w-full rounded-xl border border-border/40 bg-card px-3 py-2.5 text-xs font-bold outline-none text-foreground"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-1">Unit</label>
                      <select
                        value={gUnit}
                        onChange={(e) => setGUnit(e.target.value)}
                        className="w-full rounded-xl border border-border/40 bg-card px-2 py-2.5 text-xs font-bold outline-none text-foreground"
                      >
                        <option value="oz">Ounces (oz)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-1">Target Date (Optional)</label>
                    <input
                      type="date"
                      value={gDate}
                      onChange={(e) => setGDate(e.target.value)}
                      className="w-full rounded-xl border border-border/40 bg-card px-3 py-2 text-xs font-semibold outline-none text-foreground"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-black py-3 rounded-xl transition-all active:scale-[0.98] shadow-sm mt-2"
                  >
                    Confirm Goal
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Add Button */}
      {tab === "portfolio" && (
        <button
          onClick={() => {
            setFTitle("")
            setFDesc("")
            setFImage(null)
            setFWeight("")
            setFPrice("")
            setFTargetVal("")
            setFDate(new Date().toISOString().split("T")[0])
            setShowAddModal(true)
          }}
          className="fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg active:scale-90 transition-transform"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-border/40 bg-background p-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold">Add Vault Asset</h3>
              <button onClick={() => setShowAddModal(false)} className="rounded-full p-1 text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Image Input */}
              <div className="flex flex-col items-center justify-center border border-dashed border-border/40 rounded-xl p-4 bg-card/40">
                {fImage ? (
                  <div className="relative h-24 w-24">
                    <img src={fImage} alt="Preview" className="h-24 w-24 rounded-lg object-cover" />
                    <button 
                      onClick={() => setFImage(null)} 
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow-sm"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center cursor-pointer">
                    <ImageIcon className="h-8 w-8 text-muted-foreground opacity-60 mb-1" />
                    <span className="text-xs font-bold text-primary">Upload asset photo</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Asset Name</label>
                <input
                  type="text"
                  value={fTitle}
                  onChange={(e) => setFTitle(e.target.value)}
                  placeholder="e.g. 1oz Gold Eagle (2024)"
                  className="w-full rounded-xl border border-border/40 bg-card px-4 py-2.5 text-sm font-medium outline-none focus:border-primary"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Description</label>
                <textarea
                  value={fDesc}
                  onChange={(e) => setFDesc(e.target.value)}
                  placeholder="Additional lot details, mint marks, serials..."
                  className="w-full rounded-xl border border-border/40 bg-card px-4 py-2.5 text-sm font-medium outline-none focus:border-primary h-16 resize-none"
                />
              </div>

              {/* Metal & Category selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Metal</label>
                  <select
                    value={fMetal}
                    onChange={(e) => setFMetal(e.target.value as MetalType)}
                    className="w-full rounded-xl border border-border/40 bg-card px-3 py-2.5 text-sm font-bold outline-none capitalize"
                  >
                    {METALS.map(m => (
                      <option key={m.key} value={m.key} className="bg-background capitalize">{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Category</label>
                  <select
                    value={fCat}
                    onChange={(e) => setFCat(e.target.value as CategoryType)}
                    className="w-full rounded-xl border border-border/40 bg-card px-3 py-2.5 text-sm font-bold outline-none capitalize"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.key} value={c.key} className="bg-background capitalize">{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Weight, Unit, Purity */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Weight</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={fWeight}
                    onChange={(e) => setFWeight(e.target.value)}
                    placeholder="0.0"
                    className="w-full rounded-xl border border-border/40 bg-card px-3 py-2.5 text-sm font-bold outline-none"
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Unit</label>
                  <select
                    value={fUnit}
                    onChange={(e) => setFUnit(e.target.value as WeightUnitKey)}
                    className="w-full rounded-xl border border-border/40 bg-card px-2 py-2.5 text-xs font-bold outline-none"
                  >
                    {WEIGHT_UNITS.map(u => (
                      <option key={u.key} value={u.key} className="bg-background">{u.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Purity</label>
                  <select
                    value={fPurity}
                    onChange={(e) => setFPurity(parseFloat(e.target.value))}
                    className="w-full rounded-xl border border-border/40 bg-card px-2 py-2.5 text-xs font-bold outline-none"
                  >
                    {PURITY_OPTIONS[fMetal]?.map(p => (
                      <option key={p.value} value={p.value} className="bg-background">{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Purchase Details */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Purchase Price</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={fPrice}
                    onChange={(e) => setFPrice(e.target.value)}
                    placeholder="$0.00"
                    className="w-full rounded-xl border border-border/40 bg-card px-3 py-2.5 text-sm font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Spot at Purchase</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={fSpot}
                    onChange={(e) => setFSpot(e.target.value)}
                    placeholder="$0.00"
                    className="w-full rounded-xl border border-border/40 bg-card px-3 py-2.5 text-sm font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Purchase Date</label>
                  <input
                    type="date"
                    value={fDate}
                    onChange={(e) => setFDate(e.target.value)}
                    className="w-full rounded-xl border border-border/40 bg-card px-2 py-2.5 text-xs font-semibold outline-none"
                  />
                </div>
              </div>

              {/* Target Growth */}
              <div className="rounded-xl border border-border/40 bg-card/60 p-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">Growth Target</label>
                <div className="flex gap-2 items-center">
                  <select
                    value={fTargetType}
                    onChange={(e) => setFTargetType(e.target.value as 'percent' | 'fixed')}
                    className="rounded-lg border border-border/30 bg-background px-3 py-1.5 text-xs font-bold outline-none"
                  >
                    <option value="percent">% Growth</option>
                    <option value="fixed">Fixed Target Price ($)</option>
                  </select>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={fTargetVal}
                    onChange={(e) => setFTargetVal(e.target.value)}
                    placeholder={fTargetType === "percent" ? "e.g. 20 for +20%" : "e.g. 3500"}
                    className="flex-1 rounded-lg border border-border/30 bg-background px-3 py-1.5 text-xs font-bold outline-none"
                  />
                </div>
              </div>
            </div>

            {(() => {
              const premium = getLivePremium()
              if (!premium) return null
              return (
                <div className={`rounded-xl border p-3.5 space-y-1 text-left mt-3.5 ${premium.color}`}>
                  <p className="text-[9px] font-black uppercase tracking-wider">Premium Deal Analyzer</p>
                  <div className="flex justify-between items-center text-xs font-bold mt-1">
                    <span>Melt Value:</span>
                    <span>${premium.meltValue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span>Premium Markup:</span>
                    <span>{premium.premiumPercent.toFixed(2)}% (${premium.premiumValue.toFixed(2)})</span>
                  </div>
                  <p className="text-[10px] font-bold mt-1 uppercase tracking-wide">{premium.rating}</p>
                </div>
              )
            })()}

            <button
              onClick={handleAddItem}
              className="mt-6 w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-all active:scale-[0.98]"
            >
              Add to Vault
            </button>
          </div>
        </div>
      )}

      {/* Asset Detail Modal */}
      {showDetailModal && selectedItem && (() => {
        const val = getCurrentValue(selectedItem)
        const gain = val - selectedItem.purchasePrice
        const pct = selectedItem.purchasePrice > 0 ? (gain / selectedItem.purchasePrice) * 100 : 0
        const targetPrice = getTargetPrice(selectedItem)
        const atTarget = isAtTarget(selectedItem)
        const mConfig = METALS.find(m => m.key === selectedItem.metal)!
        const uConfig = WEIGHT_UNITS.find(u => u.key === selectedItem.weightUnit)!

        // calculate growth progress percentage
        let progressPct = 0
        if (targetPrice > selectedItem.purchasePrice) {
          const totalTargetDelta = targetPrice - selectedItem.purchasePrice
          const currentDelta = val - selectedItem.purchasePrice
          progressPct = Math.min(100, Math.max(0, (currentDelta / totalTargetDelta) * 100))
        } else if (atTarget) {
          progressPct = 100
        }

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-2xl border border-border/40 bg-background p-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold truncate pr-4">{selectedItem.title}</h3>
                <button onClick={() => setShowDetailModal(false)} className="rounded-full p-1 text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Image / Icon */}
                <div className="flex justify-center border border-border/40 rounded-xl p-4 bg-card/30">
                  {selectedItem.imageUri ? (
                    <img src={selectedItem.imageUri} alt={selectedItem.title} className="h-44 w-full object-contain rounded-lg" />
                  ) : (
                    <div className="flex h-32 w-full flex-col items-center justify-center text-muted-foreground/60">
                      <ImageIcon className="h-12 w-12 mb-2 opacity-30" />
                      <span className="text-xs">No Photo Attached</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                {selectedItem.description && (
                  <div className="rounded-xl border border-border/30 bg-card/40 p-3">
                    <p className="text-xs font-semibold text-muted-foreground">Notes</p>
                    <p className="text-xs text-foreground mt-1 leading-relaxed whitespace-pre-wrap">{selectedItem.description}</p>
                  </div>
                )}

                {/* Specs list */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-xl border border-border/40 bg-card/60 p-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">Metal Type</span>
                    <p className="font-bold mt-0.5 text-foreground capitalize">{selectedItem.metal}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Category</span>
                    <p className="font-bold mt-0.5 text-foreground capitalize">{selectedItem.category}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Holding Weight</span>
                    <p className="font-bold mt-0.5 text-foreground">{selectedItem.weight} {uConfig.label}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Purity Rating</span>
                    <p className="font-bold mt-0.5 text-foreground">{(selectedItem.purity * 100).toFixed(2)}%</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Spot Price at Purchase</span>
                    <p className="font-bold mt-0.5 text-foreground">{formatCurrency(selectedItem.spotAtPurchase)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Purchase Date</span>
                    <p className="font-bold mt-0.5 text-foreground">{selectedItem.purchaseDate}</p>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-3 gap-2 bg-muted/20 border border-border/30 rounded-xl p-3.5 text-center">
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Paid</span>
                    <p className="text-sm font-bold mt-0.5 text-foreground">{formatCurrency(selectedItem.purchasePrice)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Current Value</span>
                    <p className="text-sm font-bold mt-0.5 text-foreground">{formatCurrency(val)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Profit / Loss</span>
                    <p className={`text-sm font-bold mt-0.5 ${gain >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {gain >= 0 ? "+" : ""}{pct.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Target Progress Bar */}
                <div className="rounded-xl border border-border/40 bg-card p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Holding Target Growth</span>
                    <span className="text-xs font-bold text-primary">{formatCurrency(targetPrice)}</span>
                  </div>
                  
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden mb-2">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${atTarget ? "bg-emerald-400" : "bg-primary"}`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Paid {formatCurrency(selectedItem.purchasePrice)}</span>
                    {atTarget ? (
                      <span className="text-emerald-400 font-bold">Target Cleared!</span>
                    ) : (
                      <span>{progressPct.toFixed(0)}% of target</span>
                    )}
                  </div>

                  {/* Target Growth Editor inline */}
                  {editingTarget ? (
                    <div className="mt-4 pt-4 border-t border-border/20 flex gap-2 items-center">
                      <select
                        value={editTargetType}
                        onChange={(e) => setEditTargetType(e.target.value as 'percent' | 'fixed')}
                        className="rounded-lg border border-border/30 bg-background px-2 py-1 text-xs font-bold outline-none"
                      >
                        <option value="percent">% Growth</option>
                        <option value="fixed">Fixed Price ($)</option>
                      </select>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={editTargetVal}
                        onChange={(e) => setEditTargetVal(e.target.value)}
                        className="w-24 rounded-lg border border-border/30 bg-background px-2 py-1 text-xs font-bold outline-none"
                      />
                      <button onClick={handleSaveTarget} className="bg-primary text-primary-foreground px-3 py-1 rounded-lg text-xs font-bold">Save</button>
                      <button onClick={() => setEditingTarget(false)} className="border border-border/40 px-3 py-1 rounded-lg text-xs font-semibold">Cancel</button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setEditingTarget(true)} 
                      className="mt-3 text-xs font-bold text-primary hover:underline block"
                    >
                      Edit growth target
                    </button>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => handleToggleArchive(selectedItem)}
                  className="flex-1 rounded-xl border border-border/40 bg-card py-3.5 text-xs font-bold text-foreground transition-all hover:bg-accent/40 active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Archive className="h-4 w-4" />
                  {selectedItem.archived ? "Send to Portfolio" : "Archive Asset"}
                </button>
                <button
                  onClick={() => handleDeleteItem(selectedItem.id)}
                  className="flex-1 rounded-xl border border-red-500/20 bg-red-500/5 py-3.5 text-xs font-bold text-red-400 transition-all hover:bg-red-500/10 active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Asset
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
