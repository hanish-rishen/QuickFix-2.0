import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  price: number;
}

const PaymentDialog: React.FC<PaymentDialogProps> = ({
  open,
  onClose,
  price,
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Payment</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-lg font-bold">₹{price.toFixed(0)}</p>
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p>Test mode card numbers:</p>
            <p>Success: 4242 4242 4242 4242</p>
            <p>Auth required: 4000 0025 0000 3155</p>
            <p>Decline: 4000 0000 0000 0002</p>
            <p>Use any future date and any CVC</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;
