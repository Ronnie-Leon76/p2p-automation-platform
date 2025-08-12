import { sasaPayService } from "@/lib/payments/sasapay-service"
import { type NextRequest, NextResponse } from "next/server"

/**
 * Test SasaPay Authentication Endpoint
 * Used for testing sandbox connectivity
 */

export async function POST(request: NextRequest) {
  try {
    console.log("Testing SasaPay authentication...")
    
    // Test authentication with SasaPay sandbox
    const accessToken = await sasaPayService.testAuthentication()
    
    if (accessToken) {
      return NextResponse.json({
        success: true,
        message: "SasaPay authentication successful",
        access_token: accessToken.substring(0, 20) + "...", // Partial token for security
        token_type: "Bearer",
        expires_in: 3600,
        environment: process.env.SASAPAY_ENVIRONMENT || "sandbox",
        timestamp: new Date().toISOString()
      })
    } else {
      throw new Error("Authentication failed - no token received")
    }
    
  } catch (error) {
    console.error("SasaPay authentication test failed:", error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Authentication test failed",
        environment: process.env.SASAPAY_ENVIRONMENT || "sandbox",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
