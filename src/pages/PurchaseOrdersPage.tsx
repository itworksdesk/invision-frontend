import { useState, useEffect } from "react";
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  Package,
  Search,
  Undo2,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { DataTable } from "../components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import PurchaseOrderForm from "../components/forms/PurchaseOrderForm";
import PurchaseOrderView from "../components/views/PurchaseOrderView";
import type { PurchaseOrder } from "../types";
import ReceiveItemDialog from "../components/forms/ReceiveItemDialog";
import { useAuth } from "../auth/AuthContext";


// API functions

const API_URL = import.meta.env.VITE_API_URL;

const fetchPurchaseOrders = async (): Promise<PurchaseOrder[]> => {
  const response = await fetch(`${API_URL}/purchase-orders`);
  if (!response.ok) throw new Error("Failed to fetch purchase orders");
  return response.json();
};

const fetchPurchaseOrder = async (id: number): Promise<PurchaseOrder> => {
  const response = await fetch(
    `${API_URL}/purchase-orders/${id}`
  );
  if (!response.ok) throw new Error("Failed to fetch purchase order");
  return response.json();
};

const deletePurchaseOrder = async (id: number): Promise<void> => {
  const response = await fetch(
    `${API_URL}/purchase-orders/${id}`,
    { method: "DELETE" }
  );
  if (!response.ok) throw new Error("Failed to delete purchase order");
};

