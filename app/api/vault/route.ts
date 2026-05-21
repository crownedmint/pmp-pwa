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
      SELECT id, title, description, metal, category, weight, 
             weight_unit as "weightUnit", purity, 
             purchase_price as "purchasePrice", 
             purchase_spot_price as "purchaseSpotPrice", 
             purchase_date as "purchaseDate", 
             target_growth as "targetGrowth", 
             target_growth_type as "targetGrowthType", 
             is_archived as "isArchived", 
             created_at as "createdAt"
      FROM public.vault_items
      WHERE user_id = $1
      ORDER BY created_at DESC
    `
    const res = await pool.query(query, [user.id])

    const items = res.rows.map(row => ({
      ...row,
      weight: parseFloat(row.weight),
      purchasePrice: parseFloat(row.purchasePrice),
      purchaseSpotPrice: parseFloat(row.purchaseSpotPrice),
      targetGrowth: row.targetGrowth ? parseFloat(row.targetGrowth) : null,
      purchaseDate: row.purchaseDate ? new Date(row.purchaseDate).toISOString().split('T')[0] : "",
    }))

    return NextResponse.json({ items })
  } catch (error: unknown) {
    console.error("Vault fetch error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch vault items" },
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
      title,
      description,
      metal,
      category,
      weight,
      weightUnit,
      purity,
      purchasePrice,
      purchaseSpotPrice,
      purchaseDate,
      targetGrowth,
      targetGrowthType,
    } = data

    if (!title || !metal || !category || weight === undefined || !weightUnit || !purity || purchasePrice === undefined || purchaseSpotPrice === undefined || !purchaseDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const query = `
      INSERT INTO public.vault_items (
        user_id, title, description, metal, category, weight, weight_unit, purity, 
        purchase_price, purchase_spot_price, purchase_date, target_growth, target_growth_type, is_archived
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, false)
      RETURNING id
    `
    const res = await pool.query(query, [
      user.id,
      title,
      description || null,
      metal,
      category,
      weight,
      weightUnit,
      purity,
      purchasePrice,
      purchaseSpotPrice,
      purchaseDate,
      targetGrowth || null,
      targetGrowthType || null,
    ])

    return NextResponse.json({ success: true, id: res.rows[0].id })
  } catch (error: unknown) {
    console.error("Vault add error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add vault item" },
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
    const { id, isArchived, targetGrowth, targetGrowthType } = data

    if (!id) {
      return NextResponse.json({ error: "Vault item id is required" }, { status: 400 })
    }

    // Support toggle archive or edit target growth
    let query = ""
    let params: unknown[] = []

    if (isArchived !== undefined) {
      query = `
        UPDATE public.vault_items
        SET is_archived = $1,
            updated_at = NOW()
        WHERE id = $2 AND user_id = $3
      `
      params = [isArchived, id, user.id]
    } else {
      query = `
        UPDATE public.vault_items
        SET target_growth = $1,
            target_growth_type = $2,
            updated_at = NOW()
        WHERE id = $3 AND user_id = $4
      `
      params = [targetGrowth || null, targetGrowthType || null, id, user.id]
    }

    const res = await pool.query(query, params)

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error("Vault update error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update vault item" },
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
      `DELETE FROM public.vault_items WHERE id = $1 AND user_id = $2`,
      [id, user.id]
    )

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error("Vault delete error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete vault item" },
      { status: 500 }
    )
  }
}
