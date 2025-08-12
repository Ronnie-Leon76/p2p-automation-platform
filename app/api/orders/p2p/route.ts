import { P2POrderManager } from "@/lib/payments/p2p-order-manager"
import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

/**
 * P2P Order Management API
 * Handles order matching, payment requests, and order lifecycle
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    const supabase = createServerClient()
    // Create P2P manager instance with the request-scoped supabase client
    const p2pOrderManager = new P2POrderManager(supabase)

    switch (action) {
      case 'match_order':
        return await handleMatchOrder(body, supabase)
      
      case 'confirm_payment_received':
        return await handleConfirmPaymentReceived(body, supabase)
      
      case 'request_payment':
        return await handleRequestPayment(body, supabase)
      
      case 'initiate_buy_order':
        return await handleInitiateBuyOrder(body, supabase)
      
      case 'check_payment_status':
        return await handleCheckPaymentStatus(body, supabase)
      
      case 'find_matching_transactions':
        return await handleFindMatchingTransactions(body, supabase)
      
      case 'expire_payments':
        return await handleExpirePayments(supabase)
      
      default:
        return NextResponse.json(
          { error: "Invalid action. Use: match_order, confirm_payment_received, request_payment, initiate_buy_order, check_payment_status, find_matching_transactions, expire_payments" },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error("P2P Order API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * Handle seller confirming payment received
 */
async function handleConfirmPaymentReceived(body: any, supabase: any) {
  const { order_id, seller_id } = body

  if (!order_id || !seller_id) {
    return NextResponse.json(
      { error: "Missing required fields: order_id, seller_id" },
      { status: 400 }
    )
  }

  try {
    // Create P2P manager instance with request-scoped supabase client
    const p2pOrderManager = new P2POrderManager(supabase)
    
    const result = await p2pOrderManager.handleSellerPaymentConfirmation(order_id, seller_id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      )
    }

    // Log the confirmation
    await supabase
      .from("order_logs")
      .insert({
        order_id,
        action: "payment_confirmed_by_seller",
        details: {
          seller_id,
          matched_transaction: result.matched_transaction?.id || null,
          confirmation_method: result.matched_transaction ? "automatic_match" : "manual",
          confirmed_at: new Date().toISOString(),
        },
        created_at: new Date().toISOString(),
      })

    return NextResponse.json({
      success: true,
      message: result.message,
      matched_transaction: result.matched_transaction,
      order_id,
    })

  } catch (error) {
    console.error("Payment confirmation error:", error)
    return NextResponse.json(
      { error: "Failed to confirm payment" },
      { status: 500 }
    )
  }
}

/**
 * Find potential matching transactions for manual review
 */
