// export interface Customer {
//   id: string; 
//   name: string;
//   contact_person?: string;
//   email?: string;
//   phone?: string;
//   address?: string;
//   customer_since?: string; // Changed to string to match datetime in backend
// }

export interface SalesPerson {
  id: string;
  sales_person_code: string;
  name: string;
}

export interface Category{
  id: number;
  name: string;
  description?: string;
}

export interface Product extends Record<string, unknown>{
  id: string;
  product_code?: string;
  name: string;
  sku?: string;
  description?: string;
  category_id?: number;
  category_name?: string;
  quantity: number;
  cost_price: number;
  selling_price: number;
  image?: string;
  unit_measure?: string | null;
}

export interface LineItem {
  id: string;
  // 🔹 Either from a sales order item OR a standalone product
  soItemId?: string;       // if linked to sales order
  productId?: string;      // always present for standalone; also available via soItem.productId
  productCode?: string;  // convenience from backend join
  productName: string;
  description?: string | null;
  quantity: number;

  // For standalone, backend will send these explicitly
  unitCost?: number | null;
  unitPrice: number;   // required for calculations
  total: number;
  taxRate: number;
}

export interface Quotation extends Record<string, unknown> {
  id: number;
  quotationNumber: string;
  customerId: string;
  customerName: string;
  customerContactPerson: string | null;
  customerEmail: string | null;
  customerAddress: string | null;
  salesPersonId: string | null;
  salesPersonName: string | null;
  date: Date; 
  validUntil: Date | null; 
  status: "open" | "accepted" | "rejected" | "expired";
  subtotal: number;
  tax: number;
  total: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: LineItem[];
}

export interface SalesOrder extends Record<string, unknown> {
  id: string;
  orderNumber: string;
  quotationId?: string;
  customerId: string;
  customerName: string;
  customerContactPerson: string;
  customerEmail: string;
  customerAddress: string;
  salesPersonId: string;
  salesPersonName: string;
  date: string;
  deliveryDate: string;
  items: LineItem[];
  subtotal: number;
  tax: number;
  total: number;
  invoiceStatus: 'not_invoiced' | 'partial' | 'invoiced';
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  shipmentStatus: 'not_shipped' | 'partial' | 'shipped';
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice extends Record<string, unknown> {
  id: string;
  invoiceNumber: string;
  salesOrderId?: number | null;   // can be null for standalone invoices
  // salesPersonId?: string | null;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerAddress: string;
  date: string;
  dueDate: string;
  items: LineItem[];
  subtotal: number;
  tax: number;
  total?: number | null;
  status: 'unpaid' | 'partial' | 'paid'  | 'overdue' | 'cancelled';
  paidAmount: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// export interface PurchaseOrder extends Record<string, unknown> {
//   id: string;
//   poNumber: string;
//   supplierId: string;
//   supplierName: string;
//   supplierEmail: string;
//   supplierAddress: string;
//   date: string;
//   deliveryDate: string;
//   items: LineItem[];
//   subtotal: number;
//   tax: number;
//   taxRate: number;
//   total: number;
//   status: 'draft' | 'sent' | 'confirmed' | 'received' | 'cancelled';
//   notes: string;
//   createdAt: string;
//   updatedAt: string;
// }

export interface PurchaseOrderItem {
  id: number;
  productId: number;
  productName: string;        // convenience from backend join
  description?: string | null;
  quantityOrdered: number;
  quantityReceived: number;   // updated as receipts are created
  unitPrice: number;
  taxRate: number;
  lineTotal: number;
}


// export interface PurchaseOrderItem {
//   id: number;
//   productName: string;
//   description?: string;
//   quantityOrdered: number;
//   unitPrice: number;
//   taxRate: number;
//   lineTotal: number;
// }

export interface PurchaseOrder extends Record<string, unknown> {
  id: number;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  supplierContactPerson?: string;
  supplierEmail?: string;
  supplierAddress?: string;
  date: string;
  status: 'draft' | 'sent' | 'partially_received' | 'fully_received' | 'cancelled';
  items: PurchaseOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  paymentDate: string;  // ISO date
  amount: number;
  method: string;
  reference?: string;
  notes?: string;
  document?: string;  // URL or path to receipt
}

export interface SimpleCustomer {
  id: string;
  customer_code: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  contact_person: string | null;
  status: string;
}

export interface Customer {
  id: string;
  customer_code: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  contact_person: string | null;
  status: string;
  customer_since: string;
  total_orders: number;
  total_spent: number;
  average_order_value: number;
  has_unpaid_invoices: boolean;
  avatar: string;
}

export type SimpleSupplier = {
  id: number;
  supplier_code: string;
  name: string;
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  status?: string | null;
};

export interface Supplier {
  id: number;
  supplier_code: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  contact_person?: string | null;
  status: "Preferred" | "Active" | "Inactive" | "New";
  supplier_since: string; // ISO date string

  // Computed fields from backend
  total_purchase_orders: number;
  total_spent: number;
  average_order_value: number;
  has_pending_receipts: boolean;
  avatar: string;
}

export interface ActiveOrder {
  id: string;
  order_number: string;
  po_number: string;
  date: string;
  invoice_status: string;
  payment_status: string;
  shipment_status: string;
  total: number;
}

export interface OrderHistoryItem {
  id: string;
  order_number: string;
  date: string;
  items: {
    id: string;
    productId: string;
    productName: string;
    description?: string | null;
    quantity: number;
    unitCost: number;
    unitPrice: number;
    total: number;
    taxRate: number;
    shippedQuantity: number;
  }[];
  total: number;
}

// PURCHASE ORDER INTERFACES
export interface ActivePurchaseOrder {
  id: number;
  po_number: string;
  date: string; // ISO date string
  status: string; // e.g. "pending", "partially_received", "fully_received"
  total: number;
  total_received_quantity: number;
  total_ordered_quantity: number;
}

export interface PurchaseOrderHistoryItem {
  id: number;
  po_number: string;
  date: string; // ISO date string
  total: number;
}