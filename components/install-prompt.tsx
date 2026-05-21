"use client"

import { useState, useEffect } from "react"
import { Share, X } from "lucide-react"

export function InstallPrompt() {
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null)

  useEffect(() => {
    // Don't show if already running as standalone PWA
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true

    if (isStandalone) return

    // Detect iOS
    const ua = navigator.userAgent
    const isiOS = /iPad|iPhone|iPod/.test(ua) && !(window as Window & { MSStream?: unknown }).MSStream
    setIsIOS(isiOS)

    // Listen for Android/Chrome install prompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShow(true)
    }
    window.addEventListener("beforeinstallprompt", handler)

    // For iOS, just show after a short delay
    if (isiOS) {
      const timer = setTimeout(() => setShow(true), 1500)
      return () => {
        clearTimeout(timer)
        window.removeEventListener("beforeinstallprompt", handler)
      }
    }

    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const handleDismiss = () => {
    setShow(false)
  }

  const handleInstall = async () => {
    if (deferredPrompt && "prompt" in deferredPrompt) {
      ;(deferredPrompt as Event & { prompt: () => void }).prompt()
      setShow(false)
    }
  }

  if (!show) return null

  return (
    <div className="fixed inset-x-0 bottom-20 z-[60] px-4 animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="mx-auto max-w-sm rounded-2xl border border-border/60 bg-card p-4 shadow-2xl shadow-black/40">
        <div className="flex items-start gap-3">
          {/* App icon */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15">
            <span className="text-lg font-bold text-primary">PM</span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold">Install Precious Metals Pro</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Add to your home screen for the full app experience
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="ml-2 shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                <Share className="h-4 w-4 shrink-0 text-primary" />
                <p className="text-[11px] leading-tight text-muted-foreground">
                  Tap <span className="font-semibold text-foreground">Share</span> then{" "}
                  <span className="font-semibold text-foreground">Add to Home Screen</span>
                </p>
              </div>
            ) : (
              <button
                onClick={handleInstall}
                className="mt-3 w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all active:scale-95"
              >
                Install App
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
