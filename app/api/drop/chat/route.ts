import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

        // 1. Find the active reservation for the user
    const reservationRes = await pool.query(
      `SELECT id, name, metal, category, price, premium, expired_at as "expiredAt"
       FROM public.catalog_items
       WHERE reserved_by = $1 AND is_reserved = true AND expired_at > NOW()
       LIMIT 1`,
      [user.id]
    )

    if (reservationRes.rows.length === 0) {
      return NextResponse.json({ messages: [], activeItem: null })
    }

    const activeItem = {
      ...reservationRes.rows[0],
      price: parseFloat(reservationRes.rows[0].price),
      premium: parseFloat(reservationRes.rows[0].premium),
    }

    // 2. Fetch messages
    const messagesRes = await pool.query(
      `SELECT id, sender, text, created_at as "createdAt"
       FROM public.escrow_messages
       WHERE user_id = $1 AND item_id = $2
       ORDER BY created_at ASC`,
      [user.id, activeItem.id]
    )

    return NextResponse.json({
      messages: messagesRes.rows,
      activeItem,
    })
  } catch (error: unknown) {
    console.error("Fetch escrow chat error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch messages" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { text } = await request.json()
    if (!text) {
      return NextResponse.json({ error: "Message text is required" }, { status: 400 })
    }

    // 1. Find active reservation
    const reservationRes = await pool.query(
      `SELECT id FROM public.catalog_items
       WHERE reserved_by = $1 AND is_reserved = true AND expired_at > NOW()
       LIMIT 1`,
      [user.id]
    )

    if (reservationRes.rows.length === 0) {
      return NextResponse.json({ error: "No active reservation found to chat for" }, { status: 404 })
    }

    const itemId = reservationRes.rows[0].id

    // 2. Insert User Message
    const userMsgRes = await pool.query(
      `INSERT INTO public.escrow_messages (item_id, user_id, sender, text)
       VALUES ($1, $2, 'user', $3)
       RETURNING id, sender, text, created_at as "createdAt"`,
      [itemId, user.id, text]
    )
    const userMsg = userMsgRes.rows[0]

    // 3. Simple Natural Simulated Admin Replies based on keywords
    const lowerText = text.toLowerCase()
    let adminReplyText = ""

    if (lowerText.includes("zelle") || lowerText.includes("wire") || lowerText.includes("receipt") || lowerText.includes("pay") || lowerText.includes("sent")) {
      adminReplyText = "Got it! Thanks for uploading your proof of payment. Our treasury desk is verifying the incoming ledger entry. We will release the escrow hold and automatically push this metal into your Vault Portfolio once confirmed (typically takes 5-10 minutes)."
    } else if (lowerText.includes("hello") || lowerText.includes("hi") || lowerText.includes("hey")) {
      adminReplyText = "Hello! Escrow Desk here. Let us know when the wire or Zelle is initiated so we can watch the ledger."
    } else {
      adminReplyText = "Acknowledged. Standing by for transaction receipt updates. Let us know if you run into any wire transfer limits."
    }

    // Insert simulated reply into database after a tiny delay simulation
    const adminMsgRes = await pool.query(
      `INSERT INTO public.escrow_messages (item_id, user_id, sender, text)
       VALUES ($1, $2, 'admin', $3)
       RETURNING id, sender, text, created_at as "createdAt"`,
      [itemId, user.id, adminReplyText]
    )
    const adminMsg = adminMsgRes.rows[0]

    return NextResponse.json({
      success: true,
      userMessage: userMsg,
      adminMessage: adminMsg,
    })
  } catch (error: unknown) {
    console.error("Post escrow chat error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send message" },
      { status: 500 }
    )
  }
}
