import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
import { hashPassword, createSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 })
    }

    const emailNormalized = email.toLowerCase().trim()

    // 1. Check if user already exists
    const checkUser = await pool.query(
      `SELECT id FROM neon_auth.user WHERE email = $1 LIMIT 1`,
      [emailNormalized]
    )

    if (checkUser.rows.length > 0) {
      return NextResponse.json({ error: "Email is already registered" }, { status: 409 })
    }

    // 2. Insert into neon_auth.user
    const userId = crypto.randomUUID()
    await pool.query(
      `INSERT INTO neon_auth.user (id, name, email, "emailVerified", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, false, NOW(), NOW())`,
      [userId, name, emailNormalized]
    )

    // 3. Hash password and insert into public.user_credentials
    const passHash = hashPassword(password)
    await pool.query(
      `INSERT INTO public.user_credentials (user_id, password_hash)
       VALUES ($1, $2)`,
      [userId, passHash]
    )

    // 4. Insert default public.user_profiles
    await pool.query(
      `INSERT INTO public.user_profiles (user_id, subscription_tier)
       VALUES ($1, 'free')`,
      [userId]
    )

    // 5. Establish Session
    const userAgent = request.headers.get("user-agent") || ""
    // Extract IP address from headers
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] || ""

    await createSession(userId, userAgent, ipAddress)

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        name,
        email: emailNormalized,
        subscriptionTier: "free",
      },
    })
  } catch (error: unknown) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to register user" },
      { status: 500 }
    )
  }
}
