"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, User, MapPin, Phone, Mail, Lock, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/useAuth"

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading, refresh } = useAuth()

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    mailingAddress: "",
    billingAddress: "",
  })

  // Auth Form State for Profile Page if not logged in
  const [authMode, setAuthMode] = useState<"login" | "register">("login")
  const [authName, setAuthName] = useState("")
  const [authEmail, setAuthEmail] = useState("")
  const [authPassword, setAuthPassword] = useState("")
  const [authError, setAuthError] = useState("")
  const [submittingAuth, setSubmittingAuth] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)

  useEffect(() => {
    if (user) {
      const parts = (user.name || "").split(" ")
      const first = parts[0] || ""
      const last = parts.slice(1).join(" ") || ""
      setProfile({
        firstName: first,
        lastName: last,
        email: user.email || "",
        phone: user.phone || "",
        mailingAddress: user.shippingAddress || "",
        billingAddress: user.billingAddress || "",
      })
    }
  }, [user])

  const handleSave = async () => {
    setSavingProfile(true)
    try {
      const fullName = `${profile.firstName.trim()} ${profile.lastName.trim()}`.trim()
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          phone: profile.phone,
          shippingAddress: profile.mailingAddress,
          billingAddress: profile.billingAddress,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to save profile changes")
      }

      await refresh()
      alert("Profile details saved successfully!")
      router.back()
    } catch (e: unknown) {
      console.error(e)
      alert(e instanceof Error ? e.message : "Error saving profile")
    } finally {
      setSavingProfile(false)
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
        Authenticating profile access...
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
            <h1 className="text-lg font-bold tracking-tight">My Profile</h1>
            <p className="text-[10px] text-muted-foreground">Manage details and shipping destinations</p>
          </div>
        </header>
        
        <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md p-6 mt-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-primary to-amber-600" />
          
          <div className="flex justify-center mb-6 mt-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary bg-primary/10 text-primary">
              <Lock className="h-8 w-8 animate-pulse" />
            </div>
          </div>

          <h2 className="text-base font-bold text-center tracking-tight text-foreground">Unlock Profile Settings</h2>
          <p className="text-xs text-muted-foreground text-center mt-1">Sign in or register below to manage your contact info, shipping, and billing locations.</p>

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
                authMode === "login" ? "Sign In to Settings" : "Create Account"
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
          <h1 className="text-lg font-bold tracking-tight">My Profile</h1>
          <p className="text-[10px] text-muted-foreground">Manage details and shipping destinations</p>
        </div>
      </header>

      <div className="space-y-4">
        {/* Contact Info */}
        <section className="rounded-xl border border-border/40 bg-card p-4 space-y-3">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-1.5 mb-1">
            <User className="h-3.5 w-3.5" />
            Contact Information
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] font-bold uppercase text-muted-foreground block mb-1">First Name</label>
              <input
                type="text"
                value={profile.firstName}
                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                className="w-full rounded-lg border border-border/30 bg-background/50 px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase text-muted-foreground block mb-1">Last Name</label>
              <input
                type="text"
                value={profile.lastName}
                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                className="w-full rounded-lg border border-border/30 bg-background/50 px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
              />
            </div>
          </div>
          <div>
            <label className="text-[9px] font-bold uppercase text-muted-foreground block mb-1">Email Address</label>
            <div className="relative flex items-center">
              <Mail className="h-3.5 w-3.5 text-muted-foreground/60 absolute left-3" />
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full rounded-lg border border-border/30 bg-background/50 pl-9 pr-3 py-2 text-xs font-semibold outline-none focus:border-primary"
              />
            </div>
          </div>
          <div>
            <label className="text-[9px] font-bold uppercase text-muted-foreground block mb-1">Phone Number</label>
            <div className="relative flex items-center">
              <Phone className="h-3.5 w-3.5 text-muted-foreground/60 absolute left-3" />
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full rounded-lg border border-border/30 bg-background/50 pl-9 pr-3 py-2 text-xs font-semibold outline-none focus:border-primary"
              />
            </div>
          </div>
        </section>

        {/* Addresses */}
        <section className="rounded-xl border border-border/40 bg-card p-4 space-y-3">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-1.5 mb-1">
            <MapPin className="h-3.5 w-3.5" />
            Shipping & Billing
          </h2>
          <div>
            <label className="text-[9px] font-bold uppercase text-muted-foreground block mb-1">Shipping Destination</label>
            <textarea
              value={profile.mailingAddress}
              onChange={(e) => setProfile({ ...profile, mailingAddress: e.target.value })}
              className="w-full rounded-lg border border-border/30 bg-background/50 px-3 py-2 text-xs font-semibold outline-none focus:border-primary h-14 resize-none"
            />
          </div>
          <div>
            <label className="text-[9px] font-bold uppercase text-muted-foreground block mb-1">Billing Destination</label>
            <textarea
              value={profile.billingAddress}
              onChange={(e) => setProfile({ ...profile, billingAddress: e.target.value })}
              className="w-full rounded-lg border border-border/30 bg-background/50 px-3 py-2 text-xs font-semibold outline-none focus:border-primary h-14 resize-none"
            />
          </div>
        </section>

        <button
          onClick={handleSave}
          disabled={savingProfile}
          className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {savingProfile ? (
            <Loader2 className="h-4.5 w-4.5 animate-spin" />
          ) : (
            <Save className="h-4.5 w-4.5" />
          )}
          {savingProfile ? "Saving Changes..." : "Save Changes"}
        </button>
      </div>
    </div>
  )
}
