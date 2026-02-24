"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Ad } from "@/lib/ads/ad-management-types";

type ViewAdDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAd: Ad | null;
};

export function ViewAdDialog({ open, onOpenChange, selectedAd }: ViewAdDialogProps) {
  const side = selectedAd?.type === "sell" ? "sell" : "buy";
  const status = selectedAd?.status || "unknown";
  const fmt = (value: number) => (Number.isFinite(value) ? value.toLocaleString() : "--");
  const fmtPercent = (value: number) =>
    Number.isFinite(value) ? `${value.toFixed(2).replace(/\.00$/, "")}%` : "--";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Ad Details</DialogTitle>
          <DialogDescription>
            Detailed view for the selected P2P advertisement
          </DialogDescription>
        </DialogHeader>

        {!selectedAd ? (
          <p className="text-sm text-gray-500">No ad selected.</p>
        ) : (
          <div className="grid gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant={side === "buy" ? "default" : "secondary"}>
                {side.toUpperCase()}
              </Badge>
              <Badge variant="outline">{status}</Badge>
            </div>
            <div>
              Pair: {selectedAd.cryptoCurrency}/{selectedAd.fiatCurrency}
            </div>
            <div>
              Price: {fmt(selectedAd.unitPrice)} {selectedAd.fiatCurrency}
            </div>
            <div>
              Amount: {fmt(selectedAd.availableAmount)} {selectedAd.cryptoCurrency}
            </div>
            <div>
              Limits: {fmt(selectedAd.minOrderLimit)} -{" "}
              {fmt(selectedAd.maxOrderLimit)} {selectedAd.fiatCurrency}
            </div>
            <div>Payment methods: {selectedAd.paymentMethods.join(", ") || "N/A"}</div>
            <div>Completion rate: {fmtPercent(selectedAd.completionRate)}</div>
            <div>Total orders: {Number.isFinite(selectedAd.totalOrders) ? selectedAd.totalOrders : "--"}</div>
          </div>
        )}

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
