"use client"

import { useEffect, useState } from "react"
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
  ShieldAlert
} from "lucide-react"

interface ProfileMenuProps {
  isOpen: boolean
  onClose: () => void
}

export default function ProfileMenu({ isOpen, onClose }: ProfileMenuProps) {
  const router = useRouter()
  const [profile, setProfile] = useState({
    firstName: "Carlos",
    lastName: "Martinez",
    email: "carlos@pmpro.app",
    phone: "(954) 555-0142",
  })

  useEffect(() => {
    // Load local storage profile if exists
    try {
      const saved = localStorage.getItem("pmp-user-profile")
      if (saved) {
        setProfile(JSON.parse(saved))
      }
    } catch (e) {
      console.error(e)
    }
  }, [isOpen])

  if (!isOpen) return null

  const menuItems = [
    { icon: User, label: "My Profile", href: "/profile" },
    { icon: Bell, label: "Notifications", href: "/notifications" },
    { icon: CreditCard, label: "Subscription", href: "/subscription" },
    { icon: Settings, label: "Settings", href: "/settings" },
    { icon: HelpCircle, label: "Support & FAQs", href: "/support" },
    { icon: ShieldAlert, label: "Legal Policy", href: "/policy" },
  ]

  const handleLogout = () => {
    if (confirm("Are you sure you want to log out?")) {
      onClose()
      router.push("/")
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative z-10 flex h-full w-[280px] flex-col border-l border-border/40 bg-background/95 p-6 shadow-2xl backdrop-blur-md animate-in slide-in-from-right duration-250">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-card/60 border border-border/30 text-muted-foreground transition-colors hover:text-foreground active:scale-95"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Profile Card */}
        <div className="mt-8 mb-6 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary bg-primary/10 text-primary mb-3">
            <User className="h-8 w-8" />
          </div>
          <h2 className="text-base font-bold tracking-tight text-foreground">
            {profile.firstName} {profile.lastName}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">{profile.email}</p>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">{profile.phone}</p>
        </div>

        <hr className="border-border/30 mb-4" />

        {/* Menu Navigation */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto">
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
      </div>
    </div>
  )
}
