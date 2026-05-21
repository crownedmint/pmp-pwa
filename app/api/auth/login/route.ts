import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
import { verifyPassword, createSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const emailNormalized = email.toLowerCase().trim()

    // 1. Get user details and credentials
    const userQuery = `
      SELECT u.id, u.name, u.email, c.password_hash, p.subscription_tier
      FROM neon_auth.user u
      JOIN public.user_credentials c ON u.id = c.user_id
      LEFT JOIN public.user_profiles p ON u.id = p.user_id
      WHERE u.email = $1
      LIMIT 1
    `
    const res = await pool.query(userQuery, [emailNormalized])

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const user = res.rows[0]

    // 2. Verify password hash
    const isValid = verifyPassword(password, user.password_hash)
    if (!isValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // 3. Establish Session
    const userAgent = request.headers.get("user-agent") || ""
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] || ""

    await createSession(user.id, userAgent, ipAddress)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        subscriptionTier: user.subscription_tier || "free",
      },
    })
  } catch (error: unknown) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to log in" },
      { status: 500 }
    )
  }
}
