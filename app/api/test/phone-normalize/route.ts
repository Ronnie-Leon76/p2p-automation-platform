import { type NextRequest, NextResponse } from "next/server"

/**
 * Test Phone Number Normalization Endpoint
 * Tests phone number format handling for Kenya
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone } = body
    
    if (!phone) {
      return NextResponse.json(
        {
          success: false,
          error: "Phone number is required",
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }
    
    console.log(`Testing phone normalization for: ${phone}`)
    
    // Kenya phone normalization for local testing
    const digits = String(phone).replace(/\D/g, "")
    let normalizedPhone = digits
    if (digits.startsWith("0")) normalizedPhone = `254${digits.slice(1)}`
    if (digits.startsWith("7") && digits.length === 9) normalizedPhone = `254${digits}`
    if (digits.startsWith("254") && digits.length > 12) normalizedPhone = digits.slice(0, 12)
    
    return NextResponse.json({
      success: true,
      message: "Phone number normalized successfully",
      original: phone,
      normalized: normalizedPhone,
      valid: normalizedPhone.startsWith('254') && normalizedPhone.length === 12,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error("Phone normalization test failed:", error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Phone normalization failed",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
