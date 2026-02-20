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
import type { Ad } from "@/lib/ads/ad-management-types";

type EditAdDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAd: Ad | null;
};

export function EditAdDialog({ open, onOpenChange, selectedAd }: EditAdDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Ad</DialogTitle>
          <DialogDescription>
            Modify your existing advertisement
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {selectedAd && (
            <p className="text-sm text-gray-600">
              Editing ad: {selectedAd.type.toUpperCase()} {selectedAd.cryptoCurrency}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
