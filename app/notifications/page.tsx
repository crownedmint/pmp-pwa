"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Bell, TrendingUp, ShoppingBag, ShieldCheck, MessageSquare } from "lucide-react"

const STORAGE_KEY = "pmp-notification-prefs"

export default function NotificationsPage() {
  const router = useRouter()
  const [prefs, setPrefs] = useState({
    spotAlerts: true,
    dropReleases: true,
    escrowUpdates: true,
    chatMessages: true,
  })

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        setPrefs(JSON.parse(saved))
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
      alert("Notification preferences saved successfully!")
      router.back()
    } catch (e) {
      console.error(e)
    }
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
          className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Save className="h-4.5 w-4.5" />
          Save Preferences
        </button>
      </div>
    </div>
  )
}
