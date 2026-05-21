"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft, Shield } from "lucide-react"

export default function PolicyPage() {
  const router = useRouter()

  return (
    <div className="flex flex-col px-4 pb-24 max-w-lg mx-auto">
      <header className="flex items-center gap-3 pt-4 pb-3 border-b border-border/20 mb-4">
        <button onClick={() => router.back()} className="p-1 rounded-full text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold tracking-tight">Legal Policy</h1>
          <p className="text-[10px] text-muted-foreground">Terms of service, escrow, and privacy declarations</p>
        </div>
      </header>

      <div className="space-y-4">
        <section className="rounded-xl border border-border/40 bg-card p-4 space-y-4 max-h-[60vh] overflow-y-auto text-xs leading-relaxed text-muted-foreground select-none">
          <div className="flex items-center gap-2 text-primary font-bold mb-1">
            <Shield className="h-4.5 w-4.5" />
            Escrow Terms & Conditions
          </div>

          <div className="space-y-3 font-normal">
            <h3 className="font-bold text-foreground">1. Asset Reservation Ledger</h3>
            <p>
              By selecting "Reserve Now" during an active catalog drop, the user locks a unique, non-fungible physical inventory item from other buyers. This reservation constitutes a binding intent to purchase at the locked-in price.
            </p>

            <h3 className="font-bold text-foreground">2. 90-Minute Payment Escrow</h3>
            <p>
              Reserved assets will remain locked for a maximum of ninety (90) minutes. Within this timeframe, the user is required to initiate a bank wire transfer or Zelle transaction and upload proof of receipt. Failure to provide receipt verification will automatically expire the lock, returning the item to the live catalog.
            </p>

            <h3 className="font-bold text-foreground">3. Melt Spread Valuations</h3>
            <p>
              Precious Metals Pro acts as a platform for valuation tracking. We do not guarantee external dealer payout percentages. Scrap and karat estimations are for information purposes. All transactions completed via physical drops are final upon receipt validation.
            </p>

            <h3 className="font-bold text-foreground">4. Privacy & Offline Ledger</h3>
            <p>
              Your portfolio information is cached locally on your device storage. Client-side storage ensures high-speed accessibility and zero third-party tracking. By clearing your local cache or app settings, you acknowledge that all saved lists and items will be permanently erased.
            </p>

            <h3 className="font-bold text-foreground">5. Shipping & Insurance</h3>
            <p>
              All drops exceeding $50,000 receive complimentary armored courier delivery. Shipments below this threshold are subject to standard $20 flat-rate insured shipping. Tracking details will be generated only after bank wire clearance.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
