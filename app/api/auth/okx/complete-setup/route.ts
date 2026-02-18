import { createServerClient } from "@/lib/supabase/server"
import crypto from "crypto"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { address, signature, apiKey, apiSecret, passphrase } = await request.json()

    if (!address || !signature || !apiKey || !apiSecret || !passphrase) {
      return NextResponse.json({ error: "Missing required setup data" }, { status: 400 })
    }

    const supabase = await createServerClient()

    // Encrypt API credentials
    const encryptionKey = process.env.ENCRYPTION_KEY || "default-key-change-in-production"
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(encryptionKey).slice(0, 32), iv)

    let encryptedApiSecret = cipher.update(apiSecret, "utf8", "hex")
    encryptedApiSecret += cipher.final("hex")
    // Store IV with encrypted data
    encryptedApiSecret = iv.toString("hex") + ":" + encryptedApiSecret

    const passIv = crypto.randomBytes(16)
    const passCipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(encryptionKey).slice(0, 32), passIv)
    let encryptedPassphrase = passCipher.update(passphrase, "utf8", "hex")
    encryptedPassphrase += passCipher.final("hex")
    // Store IV with encrypted data
    encryptedPassphrase = passIv.toString("hex") + ":" + encryptedPassphrase

    // Create user account
    const { data: user, error: userError } = await supabase
      .from("users")
      .insert({
        wallet_address: address,
        wallet_signature: signature,
        exchange: "okx",
        api_key: apiKey,
        api_secret_encrypted: encryptedApiSecret,
        api_passphrase_encrypted: encryptedPassphrase,
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
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
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
      maxAge: 30 * 24 * 60 * 60, // 30 days
    })

    return response
  } catch (error) {
    console.error("OKX setup completion error:", error)
    return NextResponse.json({ error: "Failed to complete setup" }, { status: 500 })
  }
}