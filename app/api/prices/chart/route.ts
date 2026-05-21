import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const symbol = searchParams.get("symbol") || "XAU"
  const range = searchParams.get("range") || "24h"

  // Map range to interval
  const intervalMap: Record<string, string> = {
    "1h": "1 hour",
    "6h": "6 hours",
    "24h": "24 hours",
    "7d": "7 days",
    "30d": "30 days",
    "90d": "90 days",
    all: "999 days",
  }

  const interval = intervalMap[range] || "24 hours"

  // For longer ranges, sample fewer points to keep response fast
  const bucketMap: Record<string, string> = {
    "1h": "1 minute",
    "6h": "5 minutes",
    "24h": "15 minutes",
    "7d": "1 hour",
    "30d": "6 hours",
    "90d": "1 day",
    all: "1 day",
  }

  const bucket = bucketMap[range] || "15 minutes"

  try {
    // Use time_bucket-style sampling via date_trunc for broad compatibility
    const query = `
      SELECT
        date_trunc('${bucket === "1 minute" ? "minute" : bucket === "5 minutes" ? "minute" : bucket === "15 minutes" ? "minute" : bucket === "1 hour" ? "hour" : "day"}', timestamp) as bucket,
        AVG(price_usd::numeric) as price,
        MIN(price_usd::numeric) as low,
        MAX(price_usd::numeric) as high
      FROM syg_metal_prices
      WHERE symbol = $1
        AND timestamp >= NOW() - INTERVAL '${interval}'
      GROUP BY bucket
      ORDER BY bucket ASC
    `

    const result = await pool.query(query, [symbol.toUpperCase()])

    const data = result.rows.map(
      (row: {
        bucket: string
        price: string
        low: string
        high: string
      }) => ({
        time: row.bucket,
        price: parseFloat(parseFloat(row.price).toFixed(2)),
        low: parseFloat(parseFloat(row.low).toFixed(2)),
        high: parseFloat(parseFloat(row.high).toFixed(2)),
      })
    )

    return NextResponse.json({ symbol, range, data })
  } catch (error) {
    console.error("Failed to fetch chart data:", error)
    return NextResponse.json(
      { error: "Failed to fetch chart data" },
      { status: 500 }
    )
  }
}
