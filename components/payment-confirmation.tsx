"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, CheckCircle, Clock, RefreshCw } from "lucide-react";
import { useState } from "react";

interface Order {
  id: string;
  crypto_currency: string;
  fiat_currency: string;
  amount_crypto: number;
  amount_fiat: number;
  rate: number;
  status: string;
  buyer_phone?: string;
  payment_deadline?: string;
  created_at: string;
  matched_at?: string;
}

interface PaymentConfirmationProps {
  order: Order;
  sellerId: string;
  onPaymentConfirmed: (orderId: string) => void;
}

export function PaymentConfirmation({
  order,
  sellerId,
  onPaymentConfirmed,
}: PaymentConfirmationProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [matchingTransactions, setMatchingTransactions] = useState<any[]>([]);
  const [showMatches, setShowMatches] = useState(false);

  const handleConfirmPayment = async () => {
    setIsConfirming(true);

    try {
      const response = await fetch(
        "/api/orders/p2p?action=confirm_payment_received",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            order_id: order.id,
            seller_id: sellerId,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        onPaymentConfirmed(order.id);

        if (result.matched_transaction) {
          alert(
            `Payment confirmed! Automatically matched with SasaPay transaction: ${result.matched_transaction.external_transaction_id}`
          );
        } else {
          alert("Payment confirmed manually. Transaction will be verified.");
        }
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Payment confirmation error:", error);
      alert("Failed to confirm payment. Please try again.");
    }

    setIsConfirming(false);
  };

  const handleFindMatches = async () => {
    setIsSearching(true);

    try {
      const response = await fetch(
        "/api/orders/p2p?action=find_matching_transactions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            order_id: order.id,
            seller_id: sellerId,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setMatchingTransactions(result.potential_matches || []);
        setShowMatches(true);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Find matches error:", error);
      alert("Failed to find matching transactions.");
    }

    setIsSearching(false);
  };

  const handleManualMatch = async (transactionId: string) => {
    try {
      const response = await fetch("/api/transactions/match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_id: order.id,
          transaction_id: transactionId,
          seller_id: sellerId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        onPaymentConfirmed(order.id);
        alert("Transaction manually matched and order completed!");
        setShowMatches(false);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Manual match error:", error);
      alert("Failed to match transaction.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "matched":
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Waiting for Payment
          </Badge>
        );
      case "payment_pending":
        return (
          <Badge variant="outline">
            <Clock className="w-3 h-3 mr-1" />
            Payment Pending
          </Badge>
        );
      case "payment_confirmed":
        return (
          <Badge variant="default">
            <CheckCircle className="w-3 h-3 mr-1" />
            Payment Confirmed
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="default">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const canConfirmPayment =
    order.status === "matched" || order.status === "payment_pending";

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Order #{order.id.slice(-8)}</span>
          {getStatusBadge(order.status)}
        </CardTitle>
        <CardDescription>
          Sell {order.amount_crypto} {order.crypto_currency} for{" "}
          {order.amount_fiat} {order.fiat_currency}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Amount:</strong> {order.amount_crypto}{" "}
            {order.crypto_currency}
          </div>
          <div>
            <strong>Price:</strong> {order.amount_fiat} {order.fiat_currency}
          </div>
          <div>
            <strong>Rate:</strong> {order.rate} {order.fiat_currency}/
            {order.crypto_currency}
          </div>
          <div>
            <strong>Status:</strong> {order.status}
          </div>
          {order.buyer_phone && (
            <div className="col-span-2">
              <strong>Buyer Phone:</strong> {order.buyer_phone}
            </div>
          )}
          {order.payment_deadline && (
            <div className="col-span-2">
              <strong>Payment Deadline:</strong>{" "}
              {new Date(order.payment_deadline).toLocaleString()}
            </div>
          )}
        </div>

        {canConfirmPayment && (
          <div className="border-t pt-4">
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h4 className="font-semibold text-blue-900 mb-2">
                Payment Confirmation
              </h4>
              <p className="text-blue-700 text-sm mb-3">
                Once you receive payment from the buyer, click "Confirm Payment
                Received" below. The system will automatically try to match your
                confirmation with SasaPay transactions.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleConfirmPayment}
                  disabled={isConfirming}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isConfirming ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirm Payment Received
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleFindMatches}
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    "Find Matching Transactions"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {showMatches && matchingTransactions.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">
              Potential Matching Transactions
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {matchingTransactions.map((transaction, index) => (
                <div
                  key={transaction.id}
                  className="border rounded-lg p-3 bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm">
                      <div>
                        <strong>Amount:</strong> {transaction.amount}{" "}
                        {transaction.currency}
                      </div>
                      <div>
                        <strong>From:</strong>{" "}
                        {transaction.payer_name || "Unknown"}
                      </div>
                      <div>
                        <strong>Phone:</strong>{" "}
                        {transaction.payer_phone || "N/A"}
                      </div>
                      <div>
                        <strong>Time:</strong> {transaction.hours_ago}h ago
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-blue-600">
                        Match Score: {transaction.match_score}%
                      </div>
                      <div className="text-xs text-gray-600 mb-2">
                        Diff: {transaction.amount_difference.toFixed(2)}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleManualMatch(transaction.id)}
                        disabled={transaction.match_score < 20}
                      >
                        Match This Transaction
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">
                    <strong>Reasons:</strong>{" "}
                    {transaction.match_reasons.join(", ")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showMatches && matchingTransactions.length === 0 && (
          <div className="border-t pt-4">
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                <span className="text-yellow-800">
                  No matching transactions found. Use "Confirm Payment Received"
                  for manual verification.
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
