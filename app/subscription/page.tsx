"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Check, Sparkles, CreditCard, Shield } from "lucide-react"

const STORAGE_KEY = "pmp-user-sub"

export default function SubscriptionPage() {
  const router = useRouter()
  const [isPro, setIsPro] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === "pro") {
        setIsPro(true)
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  const handleToggleSub = () => {
    const nextState = !isPro
    setIsPro(nextState)
    localStorage.setItem(STORAGE_KEY, nextState ? "pro" : "free")
    alert(nextState ? "Pro Subscription activated successfully!" : "Subscription downgraded to Free Tier.")
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
            className="mt-6 w-full rounded-xl bg-primary py-3 text-xs font-extrabold text-primary-foreground transition-all active:scale-[0.98]"
          >
            {isPro ? "Cancel Pro Plan" : "Upgrade to Pro"}
          </button>
        </section>
      </div>
    </div>
  )
}
