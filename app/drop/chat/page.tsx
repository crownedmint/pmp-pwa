"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Clock, Send, Loader2 } from "lucide-react"
import { METAL_CONFIG, formatCurrency, DropItem } from "@/lib/catalog"

interface ChatMessage {
  id: string
  sender: "system" | "admin" | "user"
  text: string
  timestamp: string | Date
}

export default function EscrowChatPage() {
  const router = useRouter()
  
  const [chatItem, setChatItem] = useState<DropItem | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [reserveSeconds, setReserveSeconds] = useState(0)
  const [loading, setLoading] = useState(true)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const chatEndRef = useRef<HTMLDivElement | null>(null)

  const fetchChatDetails = useCallback(async () => {
    try {
      const res = await fetch("/api/drop/chat")
      const data = await res.json()
      
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to load escrow details")
      }

      if (data.activeItem) {
        const item = data.activeItem
        setChatItem({
          id: item.id,
          name: item.name,
          description: item.description || "",
          metal: item.metal,
          category: item.category,
          weightOz: parseFloat(item.weight || 0),
          karat: item.purity || "",
          spotPrice: parseFloat(item.price || 0),
          premiumPct: parseFloat(item.premium || 0),
          finalPrice: item.price ? item.price * (1 + item.premium / 100) : 0,
          status: "reserved",
        })

        const exp = new Date(item.expiredAt).getTime()
        const diff = Math.floor((exp - Date.now()) / 1000)
        if (diff > 0) {
          setReserveSeconds(diff)
        } else {
          setReserveSeconds(0)
          alert("Your reservation window has expired.")
          router.push("/drop")
        }

        // Map messages
        if (data.messages) {
          const mappedMsgs: ChatMessage[] = data.messages.map((m: any) => ({
            id: String(m.id),
            sender: m.sender,
            text: m.text,
            timestamp: m.createdAt,
          }))
          
          // Inject system reservation message at the beginning if not present
          const sysMsgs: ChatMessage[] = [
            {
              id: "sys-init",
              sender: "system",
              text: `🔒 Item reserved. Your 90-minute payment window has started.\n\n🧾 RESERVATION INVOICE\n\n🏷️ Item: ${item.name}\n💰 Spot base: ${formatCurrency(parseFloat(item.price))}\n📈 Premium (${item.premium}%): +${formatCurrency(parseFloat(item.price) * (parseFloat(item.premium) / 100))}\n────────────────\n💵 TOTAL DUE: ${formatCurrency(parseFloat(item.price) * (1 + parseFloat(item.premium) / 100))}\n────────────────\n\nPayment Instructions:\n🏦 Bank Wire:\nBank: First National Bank\nRouting: 067014822\nAccount: 8845-2201-7739\nBeneficiary: Precious Metal Pro LLC\n\n📱 Zelle:\nSend to: payments@pmpro.app\n\nUpload a screenshot of your bank wire receipt or Zelle confirmation here. We'll verify and secure the metal immediately.`,
              timestamp: item.createdAt || new Date(),
            }
          ]
          
          setChatMessages([...sysMsgs, ...mappedMsgs])
        }
      } else {
        alert("No active reservation found.")
        router.push("/drop")
      }
    } catch (e: unknown) {
      console.error(e)
      alert(e instanceof Error ? e.message : "Error loading escrow page")
      router.push("/drop")
    } finally {
      setLoading(false)
    }
  }, [router])

  // Load reservation and chat history
  useEffect(() => {
    fetchChatDetails()
  }, [fetchChatDetails])

  // Countdown timer
  useEffect(() => {
    if (reserveSeconds > 0 && chatItem) {
      timerRef.current = setInterval(() => {
        setReserveSeconds(s => {
          if (s <= 1) {
            if (timerRef.current) clearInterval(timerRef.current)
            alert("Reservation window has expired.")
            router.push("/drop")
            return 0
          }
          return s - 1
        })
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [reserveSeconds, chatItem, router])

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, "0")}`
  }

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !chatItem) return

    const messageText = chatInput.trim()
    setChatInput("")

    // Local optimistic update
    const userMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      sender: "user",
      text: messageText,
      timestamp: new Date(),
    }
    setChatMessages(prev => [...prev, userMsg])

    try {
      const res = await fetch("/api/drop/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: messageText }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to deliver message")
      }

      // Replace optimistic message and append simulated admin message from database response
      if (data.userMessage && data.adminMessage) {
        setChatMessages(prev => {
          const filtered = prev.filter(m => !m.id.startsWith("temp-"))
          return [
            ...filtered,
            {
              id: String(data.userMessage.id),
              sender: data.userMessage.sender,
              text: data.userMessage.text,
              timestamp: data.userMessage.createdAt,
            },
            {
              id: String(data.adminMessage.id),
              sender: data.adminMessage.sender,
              text: data.adminMessage.text,
              timestamp: data.adminMessage.createdAt,
            }
          ]
        })
      }
    } catch (err: unknown) {
      console.error("Failed to send message:", err)
      alert("Failed to deliver message. Check database connection.")
    }
  }

  if (loading || !chatItem) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center text-xs text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
        Checking reservation escrow status...
      </div>
    )
  }

  const mc = METAL_CONFIG[chatItem.metal]

  return (
    <div className="fixed inset-x-0 top-0 bottom-[calc(64px+env(safe-area-inset-bottom,0px))] z-40 flex flex-col bg-background max-w-lg mx-auto border-x border-border/10 shadow-xl overflow-hidden animate-in fade-in duration-200">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border/40 px-4 pt-[calc(env(safe-area-inset-top,0px)+12px)] pb-3 bg-card shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push("/drop?tab=activity")} 
            className="p-1 rounded-full text-muted-foreground hover:text-foreground active:bg-accent"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="text-2xl shrink-0">{mc.emoji}</span>
          <div>
            <h4 className="text-xs font-extrabold leading-tight text-foreground line-clamp-1">{chatItem.name}</h4>
            <div className="flex items-center gap-1 mt-0.5 text-[9px] font-black text-red-400">
              <Clock className="h-3 w-3 shrink-0" />
              <span>Escrow window: {formatTimer(reserveSeconds)}</span>
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-xs font-black text-primary tabular-nums">{formatCurrency(chatItem.finalPrice)}</span>
        </div>
      </header>

      {/* Message Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-background/30">
        {chatMessages.map(msg => {
          if (msg.sender === "system") {
            return (
              <div key={msg.id} className="mx-auto max-w-xs rounded-lg border border-border/30 bg-muted/30 px-3 py-2 text-[10px] text-center text-muted-foreground leading-normal whitespace-pre-wrap">
                {msg.text}
              </div>
            )
          }
          const isAdmin = msg.sender === "admin"
          return (
            <div key={msg.id} className={`flex flex-col ${isAdmin ? "items-start" : "items-end"}`}>
              <span className="text-[9px] text-muted-foreground/60 mb-1 ml-1.5 mr-1.5 font-bold uppercase tracking-wider">
                {isAdmin ? "Admin Desk" : "You"}
              </span>
              <div 
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-normal whitespace-pre-wrap ${
                  isAdmin 
                    ? "bg-card border border-border/30 text-foreground" 
                    : "bg-primary text-primary-foreground font-medium"
                }`}
              >
                {msg.text}
              </div>
            </div>
          )
        })}
        <div ref={chatEndRef} />
      </main>

      {/* Input Area */}
      <footer className="border-t border-border/40 p-4 bg-card shrink-0 flex gap-2">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          placeholder="Message Admin Desk..."
          className="flex-1 rounded-xl border border-border/40 bg-background px-4 py-3 text-xs font-semibold outline-none focus:border-primary placeholder:text-muted-foreground/50"
        />
        <button 
          onClick={handleSendMessage}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground active:scale-90 transition-transform"
        >
          <Send className="h-4.5 w-4.5" />
        </button>
      </footer>
    </div>
  )
}
