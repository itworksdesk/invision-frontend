import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import type { PurchaseOrder, PurchaseOrderItem } from "../../types";

interface User {
  id: number;
  name: string;
  email?: string;
}

interface ReceiveItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseOrder: PurchaseOrder;
  onReceiptCreated: () => void;
}

interface LineItemState {
  poItem: PurchaseOrderItem;
  receivingNow: string;
}

export default function ReceiveItemDialog({
  open,
  onOpenChange,
  purchaseOrder,
  onReceiptCreated,
}: ReceiveItemDialogProps) {
  const API_URL = import.meta.env.VITE_API_URL;

  const [receiptDate, setReceiptDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [receivedById, setReceivedById] = useState<number | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [lineItems, setLineItems] = useState<LineItemState[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Load PO items into state
  useEffect(() => {
    if (open && purchaseOrder) {
      const items: LineItemState[] = purchaseOrder.items.map((item) => ({
        poItem: item,
        receivingNow: "0",
      }));
      setLineItems(items);
      setReceiptDate(new Date().toISOString().split("T")[0]);
      setReceivedById(null);
      setNotes("");
    }
  }, [open, purchaseOrder]);

  // Fetch users
  useEffect(() => {
    if (open) {
      fetch(`${API_URL}/users`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch users");
          return res.json();
        })
        .then((data) => setUsers(data))
        .catch((err) => {
          console.error(err);
          toast.error("Failed to load users");
        });
    }
  }, [open]);

  const handleQuantityChange = (index: number, value: string) => {
    const newItems = [...lineItems];
    const poItem = newItems[index].poItem;
    const remaining = poItem.quantityOrdered - (poItem.quantityReceived || 0);

    // Allow empty string while typing
    if (value === "") {
      newItems[index].receivingNow = "";
    } else {
      const num = Math.max(0, parseInt(value) || 0);
      newItems[index].receivingNow = num.toString();
    }

    setLineItems(newItems);
  };


  const handleSubmit = async () => {
    const itemsToReceive = lineItems
      .filter((li) => parseInt(li.receivingNow) > 0)
      .map((li) => ({
        poItemId: li.poItem.id,
        quantityReceived: parseInt(li.receivingNow),
      }));


    if (itemsToReceive.length === 0) {
      toast.error("Please enter at least one quantity to receive.");
      return;
    }

    const payload = {
      receiptDate,
      receivedById,
      notes: notes.trim() || null,
      items: itemsToReceive,
    };

    try {
      setLoading(true);
      const res = await fetch(
        `${API_URL}/purchase-orders/${purchaseOrder.id}/receipts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to create receipt");
      }

      toast.success("Items received successfully");
      onReceiptCreated();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Receive Items</DialogTitle>
          <DialogDescription>
            Record received items for purchase order {purchaseOrder.poNumber}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* General fields */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="receiptDate">Receipt Date</Label>
              <Input
                id="receiptDate"
                type="date"
                value={receiptDate}
                onChange={(e) => setReceiptDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="receivedBy">Received By (optional)</Label>
              <select
                id="receivedBy"
                value={receivedById ?? ""}
                onChange={(e) =>
                  setReceivedById(
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                className="w-full border rounded-md p-2"
              >
                <option value="">-- Select User --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes..."
              />
            </div>
          </div>

          {/* Line items */}
          <div>
            <Label>Items to Receive</Label>
            <div className="mt-2 border rounded-md overflow-hidden">
              <div className="grid grid-cols-12 gap-4 p-3 text-sm font-medium bg-muted/50 text-muted-foreground">
                <div className="col-span-3">Product</div>
                <div className="col-span-2">Ordered</div>
                <div className="col-span-2">Received</div>
                <div className="col-span-2">Remaining</div>
                <div className="col-span-3">Receiving Now</div>
              </div>
              <Separator />
              {lineItems.map((li, index) => {
                const remaining =
                  li.poItem.quantityOrdered -
                  (li.poItem.quantityReceived || 0);
                return (
                  <div
                    key={li.poItem.id}
                    className="grid grid-cols-12 gap-4 p-3 items-center text-sm"
                  >
                    <div className="col-span-3 font-medium">
                      {li.poItem.productName}
                    </div>
                    <div className="col-span-2">
                      {li.poItem.quantityOrdered}
                    </div>
                    <div className="col-span-2">
                      {li.poItem.quantityReceived || 0}
                    </div>
                    <div className="col-span-2">{remaining}</div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        min={0}
                        value={li.receivingNow}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        disabled={remaining === 0}
                        className={parseInt(li.receivingNow) > remaining ? "border-yellow-500 focus-visible:ring-yellow-500" : ""}
                      />
                      {parseInt(li.receivingNow) > remaining && (
                        <p className="text-xs text-yellow-600 mt-1">Exceeds remaining quantity</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Create Receipt"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
