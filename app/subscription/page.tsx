"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Check, Sparkles, CreditCard, Loader2, Lock, Mail, User } from "lucide-react"
import { useAuth } from "@/lib/useAuth"

export default function SubscriptionPage() {
  const router = useRouter()
  const { user, loading, refresh } = useAuth()
  const [isPro, setIsPro] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Auth Form State for Subscriptions if not logged in
  const [authMode, setAuthMode] = useState<"login" | "register">("login")
  const [authName, setAuthName] = useState("")
  const [authEmail, setAuthEmail] = useState("")
  const [authPassword, setAuthPassword] = useState("")
  const [authError, setAuthError] = useState("")
  const [submittingAuth, setSubmittingAuth] = useState(false)

  useEffect(() => {
    if (user) {
      setIsPro(user.subscriptionTier === "pro")
    }
  }, [user])

  const handleToggleSub = async () => {
    if (!user) return
    setSubmitting(true)
    const nextState = !isPro
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionTier: nextState ? "pro" : "free",
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to update subscription tier")
      }

      await refresh()
      alert(nextState ? "Pro Subscription activated successfully!" : "Subscription downgraded to Free Tier.")
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to change subscription")
    } finally {
      setSubmitting(false)
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

  const freeFeatures = [
    "Spot prices tracker",
    "Basic Single-metal Scrap Calculator",
    "Read-only Content Feed access",
    "Up to 5 Portfolio items in Vault",
  ]

  const proFeatures = [
    "Multi-row scrap calculator with Dealer guide",
    "Interactive product drops and Zelle/wire checkout",
    "Simulated 1-on-1 Admin desk support chat",
    "Unlimited Vault portfolio tracking & detail metrics",
    "Full PDF ebook downloads and video guides",
    "Custom target price breakout alarms",
  ]

  if (loading) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center text-xs text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
        Checking membership parameters...
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
            <h1 className="text-lg font-bold tracking-tight">Subscription Plans</h1>
            <p className="text-[10px] text-muted-foreground">Unlock advanced calculators and physical inventory</p>
          </div>
        </header>
        
        <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md p-6 mt-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-primary to-amber-600" />
          
          <div className="flex justify-center mb-6 mt-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary bg-primary/10 text-primary">
              <Lock className="h-8 w-8 animate-pulse" />
            </div>
          </div>

          <h2 className="text-base font-bold text-center tracking-tight text-foreground">Unlock Membership Portal</h2>
          <p className="text-xs text-muted-foreground text-center mt-1">Sign in or register below to manage plans and customize your stacked portfolio.</p>

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
                authMode === "login" ? "Sign In to Memberships" : "Create Account"
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
          <h1 className="text-lg font-bold tracking-tight">Subscription Plans</h1>
          <p className="text-[10px] text-muted-foreground">Unlock advanced calculators and physical inventory</p>
        </div>
      </header>

      {/* Current Tier status header */}
      <section className="rounded-xl border border-border/40 bg-card p-4.5 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            {isPro ? <Sparkles className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
          </div>
          <div>
            <span className="text-[9px] font-bold text-muted-foreground uppercase">Current Membership</span>
            <h3 className="text-sm font-bold text-foreground">{isPro ? "Precious Metals Pro — Member" : "Free Explorer Account"}</h3>
          </div>
        </div>
        <span className="rounded bg-primary/15 px-2 py-0.5 text-[10px] font-extrabold text-primary">
          {isPro ? "PRO ACTIVE" : "FREE"}
        </span>
      </section>

      {/* Plans columns */}
      <div className="space-y-4">
        {/* Free Plan */}
        <section className={`rounded-xl border p-4 transition-all ${
          !isPro ? "border-primary/50 bg-card" : "border-border/30 bg-card/40 opacity-75"
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-bold">Standard Account</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Basic tools for standard stackers</p>
            </div>
            <p className="text-sm font-black">$0.00 <span className="text-[9px] font-normal text-muted-foreground">/mo</span></p>
          </div>
          <ul className="mt-3.5 space-y-2 text-xs">
            {freeFeatures.map(f => (
              <li key={f} className="flex gap-2 items-start text-muted-foreground">
                <Check className="h-3.5 w-3.5 shrink-0 text-muted-foreground mt-0.5" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Pro Plan */}
        <section className={`rounded-xl border p-4.5 transition-all relative overflow-hidden ${
          isPro ? "border-primary bg-gradient-to-br from-card to-card/60" : "border-primary/35 bg-card"
        }`}>
          {/* Badge */}
          <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 rounded-bl-lg text-[9px] font-black uppercase tracking-wider">
            Premium Choice
          </div>

          <div className="flex justify-between items-start mt-1">
            <div>
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                PMP Pro Membership
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Advanced scrap operations & direct buying</p>
            </div>
            <p className="text-sm font-black text-primary">$19.99 <span className="text-[9px] font-normal text-muted-foreground">/mo</span></p>
          </div>
          
          <ul className="mt-4 space-y-2 text-xs">
            {proFeatures.map(f => (
              <li key={f} className="flex gap-2 items-start">
                <Check className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
                <span className="text-foreground/90 font-medium">{f}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={handleToggleSub}
            disabled={submitting}
            className="mt-6 w-full rounded-xl bg-primary py-3 text-xs font-extrabold text-primary-foreground transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-1"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" />}
            {isPro ? "Cancel Pro Plan" : "Upgrade to Pro"}
          </button>
        </section>
      </div>
    </div>
  )
}
