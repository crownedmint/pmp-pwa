"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Settings, Moon, Sun, Monitor, Trash2, RefreshCw } from "lucide-react"

export default function SettingsPage() {
  const router = useRouter()
  const [theme, setTheme] = useState<"dark" | "light" | "system">("dark")
  const [cachingEnabled, setCachingEnabled] = useState(true)

  const handleClearCache = () => {
    if (confirm("Are you sure you want to clear local application data?\n\nThis will wipe your saved calculations, vault items, and active drop reservations.")) {
      try {
        localStorage.clear()
        alert("Cache cleared successfully!")
        router.push("/")
        window.location.reload()
      } catch (e) {
        console.error(e)
      }
    }
  }

  return (
    <div className="flex flex-col px-4 pb-24 max-w-lg mx-auto">
      <header className="flex items-center gap-3 pt-4 pb-3 border-b border-border/20 mb-4">
        <button onClick={() => router.back()} className="p-1 rounded-full text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold tracking-tight">System Settings</h1>
          <p className="text-[10px] text-muted-foreground">Manage visual themes and stored database caching</p>
        </div>
      </header>

      <div className="space-y-4">
        {/* Theme Settings */}
        <section className="rounded-xl border border-border/40 bg-card p-4 space-y-3">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-1.5 mb-2">
            Appearance Theme
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: "dark", label: "Dark Mode", icon: Moon },
              { key: "light", label: "Light Mode", icon: Sun },
              { key: "system", label: "System Default", icon: Monitor },
            ].map(t => {
              const Icon = t.icon
              const isActive = theme === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => setTheme(t.key as any)}
                  className={`flex flex-col items-center gap-2 border rounded-xl py-3 px-2 transition-all active:scale-95 ${
                    isActive 
                      ? "border-primary bg-primary/10 text-primary" 
                      : "border-border/30 bg-background/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                  <span className="text-[10px] font-bold">{t.label}</span>
                </button>
              )
            })}
          </div>
        </section>

        {/* Cache Settings */}
        <section className="rounded-xl border border-border/40 bg-card p-4 space-y-4">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-primary">
            Caching & Synchronization
          </h2>
          
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xs font-bold text-foreground">Enable Database Caching</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Speed up load times by storing market charts locally.</p>
            </div>
            <input
              type="checkbox"
              checked={cachingEnabled}
              onChange={(e) => setCachingEnabled(e.target.checked)}
              className="accent-primary h-4 w-4 shrink-0 cursor-pointer mt-1"
            />
          </div>

          <hr className="border-border/20" />

          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-bold text-foreground">Clear Local Storage</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Wipe all offline databases and reset variables.</p>
            </div>
            <button
              onClick={handleClearCache}
              className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/10 active:scale-95 flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </button>
          </div>
        </section>

        {/* App Info */}
        <div className="text-center text-[10px] text-muted-foreground/50 py-4 space-y-1 font-semibold">
          <p>Precious Metals Pro v1.2.0-PWA</p>
          <p>© 2026 Precious Metal Pro LLC. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
