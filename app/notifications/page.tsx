"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Bell, TrendingUp, ShoppingBag, ShieldCheck, MessageSquare, Loader2, Lock, Mail, User, Trash2, Plus, X } from "lucide-react"
import { useAuth } from "@/lib/useAuth"

const METALS = [
  { key: "gold", name: "Gold", color: "#D4AF37" },
  { key: "silver", name: "Silver", color: "#C0C0C0" },
  { key: "platinum", name: "Platinum", color: "#E5E4E2" },
  { key: "palladium", name: "Palladium", color: "#B8B8B8" },
] as const

type MetalType = "gold" | "silver" | "platinum" | "palladium"

interface PriceAlert {
  id: string
  metal: MetalType
  targetPrice: number
  condition: "above" | "below"
  isActive: boolean
}

export default function NotificationsPage() {
  const router = useRouter()
  const { user, loading, refresh } = useAuth()
  const [savingPrefs, setSavingPrefs] = useState(false)

  // Price Alerts State
  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [loadingAlerts, setLoadingAlerts] = useState(true)
  const [showAddAlertModal, setShowAddAlertModal] = useState(false)
  const [aMetal, setAMetal] = useState<MetalType>("gold")
  const [aPrice, setAPrice] = useState("")
  const [aCondition, setACondition] = useState<"above" | "below">("above")
  const [spotPrices, setSpotPrices] = useState<Record<MetalType, number>>({
    gold: 0,
    silver: 0,
    platinum: 0,
    palladium: 0,
  })

  const [prefs, setPrefs] = useState({
    spotAlerts: true,
    dropReleases: true,
    escrowUpdates: true,
    chatMessages: true,
  })

  // Auth Form State for Notifications if not logged in
  const [authMode, setAuthMode] = useState<"login" | "register">("login")
  const [authName, setAuthName] = useState("")
  const [authEmail, setAuthEmail] = useState("")
  const [authPassword, setAuthPassword] = useState("")
  const [authError, setAuthError] = useState("")
  const [submittingAuth, setSubmittingAuth] = useState(false)

  useEffect(() => {
    if (user && user.alerts) {
      setPrefs({
        spotAlerts: !!user.alerts.price,
        dropReleases: !!user.alerts.drops,
        escrowUpdates: !!user.alerts.escrow,
        chatMessages: !!user.alerts.chat,
      })
    }
  }, [user])

  const fetchSpotPrices = async () => {
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
      console.error("Failed to fetch spot prices:", e)
    }
  }

  const fetchAlerts = async () => {
    if (!user) return
    setLoadingAlerts(true)
    try {
      const res = await fetch("/api/notifications/alerts")
      const data = await res.json()
      if (data.alerts) {
        setAlerts(data.alerts)
      }
    } catch (e) {
      console.error("Failed to fetch alerts:", e)
    } finally {
      setLoadingAlerts(false)
    }
  }

  useEffect(() => {
    fetchSpotPrices()
  }, [])

  useEffect(() => {
    if (user) {
      fetchAlerts()
    }
  }, [user])

  const handleAddAlert = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetVal = parseFloat(aPrice)
    if (!targetVal || targetVal <= 0) return

    try {
      const res = await fetch("/api/notifications/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metal: aMetal,
          targetPrice: targetVal,
          condition: aCondition
        })
      })

      if (res.ok) {
        setShowAddAlertModal(false)
        setAPrice("")
        fetchAlerts()
      }
    } catch (err) {
      console.error("Failed to create alert:", err)
    }
  }

  const handleDeleteAlert = async (id: string) => {
    if (!confirm("Are you sure you want to remove this price alert?")) return
    try {
      const res = await fetch(`/api/notifications/alerts?id=${id}`, {
        method: "DELETE"
      })
      if (res.ok) {
        fetchAlerts()
      }
    } catch (err) {
      console.error("Failed to delete alert:", err)
    }
  }

  const handleSave = async () => {
    if (!user) return
    setSavingPrefs(true)
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alerts: {
            price: prefs.spotAlerts,
            drops: prefs.dropReleases,
            escrow: prefs.escrowUpdates,
            chat: prefs.chatMessages,
          },
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to save alert preferences")
      }

      await refresh()
      alert("Notification preferences saved successfully!")
      router.back()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to save settings")
    } finally {
      setSavingPrefs(false)
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

  if (loading) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center text-xs text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
        Checking alert settings...
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col px-4 pb-24 max-w-md mx-auto">
        <header className="flex items-center gap-3 pt-4 pb-3 border-b border-border/20 mb-4">
          <button onClick={() => router.back()} className="p-1 rounded-full text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Notifications</h1>
            <p className="text-[10px] text-muted-foreground">Manage transaction updates and spot alarms</p>
          </div>
        </header>
        
        <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md p-6 mt-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-primary to-amber-600" />
          
          <div className="flex justify-center mb-6 mt-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary bg-primary/10 text-primary">
              <Lock className="h-8 w-8 animate-pulse" />
            </div>
          </div>

          <h2 className="text-base font-bold text-center tracking-tight text-foreground">Unlock Alert Preferences</h2>
          <p className="text-xs text-muted-foreground text-center mt-1">Sign in or register below to set up real-time text and email alarms for drops and escrow events.</p>

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
                authMode === "login" ? "Sign In to Alerts" : "Create Account"
              )}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col px-4 pb-24 max-w-lg mx-auto">
      <header className="flex items-center gap-3 pt-4 pb-3 border-b border-border/20 mb-4">
        <button onClick={() => router.back()} className="p-1 rounded-full text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold tracking-tight">Notifications</h1>
          <p className="text-[10px] text-muted-foreground">Manage transaction updates and spot alarms</p>
        </div>
      </header>

      <div className="space-y-4">
        <section className="rounded-xl border border-border/40 bg-card p-4 divide-y divide-border/20 space-y-4">
          {/* Spot Alerts */}
          <div className="flex items-start justify-between py-2 first:pt-0 gap-4">
            <div className="flex gap-3">
              <TrendingUp className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <label htmlFor="spotAlerts" className="text-xs font-bold text-foreground cursor-pointer">Spot Price Alarms</label>
                <p className="text-[10px] text-muted-foreground mt-0.5">Receive immediate notifications on extreme market breakouts or dumps.</p>
              </div>
            </div>
            <input
              id="spotAlerts"
              type="checkbox"
              checked={prefs.spotAlerts}
              onChange={(e) => setPrefs({ ...prefs, spotAlerts: e.target.checked })}
              className="accent-primary h-4 w-4 shrink-0 cursor-pointer"
            />
          </div>

          {/* Drop releases */}
          <div className="flex items-start justify-between py-4 gap-4">
            <div className="flex gap-3">
              <ShoppingBag className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <label htmlFor="dropReleases" className="text-xs font-bold text-foreground cursor-pointer">Drop Release Catalogs</label>
                <p className="text-[10px] text-muted-foreground mt-0.5">Be notified the second physical collections are uploaded to the catalog.</p>
              </div>
            </div>
            <input
              id="dropReleases"
              type="checkbox"
              checked={prefs.dropReleases}
              onChange={(e) => setPrefs({ ...prefs, dropReleases: e.target.checked })}
              className="accent-primary h-4 w-4 shrink-0 cursor-pointer"
            />
          </div>

          {/* Escrow updates */}
          <div className="flex items-start justify-between py-4 gap-4">
            <div className="flex gap-3">
              <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <label htmlFor="escrowUpdates" className="text-xs font-bold text-foreground cursor-pointer">Escrow & Verification</label>
                <p className="text-[10px] text-muted-foreground mt-0.5">Track your 90-minute wire verification countdowns and vault staging.</p>
              </div>
            </div>
            <input
              id="escrowUpdates"
              type="checkbox"
              checked={prefs.escrowUpdates}
              onChange={(e) => setPrefs({ ...prefs, escrowUpdates: e.target.checked })}
              className="accent-primary h-4 w-4 shrink-0 cursor-pointer"
            />
          </div>

          {/* Chat Messages */}
          <div className="flex items-start justify-between py-4 last:pb-0 gap-4">
            <div className="flex gap-3">
              <MessageSquare className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <label htmlFor="chatMessages" className="text-xs font-bold text-foreground cursor-pointer">Admin Chat Messages</label>
                <p className="text-[10px] text-muted-foreground mt-0.5">Receive updates on invoice verification status and shipping trackers.</p>
              </div>
            </div>
            <input
              id="chatMessages"
              type="checkbox"
              checked={prefs.chatMessages}
              onChange={(e) => setPrefs({ ...prefs, chatMessages: e.target.checked })}
              className="accent-primary h-4 w-4 shrink-0 cursor-pointer"
            />
          </div>
        </section>

        <button
          onClick={handleSave}
          disabled={savingPrefs}
          className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {savingPrefs ? (
            <Loader2 className="h-4.5 w-4.5 animate-spin" />
          ) : (
            <Save className="h-4.5 w-4.5" />
          )}
          {savingPrefs ? "Saving Preferences..." : "Save Preferences"}
        </button>

        {/* Custom Price Alerts Section */}
        <section className="mt-8 space-y-4">
          <div className="flex justify-between items-center border-t border-border/20 pt-6">
            <div>
              <h2 className="text-sm font-bold text-foreground">Custom Spot Alarms</h2>
              <p className="text-[10px] text-muted-foreground">Get notified when metals cross specified limits</p>
            </div>
            <button
              onClick={() => {
                setAPrice("")
                setShowAddAlertModal(true)
              }}
              className="rounded-xl bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 text-[10px] font-black uppercase active:scale-95 transition-all flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Alarm
            </button>
          </div>

          {loadingAlerts ? (
            <div className="flex h-24 flex-col items-center justify-center text-xs text-muted-foreground border border-dashed border-border/40 rounded-2xl bg-card/10">
              <Loader2 className="h-4.5 w-4.5 animate-spin text-primary mb-1" />
              Loading alarms...
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 border border-dashed border-border/40 rounded-2xl bg-card/20 text-center">
              <p className="text-xs font-semibold text-muted-foreground">No active price alarms</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                Set targets above or below current spot to receive triggers.
              </p>
            </div>
          ) : (
            <div className="grid gap-2.5">
              {alerts.map((alert) => {
                const mConfig = METALS.find(m => m.key === alert.metal)!
                const currentSpot = spotPrices[alert.metal] || 0

                return (
                  <div key={alert.id} className="flex items-center justify-between rounded-xl border border-border/40 bg-card p-3 shadow-xs relative">
                    <div className="flex items-center gap-3">
                      <span 
                        className="rounded px-1.5 py-0.5 text-[9px] font-black text-black capitalize shrink-0"
                        style={{ backgroundColor: mConfig.color }}
                      >
                        {mConfig.name}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-foreground">
                          Triggers {alert.condition === "above" ? "Above" : "Below"} ${alert.targetPrice.toFixed(2)}
                        </div>
                        <p className="text-[9px] text-muted-foreground/75 mt-0.5 font-semibold">
                          Current Spot: ${currentSpot.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteAlert(alert.id)}
                      className="p-1.5 text-muted-foreground hover:text-red-400 active:scale-90 transition-all rounded-md"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Add Alert Modal */}
        {showAddAlertModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl border border-border/40 bg-background p-5 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black uppercase tracking-wider">Set Custom Spot Alarm</h3>
                <button onClick={() => setShowAddAlertModal(false)} className="rounded-full p-1 text-muted-foreground hover:text-foreground">
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <form onSubmit={handleAddAlert} className="space-y-3.5">
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-1">Precious Metal</label>
                  <select
                    value={aMetal}
                    onChange={(e) => setAMetal(e.target.value as MetalType)}
                    className="w-full rounded-xl border border-border/40 bg-card px-3 py-2.5 text-xs font-bold outline-none capitalize text-foreground"
                  >
                    {METALS.map(m => (
                      <option key={m.key} value={m.key} className="bg-background capitalize">{m.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-1">Condition</label>
                    <select
                      value={aCondition}
                      onChange={(e) => setACondition(e.target.value as "above" | "below")}
                      className="w-full rounded-xl border border-border/40 bg-card px-3 py-2.5 text-xs font-bold outline-none text-foreground"
                    >
                      <option value="above">Above (&gt;=)</option>
                      <option value="below">Below (&lt;=)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-1">Target Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={aPrice}
                      onChange={(e) => setAPrice(e.target.value)}
                      placeholder={spotPrices[aMetal] ? `${spotPrices[aMetal].toFixed(2)}` : "Price"}
                      className="w-full rounded-xl border border-border/40 bg-card px-3 py-2.5 text-xs font-bold outline-none text-foreground"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-black py-3 rounded-xl transition-all active:scale-[0.98] shadow-sm mt-2"
                >
                  Create Alert
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