async function handleFindMatchingTransactions(body: any, supabase: any) {
  const { order_id, seller_id } = body

  if (!order_id || !seller_id) {
    return NextResponse.json(
      { error: "Missing required fields: order_id, seller_id" },
      { status: 400 }
    )
  }

  try {
    // Get order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .eq("seller_id", seller_id)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Order not found or unauthorized" },
        { status: 404 }
      )
    }

    // Get seller information
    const { data: seller, error: sellerError } = await supabase
      .from("users")
      .select("full_name, first_name, last_name, phone, email")
      .eq("id", seller_id)
      .single()

    if (sellerError || !seller) {
      return NextResponse.json(
        { error: "Seller information not found" },
        { status: 404 }
      )
    }

    const orderAmount = Number(order.amount_fiat)
    const tolerance = 1.0 // Allow larger tolerance for manual review
    
    // Search for potential matching transactions
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

    const { data: transactions, error } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("payment_method", "sasapay")
      .in("status", ["completed", "unmatched"])
      .gte("completed_at", twentyFourHoursAgo.toISOString())
      .is("order_id", null)
      .gte("amount", orderAmount - tolerance)
      .lte("amount", orderAmount + tolerance)
      .order("completed_at", { ascending: false })

    if (error) {
      console.error("Error searching for matching transactions:", error)
      return NextResponse.json(
        { error: "Failed to search for transactions" },
        { status: 500 }
      )
    }

    // Add matching score to each transaction
    const transactionsWithScore = (transactions || []).map((transaction: any) => {
      let score = 0
      let matchReasons: string[] = []

      // Amount match
      const amountDiff = Math.abs(transaction.amount - orderAmount)
      if (amountDiff === 0) {
        score += 50
        matchReasons.push("Exact amount match")
      } else if (amountDiff <= 0.01) {
        score += 40
        matchReasons.push("Near exact amount match")
      } else if (amountDiff <= tolerance) {
        score += 20
        matchReasons.push("Amount within tolerance")
      }

      // Name matching
      if (transaction.payer_name && seller.full_name) {
        const payerName = transaction.payer_name.toLowerCase()
        const sellerName = seller.full_name.toLowerCase()
        
        if (payerName.includes(sellerName) || sellerName.includes(payerName)) {
          score += 30
          matchReasons.push("Name similarity")
        }
      }

      // Phone matching
      if (transaction.payer_phone && seller.phone) {
        const cleanPayerPhone = transaction.payer_phone.replace(/\D/g, '')
        const cleanSellerPhone = seller.phone.replace(/\D/g, '')
        
        if (cleanPayerPhone.includes(cleanSellerPhone.slice(-9)) || 
            cleanSellerPhone.includes(cleanPayerPhone.slice(-9))) {
          score += 40
          matchReasons.push("Phone number match")
        }
      }

      // Timing - more recent transactions get higher score
      const hoursAgo = (Date.now() - new Date(transaction.completed_at).getTime()) / (1000 * 60 * 60)
      if (hoursAgo < 1) {
        score += 10
        matchReasons.push("Very recent")
      } else if (hoursAgo < 6) {
        score += 5
        matchReasons.push("Recent")
      }

      return {
        ...transaction,
        match_score: score,
        match_reasons: matchReasons,
        amount_difference: amountDiff,
        hours_ago: Math.round(hoursAgo * 10) / 10
      }
    })

    // Sort by match score
    transactionsWithScore.sort((a: any, b: any) => b.match_score - a.match_score)

    return NextResponse.json({
      success: true,
      order,
      seller,
      potential_matches: transactionsWithScore.slice(0, 10), // Top 10 matches
      search_criteria: {
        amount_range: `${orderAmount - tolerance} - ${orderAmount + tolerance}`,
        time_range: "Last 24 hours",
        seller_names: [seller.full_name, seller.first_name, seller.last_name].filter(Boolean),
        seller_phone: seller.phone
      }
    })

  } catch (error) {
    console.error("Find matching transactions error:", error)
    return NextResponse.json(
      { error: "Failed to find matching transactions" },
      { status: 500 }
    )
  }
}

/**
 * Handle order matching and payment request
 */
async function handleMatchOrder(body: any, supabase: any) {
  const { order_id, buyer_id, buyer_phone } = body

  if (!order_id || !buyer_id || !buyer_phone) {
    return NextResponse.json(
      { error: "Missing required fields: order_id, buyer_id, buyer_phone" },
      { status: 400 }
    )
  }

  try {
    // Create P2P manager instance with request-scoped supabase client
    const p2pOrderManager = new P2POrderManager(supabase)
    
    // Check if order exists and is available
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .eq("status", "active")
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Order not found or not available" },
        { status: 404 }
      )
    }

    // Prevent self-matching
    if (order.seller_id === buyer_id) {
      return NextResponse.json(
        { error: "Cannot match your own order" },
        { status: 400 }
      )
    }

    // Update order to matched status
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "matched",
        buyer_id,
        matched_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", order_id)

    if (updateError) {
      console.error("Failed to update order:", updateError)
      return NextResponse.json(
        { error: "Failed to match order" },
        { status: 500 }
      )
    }

    // Request payment from buyer
    const paymentResult = await p2pOrderManager.handleMatchedSellOrder(order_id, buyer_phone)

    if (!paymentResult.success) {
      return NextResponse.json(
        { 
          error: "Order matched but payment request failed",
          payment_error: paymentResult.error,
          order_id,
        },
        { status: 500 }
      )
    }

    // Log the order match
    await supabase
      .from("order_logs")
      .insert({
        order_id,
        action: "order_matched",
        details: {
          buyer_id,
          buyer_phone,
          payment_requested: true,
          checkout_request_id: paymentResult.checkout_request_id,
        },
        created_at: new Date().toISOString(),
      })

    return NextResponse.json({
      success: true,
      message: "Order matched and payment requested",
      order_id,
      transaction_id: paymentResult.transaction_id,
      checkout_request_id: paymentResult.checkout_request_id,
      customer_message: paymentResult.customer_message,
    })

  } catch (error) {
    console.error("Order matching error:", error)
    return NextResponse.json(
      { error: "Failed to match order" },
      { status: 500 }
    )
  }
}

/**
 * Handle manual payment request (if needed)
 */
