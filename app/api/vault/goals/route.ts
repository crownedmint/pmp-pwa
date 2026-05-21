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
      SELECT id, metal, target_weight as "targetWeight", 
             weight_unit as "weightUnit", 
             target_date as "targetDate", 
             created_at as "createdAt"
      FROM public.vault_goals
      WHERE user_id = $1
      ORDER BY created_at DESC
    `
    const res = await pool.query(query, [user.id])

    const goals = res.rows.map(row => ({
      ...row,
      targetWeight: parseFloat(row.targetWeight),
      targetDate: row.targetDate ? new Date(row.targetDate).toISOString().split('T')[0] : null,
    }))

    return NextResponse.json({ goals })
  } catch (error: unknown) {
    console.error("Vault goals fetch error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch vault goals" },
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
    const { metal, targetWeight, weightUnit, targetDate } = data

    if (!metal || targetWeight === undefined || !weightUnit) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const query = `
      INSERT INTO public.vault_goals (
        user_id, metal, target_weight, weight_unit, target_date
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `
    const res = await pool.query(query, [
      user.id,
      metal,
      targetWeight,
      weightUnit,
      targetDate || null,
    ])

    return NextResponse.json({ success: true, id: res.rows[0].id })
  } catch (error: unknown) {
    console.error("Vault goal add error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add vault goal" },
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
      `DELETE FROM public.vault_goals WHERE id = $1 AND user_id = $2`,
      [id, user.id]
    )

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error("Vault goal delete error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete vault goal" },
      { status: 500 }
    )
  }
}
