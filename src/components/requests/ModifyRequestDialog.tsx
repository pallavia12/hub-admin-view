import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

interface ModifyRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (discountType: string, discountValue: number) => void;
  requestId: string;
  currentDiscountType: string;
  currentDiscountValue: number;
  orderQty: number;
}

export function ModifyRequestDialog({
  isOpen,
  onClose,
  onConfirm,
  requestId,
  currentDiscountType,
  currentDiscountValue,
  orderQty
}: ModifyRequestDialogProps) {
  const [discountType, setDiscountType] = useState<string>("");
  const [discountValue, setDiscountValue] = useState<string>("");
  const [isCustomSelected, setIsCustomSelected] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Pre-fill form with current values when dialog opens
  useEffect(() => {
    if (isOpen) {
      setDiscountType(currentDiscountType);
      setIsCustomSelected(currentDiscountType === "Custom");
      
      // Calculate and set discount value based on type
      if (currentDiscountType === "Re 1 per kg") {
        setDiscountValue(orderQty.toString());
      } else if (currentDiscountType === "Rs 0.75 per kg") {
        setDiscountValue((orderQty * 0.75).toString());
      } else if (currentDiscountType === "Custom") {
        setDiscountValue(currentDiscountValue.toString());
      } else {
        setDiscountValue("");
      }
      
      setHasChanges(false);
    }
  }, [isOpen, currentDiscountType, currentDiscountValue, orderQty]);

  // Check for changes whenever form values change
  useEffect(() => {
    const typeChanged = discountType && discountType !== currentDiscountType;
    const valueChanged = isCustomSelected && discountValue && parseFloat(discountValue) !== currentDiscountValue;
    setHasChanges(typeChanged || valueChanged);
  }, [discountType, discountValue, isCustomSelected, currentDiscountType, currentDiscountValue]);

  const handleDiscountTypeChange = (value: string) => {
    setDiscountType(value);
    setIsCustomSelected(value === "Custom");
    
    // Calculate and set discount value based on type
    if (value === "Re 1 per kg") {
      setDiscountValue(orderQty.toString());
    } else if (value === "Rs 0.75 per kg") {
      setDiscountValue((orderQty * 0.75).toString());
    } else if (value === "Custom") {
      setDiscountValue("");
    }
  };

  const handleConfirm = () => {
    if (!hasChanges) return;

    let finalDiscountValue: number;

    if (discountType === "Re 1 per kg") {
      finalDiscountValue = orderQty;
    } else if (discountType === "Rs 0.75 per kg") {
      finalDiscountValue = orderQty * 0.75;
    } else if (discountType === "Custom" && discountValue) {
      finalDiscountValue = parseFloat(discountValue);
    } else {
      return; // Invalid state
    }

    onConfirm(discountType, finalDiscountValue);
    onClose();
  };

  const isConfirmDisabled = !hasChanges || (isCustomSelected && !discountValue);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-background border border-border">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-lg font-semibold">
            Modify Request {requestId.replace('REQ-', '')}
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Discount Type */}
          <div className="space-y-1">
            <Label htmlFor="discount-type" className="text-sm font-medium">
              Discount Type
            </Label>
            <Select value={discountType} onValueChange={handleDiscountTypeChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select discount type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Re 1 per kg">Re 1 per kg</SelectItem>
                <SelectItem value="Rs 0.75 per kg">Rs 0.75 per kg</SelectItem>
                <SelectItem value="Custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Discount Value */}
          <div className="space-y-1">
            <Label htmlFor="discount-value" className="text-sm font-medium">
              Discount Value
            </Label>
            <Input
              id="discount-value"
              type="number"
              placeholder="Enter discount value"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              readOnly={!isCustomSelected}
              className={!isCustomSelected ? "bg-muted cursor-default" : ""}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className="bg-primary hover:bg-primary/90"
          >
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}