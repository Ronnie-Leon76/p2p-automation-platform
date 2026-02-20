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
              <Badge variant={selectedAd.type === "buy" ? "default" : "secondary"}>
                {selectedAd.type.toUpperCase()}
              </Badge>
              <Badge variant="outline">{selectedAd.status}</Badge>
            </div>
            <div>
              Pair: {selectedAd.cryptoCurrency}/{selectedAd.fiatCurrency}
            </div>
            <div>
              Price: {selectedAd.unitPrice.toLocaleString()} {selectedAd.fiatCurrency}
            </div>
            <div>
              Amount: {selectedAd.availableAmount.toLocaleString()} {selectedAd.cryptoCurrency}
            </div>
            <div>
              Limits: {selectedAd.minOrderLimit.toLocaleString()} -{" "}
              {selectedAd.maxOrderLimit.toLocaleString()} {selectedAd.fiatCurrency}
            </div>
            <div>Payment methods: {selectedAd.paymentMethods.join(", ") || "N/A"}</div>
            <div>Completion rate: {selectedAd.completionRate}%</div>
            <div>Total orders: {selectedAd.totalOrders}</div>
          </div>
        )}

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
