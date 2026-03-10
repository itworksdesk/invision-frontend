import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Search, Filter, AlertTriangle, Edit, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Customer, ActiveOrder, OrderHistoryItem } from "@/types";
import CustomerForm from "@/components/forms/CustomerForm";
import { toast } from "@/components/ui/sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "../auth/AuthContext";

// ---------------- API Calls ----------------
const API_URL = import.meta.env.VITE_API_URL;

// AFTER
const fetchCustomers = async (): Promise<Customer[]> => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/customers`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error("Failed to fetch customers");
  return res.json();
};

const fetchActiveOrders = async (customerId: number): Promise<ActiveOrder[]> => {
  const res = await fetch(`${API_URL}/customers/${customerId}/active-orders`);
  if (!res.ok) throw new Error("Failed to fetch active orders");
  return res.json();
};

const fetchOrderHistory = async (
  customerId: number
): Promise<OrderHistoryItem[]> => {
  const res = await fetch(`${API_URL}/customers/${customerId}/order-history`);
  if (!res.ok) throw new Error("Failed to fetch order history");
  return res.json();
};

const deleteCustomer = async (id: number) => {
  const res = await fetch(`${API_URL}/customers/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to delete customer");
  }
};

// ---------------- Helpers ----------------
const deriveOrderStatus = (order: ActiveOrder): string => {
  if (order.invoice_status === "partial") return "Partially Invoiced";
  if (order.payment_status === "partial") return "Partially Paid";
  if (order.shipment_status === "partial") return "Partially Shipped";

  if (
    order.invoice_status === "invoiced" &&
    order.payment_status === "paid" &&
    order.shipment_status === "shipped"
  ) {
    return "Completed";
  }

  if (order.invoice_status === "invoiced" && order.payment_status !== "paid")
    return "Invoiced";

  if (order.payment_status === "unpaid") return "Unpaid";

  if (order.shipment_status === "shipped") return "Shipped";

  return "Active";
};

const derivedCustomerStatus = (customer: Customer): string => {
  if (customer.status === "premium") return "Premium";
  if (customer.status === "regular") return "Regular";
  if (customer.status === "new_customer") return "New Customer";
  return "Unknown";
};

const getStatusVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case "partially invoiced":
    case "partially paid":
    case "partially shipped":
      return "secondary";
    case "invoiced":
      return "default";
    case "unpaid":
      return "destructive";
    case "shipped":
      return "outline";
    case "completed":
      return "default";
    default:
      return "secondary";
  }
};

const getCustomerStatusVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case "premium":
      return "default";
    case "regular":
      return "primary";
    case "new_customer":
      return "success";
    default:
      return "secondary";
  }
};

