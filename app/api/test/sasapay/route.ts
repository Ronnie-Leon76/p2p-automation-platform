import { sasaPayService } from "@/lib/payments/sasapay-service"
import { type NextRequest, NextResponse } from "next/server"

/**
 * Test endpoint for SasaPay authentication and basic functionality
 * This endpoint helps verify that your SasaPay integration is working correctly
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'auth'

    switch (action) {
      case 'auth':
        // Test authentication
        try {
          const token = await sasaPayService.testAuthentication()
          
          return NextResponse.json({
            success: true,
            message: 'SasaPay authentication successful',
            token_preview: `${token.substring(0, 20)}...`,
            timestamp: new Date().toISOString(),
          })
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: 'Authentication failed',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
          }, { status: 401 })
        }

      case 'balance':
        // Test balance query
        try {
          const balance = await sasaPayService.getBalance()
          return NextResponse.json({
            success: true,
            message: 'Balance retrieved successfully',
            data: balance,
            timestamp: new Date().toISOString(),
          })
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: 'Balance query failed',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
          }, { status: 500 })
        }

      case 'config':
        // Show configuration (without sensitive data)
        return NextResponse.json({
          success: true,
          config: {
            client_id: process.env.SASAPAY_CLIENT_ID?.substring(0, 10) + '...',
            environment: process.env.SASAPAY_ENVIRONMENT,
            callback_url: process.env.SASAPAY_CALLBACK_URL,
            base_url: process.env.SASAPAY_ENVIRONMENT === 'production' 
              ? 'https://api.sasapay.app' 
              : 'https://sandbox.sasapay.app',
          },
          timestamp: new Date().toISOString(),
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
          available_actions: ['auth', 'balance', 'config'],
          usage: 'Add ?action=auth|balance|config to test different functions',
        }, { status: 400 })
    }

  } catch (error) {
    console.error('SasaPay test endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone_number, amount = 10 } = body

    if (!phone_number) {
      return NextResponse.json({
        success: false,
        error: 'Missing phone_number for test payment',
        example: {
          phone_number: '254700000000',
          amount: 10
        }
      }, { status: 400 })
    }

    // Test payment initiation
    const testPayment = await sasaPayService.initiatePayment({
      amount: Number(amount),
      currency: 'KES',
      phone_number,
      merchant_reference: `TEST_${Date.now()}`,
      description: 'SasaPay Integration Test Payment',
    })

    return NextResponse.json({
      success: true,
      message: 'Test payment initiated successfully',
      data: testPayment,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('SasaPay test payment error:', error)
    return NextResponse.json({
      success: false,
      error: 'Test payment failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}
