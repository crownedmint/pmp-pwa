"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, User, MapPin, Phone, Mail } from "lucide-react"

const STORAGE_KEY = "pmp-user-profile"

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState({
    firstName: "Carlos",
    lastName: "Martinez",
    email: "carlos@pmpro.app",
    phone: "(954) 555-0142",
    mailingAddress: "1200 Brickell Ave, Suite 1900, Miami, FL 33131",
    billingAddress: "1200 Brickell Ave, Suite 1900, Miami, FL 33131",
  })

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        setProfile(JSON.parse(saved))
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
      alert("Profile details saved successfully!")
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
          className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Save className="h-4.5 w-4.5" />
          Save Changes
        </button>
      </div>
    </div>
  )
}
