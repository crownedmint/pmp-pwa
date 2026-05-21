import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

export const dynamic = "force-dynamic"

const SYMBOL_MAP: Record<string, string> = {
  XAU: "Gold",
  XAG: "Silver",
  XPT: "Platinum",
  XPD: "Palladium",
}

const ELEMENT_MAP: Record<string, string> = {
  XAU: "Au",
  XAG: "Ag",
  XPT: "Pt",
  XPD: "Pd",
}

export async function GET() {
  try {
    // Latest price per metal
    const latestQuery = `
      SELECT DISTINCT ON (symbol)
        symbol,
        price_usd,
        timestamp
      FROM syg_metal_prices
      ORDER BY symbol, timestamp DESC
    `
    const latest = await pool.query(latestQuery)

    // Previous price (~ 24h ago) for daily change calc
    const prevQuery = `
      SELECT DISTINCT ON (symbol)
        symbol,
        price_usd,
        timestamp
      FROM syg_metal_prices
      WHERE timestamp <= NOW() - INTERVAL '24 hours'
      ORDER BY symbol, timestamp DESC
    `
    const prev = await pool.query(prevQuery)

    const prevMap = new Map<string, number>(
      prev.rows.map((r: { symbol: string; price_usd: string }) => [
        r.symbol,
        parseFloat(r.price_usd),
      ])
    )

    const metals = latest.rows.map(
      (row: { symbol: string; price_usd: string; timestamp: string }) => {
        const current = parseFloat(row.price_usd)
        const previous = prevMap.get(row.symbol)
        const change = previous !== undefined ? current - previous : 0
        const changePercent = previous !== undefined && previous !== 0
          ? ((change / previous) * 100).toFixed(2)
          : "0.00"

        return {
          symbol: row.symbol,
          name: SYMBOL_MAP[row.symbol] || row.symbol,
          element: ELEMENT_MAP[row.symbol] || row.symbol,
          price: current,
          change: parseFloat(change.toFixed(2)),
          changePercent: parseFloat(changePercent),
          timestamp: row.timestamp,
        }
      }
    )

    // Sort: Gold, Silver, Platinum, Palladium
    const order = ["XAU", "XAG", "XPT", "XPD"]
    metals.sort(
      (a: { symbol: string }, b: { symbol: string }) =>
        order.indexOf(a.symbol) - order.indexOf(b.symbol)
    )

    return NextResponse.json({ metals, updatedAt: new Date().toISOString() })
  } catch (error) {
    console.error("Failed to fetch metals prices:", error)
    return NextResponse.json(
      { error: "Failed to fetch prices" },
      { status: 500 }
    )
  }
}
