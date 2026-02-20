"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from "@/components/ui/textarea";
import type { CreateAdFormData } from "@/lib/ads/ad-management-types";
import type { Dispatch, SetStateAction } from "react";

type CreateAdDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading: boolean;
  createFormData: CreateAdFormData;
  setCreateFormData: Dispatch<SetStateAction<CreateAdFormData>>;
  availablePaymentMethods: string[];
  availableCryptoCurrencies: string[];
  availableFiatCurrencies: string[];
  onCreateAd: () => void;
};

export function CreateAdDialog({
  open,
  onOpenChange,
  isLoading,
  createFormData,
  setCreateFormData,
  availablePaymentMethods,
  availableCryptoCurrencies,
  availableFiatCurrencies,
  onCreateAd,
}: CreateAdDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create P2P Advertisement</DialogTitle>
          <DialogDescription>
            Configure your P2P trading advertisement on OKX
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-gray-900 border-b pb-2">
              Trade Configuration
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="side" className="text-sm font-medium">
                  Trade Type *
                </Label>
                <Select
                  value={createFormData.side}
                  onValueChange={(value: "buy" | "sell") =>
                    setCreateFormData((prev) => ({ ...prev, side: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select trade type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buy">
                      Buy (I want to buy crypto)
                    </SelectItem>
                    <SelectItem value="sell">
                      Sell (I want to sell crypto)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-medium">
                  Pricing Type *
                </Label>
                <Select
                  value={createFormData.type}
                  onValueChange={(value: "limit" | "floating_market") =>
                    setCreateFormData((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select pricing type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="limit">Fixed Price</SelectItem>
                    <SelectItem value="floating_market">
                      Market Price + Margin
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cryptoCurrency" className="text-sm font-medium">
                  Cryptocurrency *
                </Label>
                <Select
                  value={createFormData.cryptoCurrency}
                  onValueChange={(value) =>
                    setCreateFormData((prev) => ({
                      ...prev,
                      cryptoCurrency: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select crypto" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCryptoCurrencies.map((crypto) => (
                      <SelectItem key={crypto} value={crypto}>
                        {crypto}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fiatCurrency" className="text-sm font-medium">
                  Fiat Currency *
                </Label>
                <Select
                  value={createFormData.fiatCurrency}
                  onValueChange={(value) =>
                    setCreateFormData((prev) => ({
                      ...prev,
                      fiatCurrency: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select fiat" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFiatCurrencies.map((fiat) => (
                      <SelectItem key={fiat} value={fiat}>
                        {fiat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-sm text-gray-900 border-b pb-2">
              Amount & Pricing
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cryptoAmount" className="text-sm font-medium">
                  Total {createFormData.cryptoCurrency} Amount *
                </Label>
                <Input
                  id="cryptoAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={createFormData.cryptoAmount}
                  onChange={(e) =>
                    setCreateFormData((prev) => ({
                      ...prev,
                      cryptoAmount: e.target.value,
                    }))
                  }
                  placeholder="0.00"
                  className="text-sm"
                />
              </div>

              {createFormData.type === "limit" && (
                <div className="space-y-2">
                  <Label htmlFor="unitPrice" className="text-sm font-medium">
                    Price per {createFormData.cryptoCurrency} (
                    {createFormData.fiatCurrency}) *
                  </Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={createFormData.unitPrice}
                    onChange={(e) =>
                      setCreateFormData((prev) => ({
                        ...prev,
                        unitPrice: e.target.value,
                      }))
                    }
                    placeholder="0.00"
                    className="text-sm"
                  />
                </div>
              )}

              {createFormData.type === "floating_market" && (
                <div className="space-y-2">
                  <Label htmlFor="priceMargin" className="text-sm font-medium">
                    Price Margin (%) *
                  </Label>
                  <Input
                    id="priceMargin"
                    type="number"
                    step="0.1"
                    value={createFormData.priceMargin}
                    onChange={(e) =>
                      setCreateFormData((prev) => ({
                        ...prev,
                        priceMargin: e.target.value,
                      }))
                    }
                    placeholder="+/-0.0"
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-500">
                    Positive for premium, negative for discount
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minOrderLimit" className="text-sm font-medium">
                  Min Order ({createFormData.fiatCurrency}) *
                </Label>
                <Input
                  id="minOrderLimit"
                  type="number"
                  step="0.01"
                  min="0"
                  value={createFormData.minOrderLimit}
                  onChange={(e) =>
                    setCreateFormData((prev) => ({
                      ...prev,
                      minOrderLimit: e.target.value,
                    }))
                  }
                  placeholder="0.00"
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxOrderLimit" className="text-sm font-medium">
                  Max Order ({createFormData.fiatCurrency}) *
                </Label>
                <Input
                  id="maxOrderLimit"
                  type="number"
                  step="0.01"
                  min="0"
                  value={createFormData.maxOrderLimit}
                  onChange={(e) =>
                    setCreateFormData((prev) => ({
                      ...prev,
                      maxOrderLimit: e.target.value,
                    }))
                  }
                  placeholder="0.00"
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-sm text-gray-900 border-b pb-2">
              Payment Methods *
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {availablePaymentMethods.map((method) => (
                <div
                  key={method}
                  className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    id={method}
                    aria-label={`Select ${method} payment method`}
                    title={`Select ${method} payment method`}
                    checked={createFormData.paymentMethods.includes(method)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setCreateFormData((prev) => ({
                          ...prev,
                          paymentMethods: [...prev.paymentMethods, method],
                        }));
                      } else {
                        setCreateFormData((prev) => ({
                          ...prev,
                          paymentMethods: prev.paymentMethods.filter(
                            (pm) => pm !== method,
                          ),
                        }));
                      }
                    }}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <Label htmlFor={method} className="text-sm font-medium cursor-pointer">
                    {method.replace("_", " ")}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-sm text-gray-900 border-b pb-2">
              Optional Settings
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetGroup" className="text-sm font-medium">
                  Target Traders
                </Label>
                <Select
                  value={createFormData.targetGroup}
                  onValueChange={(value: "common" | "certified" | "diamond" | "all") =>
                    setCreateFormData((prev) => ({
                      ...prev,
                      targetGroup: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select target group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Traders</SelectItem>
                    <SelectItem value="common">Standard Traders</SelectItem>
                    <SelectItem value="certified">Verified Traders</SelectItem>
                    <SelectItem value="diamond">Premium Traders</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minCompletionRate" className="text-sm font-medium">
                  Min Completion Rate (%)
                </Label>
                <Input
                  id="minCompletionRate"
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={createFormData.minCompletionRate}
                  onChange={(e) =>
                    setCreateFormData((prev) => ({
                      ...prev,
                      minCompletionRate: e.target.value,
                    }))
                  }
                  placeholder="90"
                  className="text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="remark" className="text-sm font-medium">
                Ad Description
              </Label>
              <Textarea
                id="remark"
                value={createFormData.remark}
                onChange={(e) =>
                  setCreateFormData((prev) => ({
                    ...prev,
                    remark: e.target.value,
                  }))
                }
                placeholder="Add any special instructions or requirements for traders..."
                rows={3}
                className="text-sm resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="automatedMessage" className="text-sm font-medium">
                Auto-Reply Message
              </Label>
              <Textarea
                id="automatedMessage"
                value={createFormData.automatedMessage}
                onChange={(e) =>
                  setCreateFormData((prev) => ({
                    ...prev,
                    automatedMessage: e.target.value,
                  }))
                }
                placeholder="Message sent automatically when someone responds to your ad..."
                rows={2}
                className="text-sm resize-none"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={onCreateAd}
            disabled={
              isLoading ||
              !createFormData.cryptoAmount ||
              !createFormData.minOrderLimit ||
              !createFormData.maxOrderLimit ||
              createFormData.paymentMethods.length === 0 ||
              (createFormData.type === "limit" && !createFormData.unitPrice) ||
              (createFormData.type === "floating_market" && !createFormData.priceMargin)
            }
            className="flex-1"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              "Create Advertisement"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
