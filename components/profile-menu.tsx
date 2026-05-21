"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  User, 
  Bell, 
  CreditCard, 
  Settings, 
  HelpCircle, 
  LogOut, 
  X, 
  ChevronRight,
  ShieldAlert,
  Mail,
  Lock,
  Loader2
} from "lucide-react"
import { useAuth } from "@/lib/useAuth"

interface ProfileMenuProps {
  isOpen: boolean
  onClose: () => void
}

export default function ProfileMenu({ isOpen, onClose }: ProfileMenuProps) {
  const router = useRouter()
  const { user, loading, refresh, logout } = useAuth()
  
  // Auth Form State
  const [authMode, setAuthMode] = useState<"login" | "register">("login")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const menuItems = [
    { icon: User, label: "My Profile", href: "/profile" },
    { icon: Bell, label: "Notifications", href: "/notifications" },
    { icon: CreditCard, label: "Subscription", href: "/subscription" },
    { icon: Settings, label: "Settings", href: "/settings" },
    { icon: HelpCircle, label: "Support & FAQs", href: "/support" },
    { icon: ShieldAlert, label: "Legal Policy", href: "/policy" },
  ]

  const handleLogout = async () => {
    if (confirm("Are you sure you want to log out?")) {
      await logout()
      onClose()
      router.push("/")
    }
  }

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSubmitting(true)

    try {
      const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register"
      const body = authMode === "login" 
        ? { email, password }
        : { name, email, password }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed")
      }

      // Refresh auth state
      await refresh()
      
      // Clear forms
      setName("")
      setEmail("")
      setPassword("")
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative z-10 flex h-full w-[310px] flex-col border-l border-border/40 bg-background/95 p-6 shadow-2xl backdrop-blur-md animate-in slide-in-from-right duration-250">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-card/60 border border-border/30 text-muted-foreground transition-colors hover:text-foreground active:scale-95"
        >
          <X className="h-4 w-4" />
        </button>

        {loading ? (
          <div className="flex flex-1 flex-col items-center justify-center text-xs text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
            Verifying secure session...
          </div>
        ) : user ? (
          // LOGGED IN VIEW
          <>
            {/* Profile Card */}
            <div className="mt-8 mb-6 flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary bg-primary/10 text-primary mb-3 font-extrabold text-lg uppercase">
                {user.name ? user.name.substring(0, 2) : "US"}
              </div>
              <h2 className="text-base font-bold tracking-tight text-foreground line-clamp-1">
                {user.name}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{user.email}</p>
              {user.phone && <p className="text-[10px] text-muted-foreground/60 mt-0.5">{user.phone}</p>}
            </div>

            <hr className="border-border/30 mb-4" />

            {/* Menu Navigation */}
            <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
              {menuItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-xl border border-transparent bg-card/25 px-4 py-3 text-sm font-medium text-muted-foreground transition-all hover:border-border/40 hover:bg-card/60 hover:text-foreground active:scale-[0.98]"
                >
                  <item.icon className="h-4 w-4 shrink-0 text-primary" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronRight className="h-3.5 w-3.5 opacity-55" />
                </Link>
              ))}
            </nav>

            {/* Logout Button */}
            <div className="mt-auto pt-4">
              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 py-3 text-sm font-bold text-red-400 transition-all hover:bg-red-500/10 active:scale-[0.98]"
              >
                <LogOut className="h-4 w-4" />
                Log Out
              </button>
            </div>
          </>
        ) : (
          // AUTHENTICATION REGISTER/LOGIN FORM VIEW
          <div className="flex flex-col h-full mt-8">
            <h2 className="text-lg font-extrabold tracking-tight text-foreground">Secure Vault Auth</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Access locked drops & portfolio holdings.</p>

            {/* Tabs */}
            <div className="flex border-b border-border/30 mt-5 mb-4">
              <button
                onClick={() => { setAuthMode("login"); setError(""); }}
                className={`flex-1 pb-2.5 text-xs font-bold transition-all border-b-2 ${
                  authMode === "login" 
                    ? "border-primary text-foreground" 
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setAuthMode("register"); setError(""); }}
                className={`flex-1 pb-2.5 text-xs font-bold transition-all border-b-2 ${
                  authMode === "register" 
                    ? "border-primary text-foreground" 
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Register
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-[10px] font-semibold text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3.5 flex-1">
              {authMode === "register" && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Full Name</label>
                  <div className="relative flex items-center rounded-xl border border-border/40 bg-card/40 px-3 py-2.5 focus-within:border-primary/50">
                    <User className="absolute left-3.5 h-4 w-4 text-muted-foreground/60" />
                    <input
                      type="text"
                      required
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-transparent pl-7 text-xs font-semibold outline-none text-foreground placeholder:text-muted-foreground/40"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
                <div className="relative flex items-center rounded-xl border border-border/40 bg-card/40 px-3 py-2.5 focus-within:border-primary/50">
                  <Mail className="absolute left-3.5 h-4 w-4 text-muted-foreground/60" />
                  <input
                    type="email"
                    required
                    placeholder="name@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent pl-7 text-xs font-semibold outline-none text-foreground placeholder:text-muted-foreground/40"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Secure Password</label>
                <div className="relative flex items-center rounded-xl border border-border/40 bg-card/40 px-3 py-2.5 focus-within:border-primary/50">
                  <Lock className="absolute left-3.5 h-4 w-4 text-muted-foreground/60" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent pl-7 text-xs font-semibold outline-none text-foreground placeholder:text-muted-foreground/40"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-xs font-black text-primary-foreground shadow-sm transition-all active:scale-[0.98] disabled:opacity-55 disabled:scale-100 mt-2"
              >
                {submitting ? (
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
        )}
      </div>
    </div>
  )
}
