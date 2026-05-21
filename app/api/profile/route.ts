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
    return NextResponse.json({ profile: user })
  } catch (error: unknown) {
    console.error("Profile GET error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch profile" },
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

    const data = await request.json()
    const {
      name,
      phone,
      shippingAddress,
      billingAddress,
      subscriptionTier,
      alerts,
    } = data

    // 1. Update user name if provided
    if (name) {
      await pool.query(
        `UPDATE neon_auth.user SET name = $1, "updatedAt" = NOW() WHERE id = $2`,
        [name, user.id]
      )
    }

    // 2. Upsert public.user_profiles
    const checkProfile = await pool.query(
      `SELECT user_id FROM public.user_profiles WHERE user_id = $1 LIMIT 1`,
      [user.id]
    )

    if (checkProfile.rows.length === 0) {
      // Insert
      const insertQuery = `
        INSERT INTO public.user_profiles (
          user_id, phone, shipping_address, billing_address, subscription_tier, 
          alert_price, alert_drops, alert_escrow, alert_chat
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `
      await pool.query(insertQuery, [
        user.id,
        phone || null,
        shippingAddress || null,
        billingAddress || null,
        subscriptionTier || "free",
        alerts?.price ?? true,
        alerts?.drops ?? true,
        alerts?.escrow ?? true,
        alerts?.chat ?? true,
      ])
    } else {
      // Update
      const updateQuery = `
        UPDATE public.user_profiles
        SET phone = COALESCE($1, phone),
            shipping_address = COALESCE($2, shipping_address),
            billing_address = COALESCE($3, billing_address),
            subscription_tier = COALESCE($4, subscription_tier),
            alert_price = COALESCE($5, alert_price),
            alert_drops = COALESCE($6, alert_drops),
            alert_escrow = COALESCE($7, alert_escrow),
            alert_chat = COALESCE($8, alert_chat)
        WHERE user_id = $9
      `
      await pool.query(updateQuery, [
        phone !== undefined ? phone : null,
        shippingAddress !== undefined ? shippingAddress : null,
        billingAddress !== undefined ? billingAddress : null,
        subscriptionTier !== undefined ? subscriptionTier : null,
        alerts?.price !== undefined ? alerts.price : null,
        alerts?.drops !== undefined ? alerts.drops : null,
        alerts?.escrow !== undefined ? alerts.escrow : null,
        alerts?.chat !== undefined ? alerts.chat : null,
        user.id,
      ])
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error("Profile update error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update profile" },
      { status: 500 }
    )
  }
}