// ---------------- Component ----------------
const CustomersPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [orderHistory, setOrderHistory] = useState<OrderHistoryItem[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { user } = useAuth(); // 👈 Get logged-in user
  const isSales = user?.role === "Sales"; // 👈 Check if role is "Sales"
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const data = await fetchCustomers();
        setCustomers(data);
        if (data.length > 0) setSelectedCustomer(data[0]);
      } catch (err) {
        console.error("Error loading customers:", err);
      }
    };
    loadCustomers();
  }, []);

  useEffect(() => {
    if (!selectedCustomer) return;
    const loadOrders = async () => {
      try {
        const [active, history] = await Promise.all([
          fetchActiveOrders(Number(selectedCustomer.id)),
          fetchOrderHistory(Number(selectedCustomer.id)),
        ]);
        setActiveOrders(active);
        setOrderHistory(history);
      } catch (err) {
        console.error("Error loading orders:", err);
      }
    };
    loadOrders();
  }, [selectedCustomer]);

  // Filter customers
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      c.customer_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setIsFormOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsFormOpen(true);
  };

  const handleSaveCustomer = async (savedCustomer: Customer) => {
    try {
      const data = await fetchCustomers();
      setCustomers(data);
      setSelectedCustomer(savedCustomer);
      setIsFormOpen(false);
      setEditingCustomer(null);
    } catch (error) {
      console.error("Error refreshing customers:", error);
      toast.error("Failed to refresh customers");
    }
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;
    try {
      await deleteCustomer(Number(selectedCustomer.id));
      toast.success("Customer deleted successfully");
      const data = await fetchCustomers();
      setCustomers(data);
      setSelectedCustomer(null); // clear right panel
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete customer");
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
              <h1 className="text-2xl font-semibold text-gray-800">Customers</h1>
              {!isSales && (
                <Button size="sm" variant="outline" className="gap-1" onClick={handleAddCustomer}>
                  <Plus className="h-4 w-4" />
                  Add Customer
                </Button>
              )}
            </div>
            <div className="flex items-center justify-between mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers"
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
                <span className="text-gray-600">New Customer</span>
              </div>
              <div className="flex items-center mr-4">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                <span className="text-gray-600">Regular</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
                <span className="text-gray-600">Premium</span>
              </div>
            </div>
          </div>

          {/* Customer List */}
          <div className="flex-1 overflow-y-auto">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                onClick={() => setSelectedCustomer(customer)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedCustomer?.id === customer.id ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex items-center">
                  <img
                    src={customer.avatar}
                    alt={customer.name}
                    className="w-10 h-10 rounded-full mr-3"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">{customer.name}</h3>
                      <div
                        className={`w-2 h-2 rounded-full mr-2 ${
                          customer.status === "new_customer"
                            ? "bg-green-400"
                            : customer.status === "regular"
                            ? "bg-blue-400"
                            : "bg-purple-400"
                        }`}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600">{customer.customer_code}</p>
                    <p className="text-sm text-gray-600">{customer.email}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Right Panel */}
        <ScrollArea className="flex-1 overflow-y-auto">
          {selectedCustomer && (
            <div className="p-6">
              {/* Header */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <img
                        src={selectedCustomer.avatar}
                        alt={selectedCustomer.name}
                        className="w-16 h-16 rounded-full mr-4"
                      />
                      <div>
                        <h1 className="text-2xl font-semibold text-gray-900">
                          {selectedCustomer.name}
                        </h1>
                        <p className="text-gray-600">{selectedCustomer.customer_code}</p>
                        <p className="text-gray-600">{selectedCustomer.contact_person}</p>
                        <p className="text-gray-600">{selectedCustomer.email}</p>
                        <p className="text-gray-600">{selectedCustomer.phone}</p>
                        {selectedCustomer.sales_person_name && (
                          <p className="text-gray-600">Sales Person: {selectedCustomer.sales_person_name}</p>
                        )}                        
                        
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className="px-3 py-1 text-xs"
                        variant={getCustomerStatusVariant(selectedCustomer.status)}
                      >
                        {derivedCustomerStatus(selectedCustomer)}
                      </Badge>
                      {!isSales && (
                        <>
                        <Button variant="outline" size="sm" onClick={() => handleEditCustomer(selectedCustomer)}>
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
                      <p className="text-sm text-gray-600">Total Orders</p>
                      <p className="text-xl font-semibold text-gray-900">
                        {selectedCustomer.total_orders}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Spent</p>
                      <p className="text-xl font-semibold text-gray-900">
                        ₱{Number(selectedCustomer.total_spent).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Average Order Value</p>
                      <p className="text-xl font-semibold text-gray-900">
                        ₱{Number(selectedCustomer.average_order_value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Customer Since</p>
                      <p className="text-xl font-semibold text-gray-900">
                        {selectedCustomer.customer_since}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Unpaid invoices warning */}
              {selectedCustomer.has_unpaid_invoices && (
                <Alert className="mb-6" variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>This customer has unpaid invoices.</AlertDescription>
                </Alert>
              )}

              {/* Active Orders */}
              <Card className="mb-6">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="text-lg font-semibold">Active Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            PO#
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Total Sales
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {activeOrders.map((order) => {
                          const status = deriveOrderStatus(order);
                          return (
                            <tr key={order.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <Badge variant={getStatusVariant(status)}>{status}</Badge>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">{order.order_number}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{order.date}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                ₱{order.total.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                        {activeOrders.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                              No active orders for this customer
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
                          <th className="px-2 py-2 text-left text-sm font-medium text-gray-500">Order #</th>
                          <th className="px-2 py-2 text-left text-sm font-medium text-gray-500">Date</th>
                          <th className="px-2 py-2 text-left text-sm font-medium text-gray-500">Total Sales</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderHistory.length === 0 && (
                          <tr>
                            <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                              No past orders for this customer
                            </td>
                          </tr>
                        )}

                        {orderHistory.map((order) => (
                          <React.Fragment key={order.id}>
                            {/* Collapsible Header Row */}
                            <tr
                              onClick={() =>
                                setExpandedOrder((prev) => (prev === order.id ? null : order.id))
                              }
                              className="cursor-pointer hover:bg-gray-50 border-b border-gray-200"
                            >
                              <td className="px-2 py-2 text-sm font-medium text-gray-900">
                                {order.order_number}
                              </td>
                              <td className="px-2 py-2 text-sm text-gray-700">{order.date}</td>
                              <td className="px-2 py-2 text-sm text-gray-700">
                                ₱
                                {order.items
                                  .reduce((sum, item) => sum + item.total, 0)
                                  .toLocaleString()}
                              </td>
                            </tr>

                            {/* Expanded Details */}
                            {expandedOrder === order.id && (
                              <tr className="bg-gray-50">
                                <td colSpan={3} className="px-2 py-2">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="border-b border-gray-200">
                                        <th className="text-left py-1 px-2 text-gray-600">Item</th>
                                        <th className="text-left py-1 px-2 text-gray-600">Quantity</th>
                                        <th className="text-left py-1 px-2 text-gray-600">Unit Price</th>
                                        <th className="text-left py-1 px-2 text-gray-600">Total</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {order.items.map((item, idx) => (
                                        <tr key={idx} className="border-b border-gray-100">
                                          <td className="py-1 px-2 text-gray-800">{item.productName}</td>
                                          <td className="py-1 px-2 text-gray-800">{item.quantity}</td>
                                          <td className="py-1 px-2 text-gray-800">
                                            ₱{item.unitPrice.toLocaleString()}
                                          </td>
                                          <td className="py-1 px-2 text-gray-800">
                                            ₱{item.total.toLocaleString()}
                                          </td>
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

      {/* Create/Edit Customer Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? "Edit Customer" : "Create New Customer"}</DialogTitle>
            <DialogDescription>
              {editingCustomer ? "Update the customer details below." : "Fill in the details to create a new customer."}
            </DialogDescription>
          </DialogHeader>
          <CustomerForm
            customer={editingCustomer}
            onSave={handleSaveCustomer}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Customer Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{selectedCustomer?.name}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCustomer}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ScrollArea>
  );
};

export default CustomersPage;
