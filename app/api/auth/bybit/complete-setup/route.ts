import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/database/server-client"
import { getBackendAdapter } from "@/lib/composition/backend-adapter"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    if (getBackendAdapter() === "postgres") {
      return NextResponse.json(
        { error: "Legacy exchange setup endpoint is disabled in postgres mode. Use Better Auth + /api/okx/credentials." },
        { status: 410 }
      )
    }

    const { apiKey, apiSecret, accessToken, refreshToken } = await request.json()

    if (!apiKey || !apiSecret) {
      return NextResponse.json({ error: "Missing required setup data" }, { status: 400 })
    }

    const supabase = await createServerClient()

    // Encrypt API credentials
    const encryptionKey = process.env.ENCRYPTION_KEY || "default-key-change-in-production"
    // Create a key of correct length (32 bytes for AES-256)
    const key = crypto.scryptSync(encryptionKey, 'salt', 32);
    // Generate a random initialization vector
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

    let encryptedApiSecret = cipher.update(apiSecret, "utf8", "hex")
    encryptedApiSecret += cipher.final("hex")
    // Store IV with encrypted data for decryption later
    encryptedApiSecret = iv.toString('hex') + ':' + encryptedApiSecret

    // Create user account
    const { data: user, error: userError } = await supabase
      .from("users")
      .insert({
        exchange: "bybit",
        api_key: apiKey,
        api_secret_encrypted: encryptedApiSecret,
        access_token: accessToken,
        refresh_token: refreshToken,
        is_verified: true,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (userError) {
      console.error("User creation error:", userError)
      return NextResponse.json({ error: "Failed to create user account" }, { status: 500 })
    }

    // Create session
    const sessionToken = crypto.randomUUID()
    const { error: sessionError } = await supabase.from("user_sessions").insert({
      user_id: user.id,
      session_token: sessionToken,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    })

    if (sessionError) {
      console.error("Session creation error:", sessionError)
    }

    // Set session cookie
    const response = NextResponse.json({ success: true, userId: user.id })
    response.cookies.set("session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
    })

    return response
  } catch (error) {
    console.error("Bybit setup completion error:", error)
    return NextResponse.json({ error: "Failed to complete setup" }, { status: 500 })
  }
}

