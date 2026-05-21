"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, MessageSquare, ChevronDown, ChevronUp, Send } from "lucide-react"

interface FAQItem {
  q: string
  a: string
}

const FAQS: FAQItem[] = [
  {
    q: "How does the physical drop reservation work?",
    a: "When a drop is active, you can reserve a 1-of-1 vaulted physical metal asset. You then have 90 minutes to execute a bank wire or Zelle transfer and upload proof in the transaction chat. Once our audit desk verifies receipt, the metal is locked, insured, and staged for shipment."
  },
  {
    q: "What index is used for live spot prices?",
    a: "We pull live price feeds every 60 seconds from gold, silver, platinum, and palladium spot indices. The calculator applies standard purity ratios to compile base melt value in real-time."
  },
  {
    q: "Are my portfolio holdings private?",
    a: "Yes. Your inventory logs are stored client-side in secure local storage. In a future update, you can optionally enable cloud backups which encrypt your vault data end-to-end before storing."
  },
  {
    q: "How are the margins calculated in the guide?",
    a: "The scrap calculator Dealer's Buying Guide calculates estimated profit by determining total pure content value at spot minus your entered payout rate. The remainder represents your raw dealer buy spread."
  }
]

export default function SupportPage() {
  const router = useRouter()
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  
  // Form State
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) return
    setSubmitting(true)
    setTimeout(() => {
      alert("Support message submitted! We will contact you at carlos@pmpro.app within 12 hours.")
      setSubject("")
      setMessage("")
      setSubmitting(false)
    }, 1500)
  }

  return (
    <div className="flex flex-col px-4 pb-24 max-w-lg mx-auto">
      <header className="flex items-center gap-3 pt-4 pb-3 border-b border-border/20 mb-4">
        <button onClick={() => router.back()} className="p-1 rounded-full text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold tracking-tight">Support & Help</h1>
          <p className="text-[10px] text-muted-foreground">Browse FAQs or message the help desk</p>
        </div>
      </header>

      <div className="space-y-4">
        {/* FAQs */}
        <section className="rounded-xl border border-border/40 bg-card p-4 space-y-2.5">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">
            Frequently Asked Questions
          </h2>
          <div className="space-y-2">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx
              return (
                <div key={faq.q} className="border border-border/20 rounded-lg bg-background/30 overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-3 text-left text-xs font-bold text-foreground hover:bg-card/45 transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                  </button>
                  {isOpen && (
                    <div className="p-3 border-t border-border/10 text-xs text-muted-foreground leading-relaxed bg-card/10">
                      {faq.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* Contact Form */}
        <section className="rounded-xl border border-border/40 bg-card p-4 space-y-3">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-1.5 mb-1">
            <MessageSquare className="h-3.5 w-3.5" />
            Contact Help Desk
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-[9px] font-bold uppercase text-muted-foreground block mb-1">Subject</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Wire verification delay..."
                className="w-full rounded-lg border border-border/30 bg-background/50 px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase text-muted-foreground block mb-1">Message Description</label>
              <textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue or custom order requirements in detail..."
                className="w-full rounded-lg border border-border/30 bg-background/50 px-3 py-2 text-xs font-semibold outline-none focus:border-primary h-24 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
              {submitting ? "Sending Ticket..." : "Submit Ticket"}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
