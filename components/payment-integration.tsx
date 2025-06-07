"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CreditCard,
  Smartphone,
  Upload,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Loader2,
  FileText,
  Eye,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useTeam } from "@/lib/hooks/use-team"

interface PaymentProvider {
  id: string
  name: string
  type: string
  currency: string
  is_active: boolean
}

interface PaymentTransaction {
  id: string
  external_transaction_id?: string
  amount: number
  currency: string
  status: string
  payer_phone?: string
  payer_name?: string
  reference_number?: string
  created_at: string
  expires_at?: string
}

interface PaymentProof {
  id: string
  file_url: string
  file_type: string
  verification_status: string
  created_at: string
}

export function PaymentIntegration({ orderId }: { orderId: string }) {
  const [providers, setProviders] = useState<PaymentProvider[]>([])
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([])
  const [proofs, setProofs] = useState<PaymentProof[]>([])
  const [selectedProvider, setSelectedProvider] = useState("")
  const [amount, setAmount] = useState("")
  const [payerPhone, setPayerPhone] = useState("")
  const [payerName, setPayerName] = useState("")
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isProofDialogOpen, setIsProofDialogOpen] = useState(false)
  const { currentTeam } = useTeam()
  const supabase = createClient()

  useEffect(() => {
    if (currentTeam) {
      fetchProviders()
      fetchTransactions()
      fetchProofs()
    }
  }, [currentTeam])

  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from("payment_providers")
        .select(`
          *,
          team_payment_configs!inner(
            team_id,
            is_active
          )
        `)
        .eq("team_payment_configs.team_id", currentTeam?.id)
        .eq("team_payment_configs.is_active", true)
        .eq("is_active", true)

      if (error) throw error
      setProviders(data || [])
    } catch (error) {
      console.error("Error fetching providers:", error)
    }
  }

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setTransactions(data || [])
    } catch (error) {
      console.error("Error fetching transactions:", error)
    }
  }

  const fetchProofs = async () => {
    try {
      const { data, error } = await supabase
        .from("payment_proofs")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setProofs(data || [])
    } catch (error) {
      console.error("Error fetching proofs:", error)
    }
  }

  const initiatePayment = async () => {
    if (!selectedProvider || !amount || !payerPhone) {
      setError("Please fill in all required fields")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_id: currentTeam?.id,
          provider_id: selectedProvider,
          order_id: orderId,
          amount: Number.parseFloat(amount),
          currency: "KES", // Default to KES, could be dynamic
          payer_phone: payerPhone,
          payer_name: payerName,
          description: `Payment for order ${orderId}`,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to initiate payment")
      }

      const transaction = await response.json()
      setTransactions((prev) => [transaction, ...prev])
      setIsPaymentDialogOpen(false)

      // Reset form
      setSelectedProvider("")
      setAmount("")
      setPayerPhone("")
      setPayerName("")
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to initiate payment")
    } finally {
      setLoading(false)
    }
  }

  const checkPaymentStatus = async (transactionId: string) => {
    try {
      const response = await fetch(`/api/payments/status/${transactionId}`)
      if (!response.ok) throw new Error("Failed to check status")

      const status = await response.json()

      // Update transaction in state
      setTransactions((prev) => prev.map((t) => (t.id === transactionId ? { ...t, status: status.status } : t)))
    } catch (error) {
      console.error("Error checking payment status:", error)
    }
  }

  const uploadPaymentProof = async (transactionId: string, file: File) => {
    setUploading(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("transaction_id", transactionId)
      formData.append("order_id", orderId)

      const response = await fetch("/api/payments/upload-proof", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to upload proof")
      }

      await fetchProofs()
      setIsProofDialogOpen(false)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to upload proof")
    } finally {
      setUploading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "processing":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      processing: "secondary",
      failed: "destructive",
      pending: "outline",
    }
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>
  }

  const getProviderIcon = (type: string) => {
    switch (type) {
      case "mobile_money":
        return <Smartphone className="h-4 w-4" />
      case "bank":
        return <CreditCard className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert className="bg-red-500/10 border-red-500/20">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-400">{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="payments" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="proofs">Payment Proofs</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Payment Transactions</h3>
            <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Initiate Payment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Initiate Payment</DialogTitle>
                  <DialogDescription>Start a new payment transaction for this order</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="provider">Payment Provider</Label>
                    <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {providers.map((provider) => (
                          <SelectItem key={provider.id} value={provider.id}>
                            <div className="flex items-center gap-2">
                              {getProviderIcon(provider.type)}
                              {provider.name} ({provider.currency})
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Payer Phone</Label>
                      <Input
                        id="phone"
                        placeholder="+254700000000"
                        value={payerPhone}
                        onChange={(e) => setPayerPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Payer Name (Optional)</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={payerName}
                      onChange={(e) => setPayerName(e.target.value)}
                    />
                  </div>

                  <Button onClick={initiatePayment} disabled={loading} className="w-full">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Initiate Payment
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {transactions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">No payment transactions found</p>
                </CardContent>
              </Card>
            ) : (
              transactions.map((transaction) => (
                <Card key={transaction.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(transaction.status)}
                          <span className="font-medium">
                            {transaction.currency} {transaction.amount}
                          </span>
                          {getStatusBadge(transaction.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {transaction.payer_phone} • {new Date(transaction.created_at).toLocaleString()}
                        </p>
                        {transaction.reference_number && (
                          <p className="text-sm font-mono">Ref: {transaction.reference_number}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => checkPaymentStatus(transaction.id)}>
                          Check Status
                        </Button>
                        {transaction.status === "processing" && transaction.expires_at && (
                          <div className="text-sm text-muted-foreground">
                            Expires: {new Date(transaction.expires_at).toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="proofs" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Payment Proofs</h3>
            <Dialog open={isProofDialogOpen} onOpenChange={setIsProofDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Proof
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Payment Proof</DialogTitle>
                  <DialogDescription>Upload a receipt or screenshot as proof of payment</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="transaction">Transaction</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select transaction" />
                      </SelectTrigger>
                      <SelectContent>
                        {transactions.map((transaction) => (
                          <SelectItem key={transaction.id} value={transaction.id}>
                            {transaction.currency} {transaction.amount} - {transaction.status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="file">File</Label>
                    <Input
                      id="file"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file && transactions.length > 0) {
                          uploadPaymentProof(transactions[0].id, file)
                        }
                      }}
                    />
                    <p className="text-sm text-muted-foreground">Supported formats: JPG, PNG, PDF (max 10MB)</p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {proofs.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">No payment proofs uploaded</p>
                </CardContent>
              </Card>
            ) : (
              proofs.map((proof) => (
                <Card key={proof.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{proof.file_type.toUpperCase()} File</p>
                          <p className="text-sm text-muted-foreground">
                            Uploaded {new Date(proof.created_at).toLocaleString()}
                          </p>
                          {getStatusBadge(proof.verification_status)}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={proof.file_url} target="_blank" rel="noopener noreferrer">
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="providers" className="space-y-4">
          <h3 className="text-lg font-semibold">Available Payment Providers</h3>
          <div className="grid gap-4">
            {providers.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">No payment providers configured</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Contact your team admin to set up payment providers
                  </p>
                </CardContent>
              </Card>
            ) : (
              providers.map((provider) => (
                <Card key={provider.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getProviderIcon(provider.type)}
                        <div>
                          <p className="font-medium">{provider.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {provider.type.replace("_", " ")} • {provider.currency}
                          </p>
                        </div>
                      </div>
                      <Badge variant={provider.is_active ? "default" : "secondary"}>
                        {provider.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
