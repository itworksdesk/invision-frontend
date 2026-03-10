// src/pages/SuppliersPage.tsx

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Search, Filter, AlertTriangle, Edit, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import SupplierForm from "@/components/forms/SupplierForm";
import type { Supplier, ActivePurchaseOrder, PurchaseOrderHistoryItem } from "@/types";
import { useAuth } from "../auth/AuthContext";


const API_URL = import.meta.env.VITE_API_URL

// ---------------- API Calls ----------------
const fetchSuppliers = async (): Promise<Supplier[]> => {
  const res = await fetch(`${API_URL}/suppliers`);
  if (!res.ok) throw new Error("Failed to fetch suppliers");
  return res.json();
};

const fetchActiveOrders = async (supplierId: number): Promise<ActivePurchaseOrder[]> => {
  const res = await fetch(`${API_URL}/suppliers/${supplierId}/active-orders`);
  if (!res.ok) throw new Error("Failed to fetch active purchase orders");
  return res.json();
};

const fetchOrderHistory = async (supplierId: number): Promise<PurchaseOrderHistoryItem[]> => {
  const res = await fetch(`${API_URL}/suppliers/${supplierId}/order-history`);
  if (!res.ok) throw new Error("Failed to fetch purchase order history");
  return res.json();
};

const deleteSupplier = async (id: number) => {
  const res = await fetch(`${API_URL}/suppliers/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to delete supplier");
  }
};

// ---------------- Helpers ----------------
const derivedSupplierStatus = (status: string): string => {
  switch (status.toLowerCase()) {
    case "preferred":
      return "Preferred";
    case "active":
      return "Active";
    case "inactive":
      return "Inactive";
    case "new":
      return "New";
    default:
      return "Unknown";
  }
};

const getSupplierStatusVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case "preferred":
      return "default";
    case "active":
      return "primary";
    case "inactive":
      return "gray";
    case "new":
      return "success";
    default:
      return "secondary";
  }
};

const getStatusVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case "draft":
      return "secondary";
    case "partial_received":
      return "secondary";
    case "ordered":
      return "primary";
    case "received":
      return "success";
    case "canceled":
      return "destructive";
    default:
      return "outline";
  }
};

// ---------------- Component ----------------
const SuppliersPage = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeOrders, setActiveOrders] = useState<ActivePurchaseOrder[]>([]);
  const [orderHistory, setOrderHistory] = useState<PurchaseOrderHistoryItem[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { user } = useAuth(); // Get logged-in user
  const isSales = user?.role === "Sales"; 
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);


  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const data = await fetchSuppliers();
        setSuppliers(data);
        if (data.length > 0) setSelectedSupplier(data[0]);
      } catch (err) {
        console.error("Error loading suppliers:", err);
        toast.error("Failed to load suppliers");
      }
    };
    loadSuppliers();
  }, []);

  useEffect(() => {
    if (!selectedSupplier) return;
    const loadOrders = async () => {
      try {
        const [active, history] = await Promise.all([
          fetchActiveOrders(Number(selectedSupplier.id)),
          fetchOrderHistory(Number(selectedSupplier.id)),
        ]);
        setActiveOrders(active);
        setOrderHistory(history);
      } catch (err) {
        console.error("Error loading supplier orders:", err);
      }
    };
    loadOrders();
  }, [selectedSupplier]);

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      s.supplier_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddSupplier = () => {
    setEditingSupplier(null);
    setIsFormOpen(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsFormOpen(true);
  };

  const handleSaveSupplier = async (savedSupplier: Supplier) => {
    try {
      const data = await fetchSuppliers();
      setSuppliers(data);
      setSelectedSupplier(savedSupplier);
      toast.success(editingSupplier ? "Supplier updated" : "Supplier created");
    } catch (error) {
      console.error("Error refreshing suppliers:", error);
      toast.error("Failed to refresh suppliers");
    } finally {
      setIsFormOpen(false);
      setEditingSupplier(null);
    }
  };

  const handleDeleteSupplier = async () => {
    if (!selectedSupplier) return;
    try {
      await deleteSupplier(selectedSupplier.id);
      toast.success("Supplier deleted successfully");
      const data = await fetchSuppliers();
      setSuppliers(data);
      setSelectedSupplier(data.length > 0 ? data[0] : null);
    } catch (error) {
      console.error("Error deleting supplier:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete supplier");
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  return (
    <ScrollArea>
      <div className="flex h-screen">
        {/* Left Panel */}
        <ScrollArea className="w-1/3 bg-white border-r border-gray-200 flex flex-col rounded-lg">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-semibold text-gray-800">Suppliers</h1>
              {!isSales && (
                <Button size="sm" variant="outline" className="gap-1" onClick={handleAddSupplier}>
                  <Plus className="h-4 w-4" />
                  Add Supplier
                </Button>
              )}
            </div>
            <div className="flex items-center justify-between mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search suppliers"
                  className="pl-9 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {/* <Button variant="ghost" size="sm" className="ml-2 text-gray-400">
                <Filter className="h-4 w-4" />
              </Button> */}
            </div>
            {/* Filter Legend */}
            <div className="flex items-center mt-3 text-sm">
              <div className="flex items-center mr-4">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                <span className="text-gray-600">New</span>
              </div>
              <div className="flex items-center mr-4">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                <span className="text-gray-600">Active</span>
              </div>
              <div className="flex items-center mr-4">
                <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                <span className="text-gray-600">Inactive</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
                <span className="text-gray-600">Preferred</span>
              </div>
            </div>
          </div>

          {/* Supplier List */}
          <div className="flex-1 overflow-y-auto">
            {filteredSuppliers.map((supplier) => (
              <div
                key={supplier.id}
                onClick={() => setSelectedSupplier(supplier)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedSupplier?.id === supplier.id ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex items-center">
                  <img
                    src={supplier.avatar || "https://via.placeholder.com/40"}
                    alt={supplier.name}
                    className="w-10 h-10 rounded-full mr-4 object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">{supplier.name}</h3>
                      <div
                        className={`w-2 h-2 rounded-full mr-2 ${
                          supplier.status === "New"
                            ? "bg-green-400"
                            : supplier.status === "Active"
                            ? "bg-blue-400"
                            : supplier.status === "Preferred"
                            ? "bg-purple-400"
                            : "bg-gray-400"
                        }`}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600">{supplier.supplier_code}</p>
                    <p className="text-sm text-gray-600">{supplier.email}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Right Panel */}
        <ScrollArea className="flex-1 overflow-y-auto">
          {selectedSupplier && (
            <div className="p-6">
              {/* Header */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <img
                        src={selectedSupplier.avatar || "https://via.placeholder.com/40"}
                        alt={selectedSupplier.name}
                        className="w-16 h-16 rounded-full mr-4"
                      />
                      <div>
                        <h1 className="text-2xl font-semibold text-gray-900">{selectedSupplier.name}</h1>
                        <p className="text-sm text-gray-600 mb-1">{selectedSupplier.supplier_code}</p>
                        <p className="text-gray-600">{selectedSupplier.contact_person}</p>
                        <p className="text-gray-600">{selectedSupplier.email}</p>
                        <p className="text-gray-600">{selectedSupplier.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="px-3 py-1 text-xs" variant={getSupplierStatusVariant(selectedSupplier.status)}>
                        {derivedSupplierStatus(selectedSupplier.status)}
                      </Badge>
                      {!isSales && (
                        <>
                        <Button variant="outline" size="sm" onClick={() => handleEditSupplier(selectedSupplier)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setDeleteDialogOpen(true)}>
                          <Trash2 className="h-4 w-4 mr-2 text-red-500" />
                          Delete
                        </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
                    <div>
                      <p className="text-sm text-gray-600">Total Purchase Orders</p>
                      <p className="text-xl font-semibold text-gray-900">{selectedSupplier.total_purchase_orders}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Spent</p>
                      <p className="text-xl font-semibold text-gray-900">₱{Number(selectedSupplier.total_spent).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Average Order Value</p>
                      <p className="text-xl font-semibold text-gray-900">₱{Number(selectedSupplier.average_order_value).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Supplier Since</p>
                      <p className="text-xl font-semibold text-gray-900">{selectedSupplier.supplier_since}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pending receipts warning */}
              {selectedSupplier.has_pending_receipts && (
                <Alert className="mb-6" variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>This supplier has pending receipts.</AlertDescription>
                </Alert>
              )}

              {/* Active Purchase Orders */}
              <Card className="mb-6">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="text-lg font-semibold">Active Purchase Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO#</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {activeOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{order.po_number}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{order.date}</td>
                            <td className="px-4 py-3">
                              <Badge variant={getStatusVariant(order.status)} className="px-2 py-1 text-xs">
                                {order.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">₱{order.total.toLocaleString()}</td>
                          </tr>
                        ))}
                        {activeOrders.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                              No active purchase orders for this supplier
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Order History */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="text-lg font-semibold">Order History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="px-2 py-2 text-left text-sm font-medium text-gray-500">PO#</th>
                          <th className="px-2 py-2 text-left text-sm font-medium text-gray-500">Date</th>
                          <th className="px-2 py-2 text-left text-sm font-medium text-gray-500">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                      {orderHistory.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                            No past purchase orders for this supplier
                          </td>
                        </tr>
                      )}
                      {orderHistory.map((order) => (
                        <React.Fragment key={order.id}>
                          <tr
                            onClick={() => setExpandedOrder((prev) => (prev === order.id ? null : order.id))}
                            className="cursor-pointer hover:bg-gray-50 border-b border-gray-200"
                          >
                            <td className="px-2 py-2 text-sm font-medium text-gray-900">{order.po_number}</td>
                            <td className="px-2 py-2 text-sm text-gray-700">{order.date}</td>
                            <td className="px-2 py-2 text-sm text-gray-700">₱{order.total.toLocaleString()}</td>
                          </tr>

                          {expandedOrder === order.id && (
                            <tr className="bg-gray-50">
                              <td colSpan={3} className="px-2 py-2">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-gray-200">
                                      <th className="text-left py-1 px-2 text-gray-600">Item</th>
                                      <th className="text-left py-1 px-2 text-gray-600">Qty Ordered</th>
                                      <th className="text-left py-1 px-2 text-gray-600">Unit Price</th>
                                      <th className="text-left py-1 px-2 text-gray-600">Total</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {order.items.map((item, idx) => (
                                      <tr key={idx} className="border-b border-gray-100">
                                        <td className="py-1 px-2 text-gray-800">{item.productName}</td>
                                        <td className="py-1 px-2 text-gray-800">{item.quantityOrdered}</td>
                                        <td className="py-1 px-2 text-gray-800">₱{item.unitPrice.toLocaleString()}</td>
                                        <td className="py-1 px-2 text-gray-800">₱{item.lineTotal.toLocaleString()}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Create/Edit Supplier Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSupplier ? "Edit Supplier" : "Create New Supplier"}</DialogTitle>
            <DialogDescription>
              {editingSupplier ? "Update the supplier details below." : "Fill in the details to create a new supplier."}
            </DialogDescription>
          </DialogHeader>
          <SupplierForm
            supplier={editingSupplier}
            onSave={handleSaveSupplier}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Supplier Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Supplier</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{selectedSupplier?.name}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSupplier}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ScrollArea>
  );
};

export default SuppliersPage;