async function handleRequestPayment(body: any, supabase: any) {
  const { order_id, buyer_phone } = body

  if (!order_id || !buyer_phone) {
    return NextResponse.json(
      { error: "Missing required fields: order_id, buyer_phone" },
      { status: 400 }
    )
  }

  try {
    // Create P2P manager instance with request-scoped supabase client
    const p2pOrderManager = new P2POrderManager(supabase)
    
    const paymentResult = await p2pOrderManager.handleMatchedSellOrder(order_id, buyer_phone)

    if (!paymentResult.success) {
      return NextResponse.json(
        { error: paymentResult.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Payment requested successfully",
      transaction_id: paymentResult.transaction_id,
      checkout_request_id: paymentResult.checkout_request_id,
      customer_message: paymentResult.customer_message,
    })

  } catch (error) {
    console.error("Payment request error:", error)
    return NextResponse.json(
      { error: "Failed to request payment" },
      { status: 500 }
    )
  }
}

/**
 * Initiate a buy order (B2C payment to seller)
 */
async function handleInitiateBuyOrder(body: any, supabase: any) {
  const { buy_order_id, buyer_id, seller_phone_number, amount } = body

  if (!buy_order_id || !buyer_id || !seller_phone_number || !amount) {
    return NextResponse.json(
      { error: "Missing required fields: buy_order_id, buyer_id, seller_phone_number, amount" },
      { status: 400 }
    )
  }

  try {
    // Create P2P manager instance with request-scoped supabase client
    const p2pOrderManager = new P2POrderManager(supabase)
    
    // Get the buy order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", buy_order_id)
      .eq("order_type", "buy")
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Buy order not found" },
        { status: 404 }
      )
    }

    // Initiate B2C payment to seller
    const result = await p2pOrderManager.handleMatchedBuyOrder(buy_order_id, buyer_id, seller_phone_number)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to initiate B2C payment" },
        { status: 400 }
      )
    }

    // Log the B2C payment initiation
    await supabase
      .from("order_logs")
      .insert({
        order_id: buy_order_id,
        action: "b2c_payment_initiated",
        details: {
          buyer_id: buyer_id,
          seller_phone: seller_phone_number,
          amount: amount,
          transaction_id: result.transaction_id,
          checkout_request_id: result.checkout_request_id,
          initiated_at: new Date().toISOString(),
        },
        created_at: new Date().toISOString(),
      })

    return NextResponse.json({
      success: true,
      message: "B2C payment initiated to seller",
      order_id: buy_order_id,
      transaction_id: result.transaction_id,
      checkout_request_id: result.checkout_request_id,
      customer_message: result.customer_message,
    })

  } catch (error) {
    console.error("Error initiating buy order:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to initiate buy order" },
      { status: 500 }
    )
  }
}

/**
 * Check payment status for an order
 */
async function handleCheckPaymentStatus(body: any, supabase: any) {
  const { order_id, transaction_id } = body

  if (!order_id && !transaction_id) {
    return NextResponse.json(
      { error: "Missing required field: order_id or transaction_id" },
      { status: 400 }
    )
  }

  try {
    let query = supabase
      .from("payment_transactions")
      .select(`
        *,
        orders(*)
      `)

    if (transaction_id) {
      query = query.eq("id", transaction_id)
    } else {
      query = query.eq("order_id", order_id)
    }

    const { data: transaction, error } = await query.single()

    if (error || !transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      transaction,
      order: transaction.orders,
    })

  } catch (error) {
    console.error("Payment status check error:", error)
    return NextResponse.json(
      { error: "Failed to check payment status" },
      { status: 500 }
    )
  }
}

/**
 * Handle expired payments cleanup
 */
async function handleExpirePayments(supabase: any) {
  try {
    // Create P2P manager instance with request-scoped supabase client
    const p2pOrderManager = new P2POrderManager(supabase)
    
    await p2pOrderManager.handleExpiredPayments()
    
    return NextResponse.json({
      success: true,
      message: "Expired payments processed",
    })

  } catch (error) {
    console.error("Expire payments error:", error)
    return NextResponse.json(
      { error: "Failed to process expired payments" },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint for order status and information
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('order_id')
    const status = searchParams.get('status')
    const sellerId = searchParams.get('seller_id')

    const supabase = createServerClient()

    if (orderId) {
      // Get specific order
      const { data: order, error } = await supabase
        .from("orders")
        .select(`
          *,
          payment_transactions(*)
        `)
        .eq("id", orderId)
        .single()

      if (error || !order) {
        return NextResponse.json(
          { error: "Order not found" },
          { status: 404 }
        )
      }

      return NextResponse.json({ order })
    }

    // Get orders with filters
    let query = supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })

    if (status) {
      query = query.eq("status", status)
    }

    if (sellerId) {
      query = query.eq("seller_id", sellerId)
    }

    const { data: orders, error } = await query.limit(50)

    if (error) {
      console.error("Error fetching orders:", error)
      return NextResponse.json(
        { error: "Failed to fetch orders" },
        { status: 500 }
      )
    }

    return NextResponse.json({ orders })

  } catch (error) {
    console.error("GET P2P orders error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
