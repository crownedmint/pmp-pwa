"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Clock, Send } from "lucide-react"
import { METAL_CONFIG, formatCurrency, DropItem } from "@/lib/catalog"

interface ChatMessage {
  id: string
  sender: "system" | "admin" | "user"
  text: string
  timestamp: string | Date
}

const STORAGE_RESERVE_KEY = "pmp-active-reservation"
const STORAGE_CHAT_KEY = "pmp-reservation-chat"

export default function EscrowChatPage() {
  const router = useRouter()
  
  const [chatItem, setChatItem] = useState<DropItem | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [reserveSeconds, setReserveSeconds] = useState(0)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const chatEndRef = useRef<HTMLDivElement | null>(null)

  // Load reservation and chat history
  useEffect(() => {
    try {
      const savedRes = localStorage.getItem(STORAGE_RESERVE_KEY)
      if (savedRes) {
        const data = JSON.parse(savedRes)
        const expiredAt = data.expiredAt
        const now = Date.now()
        
        if (now < expiredAt) {
          setChatItem(data.item)
          setReserveSeconds(Math.floor((expiredAt - now) / 1000))
          
          const savedChat = localStorage.getItem(STORAGE_CHAT_KEY)
          if (savedChat) {
            setChatMessages(JSON.parse(savedChat))
          }
        } else {
          // Reservation expired
          localStorage.removeItem(STORAGE_RESERVE_KEY)
          localStorage.removeItem(STORAGE_CHAT_KEY)
          alert("Your reservation window has expired.")
          router.push("/drop")
        }
      } else {
        // No active reservation
        alert("No active reservation found.")
        router.push("/drop")
      }
    } catch (e) {
      console.error(e)
      router.push("/drop")
    }
  }, [router])

  // Countdown timer
  useEffect(() => {
    if (reserveSeconds > 0 && chatItem) {
      timerRef.current = setInterval(() => {
        setReserveSeconds(s => {
          if (s <= 1) {
            if (timerRef.current) clearInterval(timerRef.current)
            localStorage.removeItem(STORAGE_RESERVE_KEY)
            localStorage.removeItem(STORAGE_CHAT_KEY)
            setChatItem(null)
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

  const handleSendMessage = () => {
    if (!chatInput.trim() || !chatItem) return

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: chatInput.trim(),
      timestamp: new Date()
    }
    const updated = [...chatMessages, userMsg]
    setChatMessages(updated)
    localStorage.setItem(STORAGE_CHAT_KEY, JSON.stringify(updated))
    setChatInput("")

    // Simulated admin reply after 2 seconds
    setTimeout(() => {
      const replyMsg: ChatMessage = {
        id: `admin-reply-${Date.now()}`,
        sender: "admin",
        text: "Confirmation received! Our operations desk is reviewing the transfer. We will send tracking details once the vault clears the shipment.",
        timestamp: new Date()
      }
      setChatMessages(prev => {
        const next = [...prev, replyMsg]
        localStorage.setItem(STORAGE_CHAT_KEY, JSON.stringify(next))
        return next
      })
    }, 2000)
  }

  if (!chatItem) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center text-xs text-muted-foreground">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent mb-2" />
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
