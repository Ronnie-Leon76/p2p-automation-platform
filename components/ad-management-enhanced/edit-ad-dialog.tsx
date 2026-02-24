"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import type { Ad, CreateAdFormData } from "@/lib/ads/ad-management-types";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export type EditAdFormData = CreateAdFormData;

type EditAdDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAd: Ad | null;
  isLoading: boolean;
  availablePaymentMethods: string[];
  availableCryptoCurrencies: string[];
  availableFiatCurrencies: string[];
  onSave: (data: EditAdFormData) => void;
};

function mapSelectedAdToForm(ad: Ad | null): EditAdFormData {
  if (!ad) {
    return {
      side: "sell",
      cryptoCurrency: "USDT",
      fiatCurrency: "KES",
      cryptoAmount: "",
      minOrderLimit: "",
      maxOrderLimit: "",
      unitPrice: "",
      priceMargin: "",
      type: "limit",
      paymentMethods: [],
      targetGroup: "all",
      minKycLevel: "0",
      minCompletedOrders: "0",
      minCompletionRate: "90",
      remark: "",
      automatedMessage: "",
    };
  }

  return {
    side: ad.type,
    cryptoCurrency: ad.cryptoCurrency,
    fiatCurrency: ad.fiatCurrency,
    cryptoAmount: String(ad.cryptoAmount || ""),
    minOrderLimit: String(ad.minOrderLimit || ""),
    maxOrderLimit: String(ad.maxOrderLimit || ""),
    unitPrice: String(ad.unitPrice || ""),
    priceMargin: ad.priceMargin ? String(ad.priceMargin) : "",
    type: ad.priceType || "limit",
    paymentMethods: ad.paymentMethods || [],
    targetGroup: ad.targetGroup || "all",
    minKycLevel: ad.minKycLevel || "0",
    minCompletedOrders: ad.minCompletedOrders || "0",
    minCompletionRate: ad.minCompletionRate || "90",
    remark: ad.remark || "",
    automatedMessage: ad.automatedMessage || "",
  };
}

function Stepper({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-3">
      {[1, 2, 3].map((s, i) => (
        <div key={s} className="flex items-center gap-3 flex-1">
          <div
            className={`h-7 w-7 rounded-full border text-xs font-semibold flex items-center justify-center ${
              step >= s ? "bg-black text-white border-black" : "bg-white text-gray-500 border-gray-300"
            }`}
          >
            {s}
          </div>
          {i < 2 && <div className={`h-px flex-1 ${step > s ? "bg-black" : "bg-gray-300"}`} />}
        </div>
      ))}
    </div>
  );
}