export default function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] =
    useState<PurchaseOrder | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [editingPurchaseOrder, setEditingPurchaseOrder] =
    useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [purchaseOrderToDelete, setPurchaseOrderToDelete] =
    useState<PurchaseOrder | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPO, setSelectedPO] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const { user } = useAuth();
  const isSales = user?.role === "Sales"; // 👈 detect Sales role


  useEffect(() => {
    loadPurchaseOrders();
  }, []);

  const loadPurchaseOrders = async () => {
    try {
      setLoading(true);
      const data = await fetchPurchaseOrders();
      setPurchaseOrders(data);
    } catch (error) {
      console.error("Error loading purchase orders:", error);
      toast.error("Failed to load purchase orders");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePurchaseOrder = () => {
    setEditingPurchaseOrder(null);
    setIsFormOpen(true);
  };

  const handleEditPurchaseOrder = (po: PurchaseOrder) => {
    // setEditingPurchaseOrder(po);
    setSelectedPO(po);
    setIsFormOpen(true);
  };

  const handleViewPurchaseOrder = (po: PurchaseOrder) => {
    setSelectedPurchaseOrder(po);
    setIsViewOpen(true);
  };

  const handleDeletePurchaseOrder = (po: PurchaseOrder) => {
    setPurchaseOrderToDelete(po);
    setDeleteDialogOpen(true);
  };

  const confirmDeletePurchaseOrder = async () => {
    if (!purchaseOrderToDelete) return;
    try {
      await deletePurchaseOrder(purchaseOrderToDelete.id);
      await loadPurchaseOrders();
      toast.success("Purchase order deleted successfully");
    } catch (error) {
      console.error("Error deleting purchase order:", error);
      toast.error("Failed to delete purchase order");
    } finally {
      setDeleteDialogOpen(false);
      setPurchaseOrderToDelete(null);
    }
  };

  const columns = [
    { key: "poNumber", label: "PO #", sortable: true },
    { key: "supplierName", label: "Supplier", sortable: true },
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (value: string) => (
        // <Badge variant="secondary">{value}</Badge>
        <Badge
          variant={
            value === "draft"
              ? "secondary"
              : value === "partial_received"
              ? "secondary"
              : value === "received"
              ? "success"
              : "default"
          }
        >
          {value}
        </Badge>
      ),
    },
    {
      key: "total",
      label: "Total",
      sortable: true,
      render: (value: number) => `₱ ${value.toLocaleString()}`,
    },
  ];

  const getActionItems = (po: PurchaseOrder) => {
    if (isSales) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="inline-flex justify-center items-center w-7 h-7 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-200 focus:outline-none"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 12h.01M12 12h.01M19 12h.01" />
              </svg>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleViewPurchaseOrder(po)}>
              <Eye className="mr-2 h-4 w-4" /> View
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="inline-flex justify-center items-center w-7 h-7 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-200 focus:outline-none"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={4}
                d="M5 12h.01M12 12h.01M19 12h.01"
              />
            </svg>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleViewPurchaseOrder(po)}>
            <Eye className="mr-2 h-4 w-4" /> View
          </DropdownMenuItem>
          {po.status !== 'received' && (
            <DropdownMenuItem onClick={() => { setSelectedPO(po); setShowForm(true); }}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
          )}
          {po.status !== 'received' && po.status !== 'cancelled' && (
            <DropdownMenuItem onClick={() => { setSelectedPO(po); setIsReceiveOpen(true); }}>
              <Package className="mr-2 h-4 w-4" /> Receive Items
            </DropdownMenuItem>
          )}
          {po.status === 'received' && (
            <DropdownMenuItem onClick={async () => {
              try {
                const res = await fetch(`${API_URL}/purchase-orders/${po.id}/undo-receipt`, { method: 'POST' });
                if (!res.ok) { const e = await res.json(); throw new Error(e.detail); }
                await loadPurchaseOrders();
                toast.success('Last receipt undone');
              } catch (err) {
                toast.error((err as Error).message);
              }
            }}>
              <Undo2 className="mr-2 h-4 w-4" /> Undo Last Receipt
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => handleDeletePurchaseOrder(po)}
            className="text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Purchase Orders
            </h1>
            <p className="text-muted-foreground">
              Manage your purchase orders and track receipts
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <div>Loading purchase orders...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Purchase Orders
          </h1>
          <p className="text-muted-foreground">
            Manage your purchase orders and track receipts
          </p>
        </div>
        {!isSales && (
          <Button onClick={() => { setSelectedPO(null); setShowForm(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            New Purchase Order
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-4">
            <div className="relative w-[250px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search purchase orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <DataTable
            data={purchaseOrders}
            columns={columns}
            searchTerm={searchTerm}
            onRowClick={handleViewPurchaseOrder}
            actions={getActionItems}
          />
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPurchaseOrder
                ? "Edit Purchase Order"
                : "Create New Purchase Order"}
            </DialogTitle>
            <DialogDescription>
              {editingPurchaseOrder
                ? "Update the purchase order details below."
                : "Fill in the details to create a new purchase order."}
            </DialogDescription>
          </DialogHeader>
          <PurchaseOrderForm
            purchaseOrder={selectedPO}
            onSave={async (savedPO) => {
              setShowForm(false);
              await loadPurchaseOrders();
              toast.success(
                savedPO.id
                  ? "Purchase order updated successfully"
                  : "Purchase order created successfully"
              );
            }}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Purchase Order Details</DialogTitle>
          </DialogHeader>
          {selectedPurchaseOrder && (
            <PurchaseOrderView
              purchaseOrder={selectedPurchaseOrder}
              onClose={() => setIsViewOpen(false)}
              onEdit={() => {
                setIsViewOpen(false);
                handleEditPurchaseOrder(selectedPurchaseOrder);
                setShowForm(true);
              }}
              onReceive={() => {
                setIsViewOpen(false);
                setSelectedPO(selectedPurchaseOrder);
                setIsReceiveOpen(true);
              }}
              onUndo={async () => {      
                await loadPurchaseOrders();
                setIsViewOpen(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Purchase Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {purchaseOrderToDelete?.poNumber}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeletePurchaseOrder}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Receive Items Dialog */}
      {selectedPO && (
        <ReceiveItemDialog
          open={isReceiveOpen}
          onOpenChange={setIsReceiveOpen}
          purchaseOrder={selectedPO}
          onReceiptCreated={async () => {
            await loadPurchaseOrders();
            toast.success("Receipt recorded successfully");
          }}
        />
      )}

    </div>
  );
}
