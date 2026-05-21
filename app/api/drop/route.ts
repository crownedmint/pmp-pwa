import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // 1. Auto-expire reservations that have exceeded the 90-minute lock
    await pool.query(`
      UPDATE public.catalog_items 
      SET is_reserved = false, 
          reserved_by = NULL, 
          reserved_at = NULL, 
          expired_at = NULL 
      WHERE is_reserved = true AND expired_at < NOW()
    `)

    // 2. Fetch all catalog items
    const query = `
      SELECT id, name, description, weight, purity, metal, category, price, premium, image_url, 
             is_reserved, reserved_by as "reservedBy", reserved_at as "reservedAt", expired_at as "expiredAt"
      FROM public.catalog_items
      ORDER BY id ASC
    `
    const res = await pool.query(query)
    
    // Format numeric columns to avoid JSON string representation
    const items = res.rows.map(row => ({
      ...row,
      weight: parseFloat(row.weight),
      price: row.price ? parseFloat(row.price) : null,
      premium: parseFloat(row.premium),
    }))

    return NextResponse.json({ items })
  } catch (error: unknown) {
    console.error("Drop catalog fetch error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch drop catalog" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 })
    }

    const { itemId, action } = await request.json()
    if (!itemId || !action) {
      return NextResponse.json({ error: "itemId and action are required" }, { status: 400 })
    }

    if (action === "reserve") {
      // 1. Check current status of the item
      const itemRes = await pool.query(
        `SELECT is_reserved, expired_at FROM public.catalog_items WHERE id = $1 LIMIT 1`,
        [itemId]
      )

      if (itemRes.rows.length === 0) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 })
      }

      const item = itemRes.rows[0]

      // Check if it's already reserved and not expired
      if (item.is_reserved && new Date(item.expired_at).getTime() > Date.now()) {
        return NextResponse.json({ error: "This item has already been reserved" }, { status: 409 })
      }

      // 2. Update item to reserved
      const expiredAt = new Date(Date.now() + 90 * 60 * 1000) // 90 minutes
      await pool.query(
        `UPDATE public.catalog_items
         SET is_reserved = true,
             reserved_by = $1,
             reserved_at = NOW(),
             expired_at = $2
         WHERE id = $3`,
        [user.id, expiredAt, itemId]
      )

      // 3. Insert system check-in message
      await pool.query(
        `INSERT INTO public.escrow_messages (item_id, user_id, sender, text)
         VALUES ($1, $2, 'system', 'Reservation secured! Direct Admin Escrow chat opened. 90-minute payment countdown started.')`,
        [itemId, user.id]
      )

      // Also trigger a simulated admin message in the background
      await pool.query(
        `INSERT INTO public.escrow_messages (item_id, user_id, sender, text)
         VALUES ($1, $2, 'admin', 'Hi! I see your reservation. Please submit your proof of payment (wire receipt or Zelle confirmation) here within the next 90 minutes to secure this metal lock.')`,
        [itemId, user.id]
      )

      return NextResponse.json({ success: true, expiredAt })
    } else if (action === "release") {
      // Release reservation
      await pool.query(
        `UPDATE public.catalog_items
         SET is_reserved = false,
             reserved_by = NULL,
             reserved_at = NULL,
             expired_at = NULL
         WHERE id = $1 AND reserved_by = $2`,
        [itemId, user.id]
      )

      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error: unknown) {
    console.error("Drop reservation error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process reservation" },
      { status: 500 }
    )
  }
}
