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

    const query = `
      SELECT id, metal, direction, 
             target_price as "targetPrice", 
             is_triggered as "isTriggered", 
             triggered_at as "triggeredAt", 
             created_at as "createdAt"
      FROM public.custom_price_alerts
      WHERE user_id = $1
      ORDER BY created_at DESC
    `
    const res = await pool.query(query, [user.id])

    const alerts = res.rows.map(row => ({
      ...row,
      targetPrice: parseFloat(row.targetPrice),
      triggeredAt: row.triggeredAt ? new Date(row.triggeredAt).toISOString() : null,
    }))

    return NextResponse.json({ alerts })
  } catch (error: unknown) {
    console.error("Alerts fetch error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch alerts" },
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
    const { metal, direction, targetPrice } = data

    if (!metal || !direction || targetPrice === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const query = `
      INSERT INTO public.custom_price_alerts (
        user_id, metal, direction, target_price
      ) VALUES ($1, $2, $3, $4)
      RETURNING id
    `
    const res = await pool.query(query, [
      user.id,
      metal,
      direction,
      targetPrice,
    ])

    return NextResponse.json({ success: true, id: res.rows[0].id })
  } catch (error: unknown) {
    console.error("Alert add error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add alert" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const { id } = data

    if (!id) {
      return NextResponse.json({ error: "Alert ID is required" }, { status: 400 })
    }

    const query = `
      UPDATE public.custom_price_alerts
      SET is_triggered = true,
          triggered_at = NOW()
      WHERE id = $1 AND user_id = $2
    `
    await pool.query(query, [id, user.id])

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error("Alert update error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update alert" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "id parameter is required" }, { status: 400 })
    }

    await pool.query(
      `DELETE FROM public.custom_price_alerts WHERE id = $1 AND user_id = $2`,
      [id, user.id]
    )

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error("Alert delete error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete alert" },
      { status: 500 }
    )
  }
}
