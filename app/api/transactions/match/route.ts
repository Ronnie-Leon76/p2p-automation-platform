import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

/**
 * Manual Transaction Matching API
 * Allows manual linking of transactions to orders when automatic matching fails
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { order_id, transaction_id, seller_id, confirmed_by_admin = false } = body

    if (!order_id || !transaction_id || !seller_id) {
      return NextResponse.json(
        { error: "Missing required fields: order_id, transaction_id, seller_id" },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Verify order belongs to seller
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

    // Verify transaction exists and is unmatched
    const { data: transaction, error: transactionError } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("id", transaction_id)
      .is("order_id", null)
      .single()

    if (transactionError || !transaction) {
      return NextResponse.json(
        { error: "Transaction not found or already matched" },
        { status: 404 }
      )
    }

    // Validate amounts match (with tolerance)
    const orderAmount = Number(order.amount_fiat)
    const transactionAmount = Number(transaction.amount)
    const tolerance = 1.0 // Allow 1 unit difference
    
    if (Math.abs(orderAmount - transactionAmount) > tolerance) {
      return NextResponse.json(
        { 
          error: "Amount mismatch", 
          order_amount: orderAmount,
          transaction_amount: transactionAmount,
          difference: Math.abs(orderAmount - transactionAmount)
        },
        { status: 400 }
      )
    }

    // Link transaction to order
    const { error: updateError } = await supabase
      .from("payment_transactions")
      .update({
        order_id: order_id,
        user_id: order.buyer_id,
        status: "completed",
        metadata: {
          ...transaction.metadata,
          manually_matched: true,
          matched_by: seller_id,
          matched_at: new Date().toISOString(),
          admin_confirmed: confirmed_by_admin,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", transaction_id)

    if (updateError) {
      console.error("Failed to link transaction to order:", updateError)
      return NextResponse.json(
        { error: "Failed to link transaction" },
        { status: 500 }
      )
    }

    // Update order status
    const { error: orderUpdateError } = await supabase
      .from("orders")
      .update({
        status: "payment_confirmed",
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", order_id)

    if (orderUpdateError) {
      console.error("Failed to update order status:", orderUpdateError)
      return NextResponse.json(
        { error: "Failed to update order" },
        { status: 500 }
      )
    }

    // Log the manual match
    await supabase
      .from("order_logs")
      .insert({
        order_id,
        action: "manual_transaction_match",
        details: {
          transaction_id,
          seller_id,
          order_amount: orderAmount,
          transaction_amount: transactionAmount,
          amount_difference: Math.abs(orderAmount - transactionAmount),
          admin_confirmed: confirmed_by_admin,
          matched_at: new Date().toISOString(),
        },
        created_at: new Date().toISOString(),
      })

    // TODO: Trigger order completion workflow
    // This should release the crypto to the buyer

    return NextResponse.json({
      success: true,
      message: "Transaction manually linked to order",
      order_id,
      transaction_id,
      order_status: "payment_confirmed",
    })

  } catch (error) {
    console.error("Manual transaction matching error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * Get unmatched transactions for review
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const hours = Number(searchParams.get('hours')) || 24
    const minAmount = Number(searchParams.get('min_amount')) || 0
    const maxAmount = Number(searchParams.get('max_amount')) || 1000000

    const supabase = createServerClient()

    const hoursAgo = new Date()
    hoursAgo.setHours(hoursAgo.getHours() - hours)

    // Get unmatched SasaPay transactions
    const { data: transactions, error } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("payment_method", "sasapay")
      .in("status", ["completed", "unmatched"])
      .is("order_id", null)
      .gte("completed_at", hoursAgo.toISOString())
      .gte("amount", minAmount)
      .lte("amount", maxAmount)
      .order("completed_at", { ascending: false })

    if (error) {
      console.error("Error fetching unmatched transactions:", error)
      return NextResponse.json(
        { error: "Failed to fetch transactions" },
        { status: 500 }
      )
    }

    // Get pending orders for comparison
    const { data: pendingOrders, error: ordersError } = await supabase
      .from("orders")
      .select(`
        *,
        users!orders_seller_id_fkey(full_name, first_name, last_name, phone, email)
      `)
      .in("status", ["payment_pending", "matched"])
      .gte("amount_fiat", minAmount)
      .lte("amount_fiat", maxAmount)
      .order("created_at", { ascending: false })

    if (ordersError) {
      console.error("Error fetching pending orders:", ordersError)
      return NextResponse.json(
        { error: "Failed to fetch orders" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      unmatched_transactions: transactions || [],
      pending_orders: pendingOrders || [],
      summary: {
        unmatched_count: transactions?.length || 0,
        pending_orders_count: pendingOrders?.length || 0,
        total_unmatched_amount: transactions?.reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0,
        search_criteria: {
          hours_back: hours,
          amount_range: `${minAmount} - ${maxAmount}`,
        }
      }
    })

  } catch (error) {
    console.error("Get unmatched transactions error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