export function EditAdDialog({
  open,
  onOpenChange,
  selectedAd,
  isLoading,
  availablePaymentMethods,
  availableCryptoCurrencies,
  availableFiatCurrencies,
  onSave,
}: EditAdDialogProps) {
  const [step, setStep] = useState(1);
  const [paymentSearch, setPaymentSearch] = useState("");
  const [formData, setFormData] = useState<EditAdFormData>(mapSelectedAdToForm(null));

  useEffect(() => {
    setFormData(mapSelectedAdToForm(selectedAd));
  }, [selectedAd]);

  useEffect(() => {
    if (!open) {
      setStep(1);
      setPaymentSearch("");
    }
  }, [open]);

  const stepOneValid =
    !!formData.cryptoAmount &&
    !!formData.minOrderLimit &&
    !!formData.maxOrderLimit &&
    ((formData.type === "limit" && !!formData.unitPrice) ||
      (formData.type === "floating_market" && !!formData.priceMargin));
  const stepTwoValid = formData.paymentMethods.length > 0;
  const canSubmit = stepOneValid && stepTwoValid;

  const filteredPaymentMethods = useMemo(
    () =>
      availablePaymentMethods.filter((method) =>
        method.toLowerCase().includes(paymentSearch.trim().toLowerCase()),
      ),
    [availablePaymentMethods, paymentSearch],
  );

  const totalAmount = Number(formData.unitPrice || 0) * Number(formData.cryptoAmount || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1100px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Ad</DialogTitle>
          <DialogDescription>Review and update this ad in 3 steps.</DialogDescription>
        </DialogHeader>

        <Stepper step={step} />

        {step === 1 && (
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={formData.side === "buy" ? "default" : "outline"}
                onClick={() => setFormData((prev) => ({ ...prev, side: "buy" }))}
              >
                Buy
              </Button>
              <Button
                type="button"
                variant={formData.side === "sell" ? "default" : "outline"}
                onClick={() => setFormData((prev) => ({ ...prev, side: "sell" }))}
              >
                Sell
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Crypto</Label>
                <Select
                  value={formData.cryptoCurrency}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, cryptoCurrency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
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
              <div className="space-y-1">
                <Label>For</Label>
                <Select
                  value={formData.fiatCurrency}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, fiatCurrency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
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

            <div className="space-y-1">
              <Label>Price Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "limit" | "floating_market") =>
                  setFormData((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="limit">Fixed price</SelectItem>
                  <SelectItem value="floating_market">Floating market</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {formData.type === "limit" ? (
                <div className="space-y-1">
                  <Label>Unit price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData((prev) => ({ ...prev, unitPrice: e.target.value }))}
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <Label>Price margin (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.priceMargin}
                    onChange={(e) => setFormData((prev) => ({ ...prev, priceMargin: e.target.value }))}
                  />
                </div>
              )}
              <div className="space-y-1">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.cryptoAmount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, cryptoAmount: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Single transaction min</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.minOrderLimit}
                  onChange={(e) => setFormData((prev) => ({ ...prev, minOrderLimit: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Single transaction max</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.maxOrderLimit}
                  onChange={(e) => setFormData((prev) => ({ ...prev, maxOrderLimit: e.target.value }))}
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 py-2">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <Input
                className="pl-9"
                value={paymentSearch}
                onChange={(e) => setPaymentSearch(e.target.value)}
                placeholder="Search payment methods"
              />
            </div>

            <div className="max-h-[45vh] overflow-auto space-y-2 pr-1">
              {filteredPaymentMethods.map((method) => {
                const checked = formData.paymentMethods.includes(method);
                return (
                  <label
                    key={method}
                    className={`flex items-center justify-between rounded-md border p-3 cursor-pointer ${
                      checked ? "border-black bg-gray-50" : "border-gray-200"
                    }`}
                  >
                    <div>
                      <p className="font-medium text-sm">{method.replaceAll("_", " ")}</p>
                      <p className="text-xs text-gray-500">Available for this ad</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData((prev) => ({
                            ...prev,
                            paymentMethods: [...prev.paymentMethods, method],
                          }));
                        } else {
                          setFormData((prev) => ({
                            ...prev,
                            paymentMethods: prev.paymentMethods.filter((item) => item !== method),
                          }));
                        }
                      }}
                    />
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-4 lg:grid-cols-[1fr_360px] py-2">
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Trading terms</Label>
                <Textarea
                  rows={4}
                  value={formData.remark}
                  onChange={(e) => setFormData((prev) => ({ ...prev, remark: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Welcome message</Label>
                <Textarea
                  rows={3}
                  value={formData.automatedMessage}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, automatedMessage: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Min completed orders</Label>
                  <Input
                    type="number"
                    value={formData.minCompletedOrders}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, minCompletedOrders: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Min completion rate (%)</Label>
                  <Input
                    type="number"
                    value={formData.minCompletionRate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, minCompletionRate: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="rounded-md border p-4 space-y-2 h-fit">
              <h4 className="font-semibold">Ad preview</h4>
              <p className="text-sm text-gray-600">
                {formData.side === "buy" ? "Buy" : "Sell"} {formData.cryptoCurrency}
              </p>
              <div className="text-sm space-y-1">
                <p>
                  Unit price: <span className="font-medium">{formData.unitPrice || "-"}</span>{" "}
                  {formData.fiatCurrency}
                </p>
                <p>
                  Quantity: <span className="font-medium">{formData.cryptoAmount || "-"}</span>{" "}
                  {formData.cryptoCurrency}
                </p>
                <p>
                  Single transaction limit:{" "}
                  <span className="font-medium">
                    {formData.minOrderLimit || "-"} ~ {formData.maxOrderLimit || "-"}{" "}
                    {formData.fiatCurrency}
                  </span>
                </p>
                <p>
                  Total amount:{" "}
                  <span className="font-medium">
                    {Number.isFinite(totalAmount) ? totalAmount.toLocaleString() : "0"}{" "}
                    {formData.fiatCurrency}
                  </span>
                </p>
                <p>
                  Payment methods:{" "}
                  <span className="font-medium">
                    {formData.paymentMethods.length > 0 ? formData.paymentMethods.join(", ") : "-"}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => (step === 1 ? onOpenChange(false) : setStep((s) => s - 1))}
            disabled={isLoading}
          >
            {step === 1 ? "Cancel" : "Back"}
          </Button>

          {step < 3 ? (
            <Button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={(step === 1 && !stepOneValid) || (step === 2 && !stepTwoValid)}
            >
              Next
            </Button>
          ) : (
            <Button
              type="button"
              disabled={isLoading || !selectedAd || !canSubmit}
              onClick={() => onSave(formData)}
            >
              {isLoading ? "Saving..." : "Update ad"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
