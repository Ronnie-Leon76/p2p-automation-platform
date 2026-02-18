"use client"

import { useEffect, useState } from "react"
import { getBrowserDbClient } from "@/lib/composition/browser-db-composer";
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, CheckCircle, XCircle, Clock, Phone, Receipt } from "lucide-react"

interface Transaction {
  id: string
  amount: number
  currency: string
  status: string
  payer_phone: string | null
  payer_name: string | null
  reference_number: string | null
  metadata: any
  created_at: string
  completed_at: string | null
}

interface MPesaTransactionMonitorProps {
  orderId?: string
  teamId?: string
}

export function MPesaTransactionMonitor({ orderId, teamId }: MPesaTransactionMonitorProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = getBrowserDbClient()

  useEffect(() => {
    fetchTransactions()

    // Subscribe to real-time updates
    const channel = supabase
      .channel("mpesa-transactions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payment_transactions",
          filter: orderId ? `order_id=eq.${orderId}` : `team_id=eq.${teamId}`,
        },
        (payload) => {
          console.log("Transaction update:", payload)
          fetchTransactions()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId, teamId])

  const fetchTransactions = async () => {
    try {
      let query = supabase
        .from("payment_transactions")
        .select("*")
        .eq("provider_id", "mpesa")
        .order("created_at", { ascending: false })

      if (orderId) {
        query = query.eq("order_id", orderId)
      } else if (teamId) {
        query = query.eq("team_id", teamId)
      }

      const { data, error } = await query

      if (error) throw error
      setTransactions(data || [])
    } catch (error) {
      console.error("Error fetching transactions:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "pending":
      case "processing":
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "failed":
        return "bg-red-100 text-red-800"
      case "pending":
      case "processing":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: currency,
    }).format(amount)
  }

  const formatPhone = (phone: string | null) => {
    if (!phone) return "N/A"
    // Format Kenyan phone numbers
    if (phone.startsWith("254")) {
      return `+${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}`
    }
    return phone
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading transactions...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">M-Pesa Transactions</h3>
        <Button variant="outline" size="sm" onClick={fetchTransactions} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {transactions.length === 0 ? (
        <Card>
          <CardContent className="text-center p-6">
            <p className="text-gray-500">No M-Pesa transactions found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <Card key={transaction.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(transaction.status)}
                    <Badge className={getStatusColor(transaction.status)}>{transaction.status.toUpperCase()}</Badge>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatAmount(transaction.amount, transaction.currency)}</div>
                    <div className="text-sm text-gray-500">{new Date(transaction.created_at).toLocaleString()}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="font-medium">Phone</div>
                      <div className="text-gray-600">{formatPhone(transaction.payer_phone)}</div>
                    </div>
                  </div>

                  {transaction.payer_name && (
                    <div>
                      <div className="font-medium">Payer</div>
                      <div className="text-gray-600">{transaction.payer_name}</div>
                    </div>
                  )}

                  {transaction.reference_number && (
                    <div className="flex items-center space-x-2">
                      <Receipt className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="font-medium">Receipt</div>
                        <div className="text-gray-600 font-mono text-xs">{transaction.reference_number}</div>
                      </div>
                    </div>
                  )}
                </div>

                {transaction.metadata?.failure_reason && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                    <div className="text-sm text-red-800">
                      <strong>Failure Reason:</strong> {transaction.metadata.failure_reason}
                    </div>
                  </div>
                )}

                {transaction.completed_at && (
                  <div className="mt-2 text-xs text-gray-500">
                    Completed: {new Date(transaction.completed_at).toLocaleString()}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
