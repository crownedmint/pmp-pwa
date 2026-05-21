import crypto from "crypto"
import { pool } from "@/lib/db"
import { cookies } from "next/headers"

// Hashing algorithms
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex")
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex")
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, originalHash] = storedHash.split(":")
    if (!salt || !originalHash) return false
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex")
    return hash === originalHash
  } catch {
    return false
  }
}

// Session Management
export async function createSession(userId: string, userAgent?: string, ipAddress?: string) {
  const token = crypto.randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

  // Insert session into neon_auth.session
  const query = `
    INSERT INTO neon_auth.session (id, token, "userId", "expiresAt", "createdAt", "updatedAt", "ipAddress", "userAgent")
    VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW(), $4, $5)
    RETURNING token
  `
  await pool.query(query, [token, userId, expiresAt, ipAddress || null, userAgent || null])

  // Set httpOnly cookie
  const cookieStore = await cookies()
  cookieStore.set("pmp_session_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  })

  return token
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("pmp_session_token")?.value

    if (!token) return null

    // Get session and user details
    const sessionQuery = `
      SELECT s."userId", s."expiresAt", u.name, u.email, u.image, u.role
      FROM neon_auth.session s
      JOIN neon_auth.user u ON s."userId" = u.id
      WHERE s.token = $1
      LIMIT 1
    `
    const res = await pool.query(sessionQuery, [token])

    if (res.rows.length === 0) return null

    const session = res.rows[0]
    const expiresAt = new Date(session.expiresAt)

    // If session has expired, clean it up
    if (expiresAt.getTime() < Date.now()) {
      await pool.query(`DELETE FROM neon_auth.session WHERE token = $1`, [token])
      const cookieStoreCleared = await cookies()
      cookieStoreCleared.delete("pmp_session_token")
      return null
    }

    // Fetch profile details
    const profileQuery = `
      SELECT phone, shipping_address, billing_address, subscription_tier, 
             alert_price, alert_drops, alert_escrow, alert_chat
      FROM public.user_profiles
      WHERE user_id = $1
      LIMIT 1
    `
    const profileRes = await pool.query(profileQuery, [session.userId])
    const profile = profileRes.rows[0] || {}

    return {
      id: session.userId,
      name: session.name,
      email: session.email,
      image: session.image,
      role: session.role,
      phone: profile.phone || "",
      shippingAddress: profile.shipping_address || "",
      billingAddress: profile.billing_address || "",
      subscriptionTier: profile.subscription_tier || "free",
      alerts: {
        price: profile.alert_price ?? true,
        drops: profile.alert_drops ?? true,
        escrow: profile.alert_escrow ?? true,
        chat: profile.alert_chat ?? true,
      },
    }
  } catch (error) {
    console.error("Error retrieving current user:", error)
    return null
  }
}

export async function destroySession() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("pmp_session_token")?.value

    if (token) {
      // Delete session from DB
      await pool.query(`DELETE FROM neon_auth.session WHERE token = $1`, [token])
    }

    // Clear cookie
    cookieStore.delete("pmp_session_token")
  } catch (error) {
    console.error("Error destroying session:", error)
  }
}
