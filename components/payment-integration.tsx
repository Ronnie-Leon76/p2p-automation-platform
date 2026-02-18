"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTeam } from "@/lib/hooks/use-team";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Smartphone,
  Upload,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

interface PaymentProvider {
  id: string;
  name: string;
  type: string;
  currency: string;
  is_active: boolean;
}

interface PaymentTransaction {
  id: string;
  external_transaction_id?: string;
  amount: number;
  currency: string;
  status: string;
  payer_phone?: string;
  payer_name?: string;
  reference_number?: string;
  created_at: string;
  expires_at?: string;
}

interface PaymentProof {
  id: string;
  file_url: string;
  file_type: string;
  verification_status: string;
  created_at: string;
}

export function PaymentIntegration({ orderId }: { orderId: string }) {
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [proofs, setProofs] = useState<PaymentProof[]>([]);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [amount, setAmount] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [payerName, setPayerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isProofDialogOpen, setIsProofDialogOpen] = useState(false);
  const { currentTeam } = useTeam();

  useEffect(() => {
    if (currentTeam) {
      fetchProviders();
      fetchTransactions();
      fetchProofs();
    }
  }, [currentTeam]);

  const fetchProviders = async () => {
    try {
      const response = await fetch(`/api/payments/providers?team_id=${currentTeam?.id}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Failed to fetch providers");
      const payload = await response.json();
      setProviders(payload.providers || []);
    } catch (error) {
      console.error("Error fetching providers:", error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`/api/payments/transactions?order_id=${orderId}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Failed to fetch transactions");
      const payload = await response.json();
      setTransactions(payload.transactions || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const fetchProofs = async () => {
    try {
      const response = await fetch(`/api/payments/proofs?order_id=${orderId}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Failed to fetch proofs");
      const payload = await response.json();
      setProofs(payload.proofs || []);
    } catch (error) {
      console.error("Error fetching proofs:", error);
    }
  };

  const initiatePayment = async () => {
    if (!selectedProvider || !amount || !payerPhone) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError("");

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
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to initiate payment");
      }

      const transaction = await response.json();
      setTransactions((prev) => [transaction, ...prev]);
      setIsPaymentDialogOpen(false);

      // Reset form
      setSelectedProvider("");
      setAmount("");
      setPayerPhone("");
      setPayerName("");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to initiate payment"
      );
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async (transactionId: string) => {
    try {
      const response = await fetch(`/api/payments/status/${transactionId}`);
      if (!response.ok) throw new Error("Failed to check status");

      const status = await response.json();

      // Update transaction in state
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === transactionId ? { ...t, status: status.status } : t
        )
      );
    } catch (error) {
      console.error("Error checking payment status:", error);
    }
  };

  const uploadPaymentProof = async (transactionId: string, file: File) => {
    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("transaction_id", transactionId);
      formData.append("order_id", orderId);

      const response = await fetch("/api/payments/upload-proof", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload proof");
      }

      await fetchProofs();
      setIsProofDialogOpen(false);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to upload proof"
      );
    } finally {
      setUploading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "processing":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      completed: "default",
      processing: "secondary",
      failed: "destructive",
      pending: "outline",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const getProviderIcon = (type: string) => {
    switch (type) {
      case "mobile_money":
        return <Smartphone className="h-4 w-4" />;
      case "bank":
        return <CreditCard className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="space-y-6 p-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Payment Integration
            </h1>
            <p className="text-gray-600 mt-1">
              Manage payments and transaction proofs for order #{orderId}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="payments" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white border border-gray-200">
            <TabsTrigger
              value="payments"
              className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
            >
              Payments
            </TabsTrigger>
            <TabsTrigger
              value="proofs"
              className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
            >
              Payment Proofs
            </TabsTrigger>
            <TabsTrigger
              value="providers"
              className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
            >
              Providers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="space-y-6 mt-6">
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Payment Transactions
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Track and manage payment transactions
                    </p>
                  </div>
                  <Dialog
                    open={isPaymentDialogOpen}
                    onOpenChange={setIsPaymentDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
                        <Plus className="h-4 w-4" />
                        Initiate Payment
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-gray-900">
                          Initiate Payment
                        </DialogTitle>
                        <DialogDescription className="text-gray-600">
                          Start a new payment transaction for this order
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label
                            htmlFor="provider"
                            className="text-sm font-medium text-gray-700"
                          >
                            Payment Provider
                          </Label>
                          <Select
                            value={selectedProvider}
                            onValueChange={setSelectedProvider}
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Select provider" />
                            </SelectTrigger>
                            <SelectContent>
                              {providers.map((provider) => (
                                <SelectItem
                                  key={provider.id}
                                  value={provider.id}
                                >
                                  <div className="flex items-center gap-2">
                                    {getProviderIcon(provider.type)}
                                    <span>{provider.name}</span>
                                    <Badge
                                      variant="secondary"
                                      className="ml-auto text-xs"
                                    >
                                      {provider.currency}
                                    </Badge>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label
                              htmlFor="amount"
                              className="text-sm font-medium text-gray-700"
                            >
                              Amount
                            </Label>
                            <Input
                              id="amount"
                              type="number"
                              placeholder="0.00"
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              className="h-10"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label
                              htmlFor="phone"
                              className="text-sm font-medium text-gray-700"
                            >
                              Payer Phone
                            </Label>
                            <Input
                              id="phone"
                              placeholder="+254700000000"
                              value={payerPhone}
                              onChange={(e) => setPayerPhone(e.target.value)}
                              className="h-10"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="name"
                            className="text-sm font-medium text-gray-700"
                          >
                            Payer Name (Optional)
                          </Label>
                          <Input
                            id="name"
                            placeholder="John Doe"
                            value={payerName}
                            onChange={(e) => setPayerName(e.target.value)}
                            className="h-10"
                          />
                        </div>

                        <Button
                          onClick={initiatePayment}
                          disabled={loading}
                          className="w-full h-10 bg-blue-600 hover:bg-blue-700"
                        >
                          {loading && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Initiate Payment
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
                      <DollarSign className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 mb-1">
                      No transactions yet
                    </h3>
                    <p className="text-sm text-gray-500">
                      Start by initiating your first payment transaction
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            {getStatusIcon(transaction.status)}
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-gray-900">
                                {transaction.currency}{" "}
                                {transaction.amount.toLocaleString()}
                              </span>
                              {getStatusBadge(transaction.status)}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                              <span>{transaction.payer_phone}</span>
                              <span>•</span>
                              <span>
                                {new Date(
                                  transaction.created_at
                                ).toLocaleString()}
                              </span>
                            </div>
                            {transaction.reference_number && (
                              <p className="text-xs font-mono text-gray-500 mt-1">
                                Ref: {transaction.reference_number}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => checkPaymentStatus(transaction.id)}
                            className="gap-2"
                          >
                            <RefreshCw className="h-3 w-3" />
                            Check Status
                          </Button>
                          {transaction.status === "processing" &&
                            transaction.expires_at && (
                              <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-md">
                                Expires:{" "}
                                {new Date(
                                  transaction.expires_at
                                ).toLocaleTimeString()}
                              </div>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="proofs" className="space-y-6 mt-6">
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Payment Proofs
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Upload and manage payment verification documents
                    </p>
                  </div>
                  <Dialog
                    open={isProofDialogOpen}
                    onOpenChange={setIsProofDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button className="bg-green-600 hover:bg-green-700 gap-2">
                        <Upload className="h-4 w-4" />
                        Upload Proof
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-gray-900">
                          Upload Payment Proof
                        </DialogTitle>
                        <DialogDescription className="text-gray-600">
                          Upload a receipt or screenshot as proof of payment
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label
                            htmlFor="transaction"
                            className="text-sm font-medium text-gray-700"
                          >
                            Transaction
                          </Label>
                          <Select>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Select transaction" />
                            </SelectTrigger>
                            <SelectContent>
                              {transactions.map((transaction) => (
                                <SelectItem
                                  key={transaction.id}
                                  value={transaction.id}
                                >
                                  <div className="flex items-center gap-2">
                                    <span>
                                      {transaction.currency}{" "}
                                      {transaction.amount}
                                    </span>
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {transaction.status}
                                    </Badge>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="file"
                            className="text-sm font-medium text-gray-700"
                          >
                            File
                          </Label>
                          <Input
                            id="file"
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file && transactions.length > 0) {
                                uploadPaymentProof(transactions[0].id, file);
                              }
                            }}
                            className="h-10"
                          />
                          <p className="text-xs text-gray-500">
                            Supported: JPG, PNG, PDF (max 10MB)
                          </p>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {proofs.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
                      <FileText className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 mb-1">
                      No payment proofs
                    </h3>
                    <p className="text-sm text-gray-500">
                      Upload receipts and documents to verify payments
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {proofs.map((proof) => (
                      <div
                        key={proof.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-gray-900">
                                {proof.file_type.toUpperCase()} Document
                              </span>
                              {getStatusBadge(proof.verification_status)}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              Uploaded{" "}
                              {new Date(proof.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="gap-2"
                        >
                          <a
                            href={proof.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Eye className="h-3 w-3" />
                            View
                            <ArrowUpRight className="h-3 w-3" />
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="providers" className="space-y-6 mt-6">
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="border-b border-gray-100">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Payment Providers
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Available payment methods and integrations
                  </p>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {providers.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
                      <CreditCard className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 mb-1">
                      No providers configured
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Contact your team admin to set up payment providers
                    </p>
                    <Button variant="outline" size="sm">
                      Contact Admin
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {providers.map((provider) => (
                      <div
                        key={provider.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                            {getProviderIcon(provider.type)}
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-gray-900">
                                {provider.name}
                              </span>
                              <Badge
                                variant={
                                  provider.is_active ? "default" : "secondary"
                                }
                                className="text-xs"
                              >
                                {provider.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {provider.type
                                .replace("_", " ")
                                .charAt(0)
                                .toUpperCase() +
                                provider.type.replace("_", " ").slice(1)}{" "}
                              • {provider.currency}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-2 w-2 rounded-full ${
                              provider.is_active
                                ? "bg-green-500"
                                : "bg-gray-300"
                            }`}
                          />
                          <span className="text-xs text-gray-500">
                            {provider.is_active ? "Online" : "Offline"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

