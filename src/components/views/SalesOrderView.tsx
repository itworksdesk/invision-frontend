import { useRef, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { Edit, Printer, Mail, Receipt, Truck, Wallet, CircleX } from 'lucide-react';
import type { SalesOrder } from '../../types';
import CreateInvoiceDialog from '../forms/CreateInvoiceDialog';
import CreateShipmentDialog from '../../components/forms/CreateShipmentDialog';
import RecordPaymentDialog from '../../components/forms/RecordPaymentDialog';
import { toast } from '../ui/sonner';
import PrintableInvoice from '../prints/PrintableInvoice';
import { useReactToPrint } from 'react-to-print';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { useAuth } from "../../auth/AuthContext";


interface SalesOrderViewProps {
  salesOrder: SalesOrder;
  onClose: () => void;
  onEdit: () => void;
  onRefresh: (id: number) => void; // ✅ new
}

export default function SalesOrderView({
  salesOrder,
  onClose,
  onEdit,
  onRefresh,
}: SalesOrderViewProps) {
  const [isCreateShipmentOpen, setIsCreateShipmentOpen] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const [printData, setPrintData] = useState<any>(null);
  const { user } = useAuth(); // ✅ get current user
  const isSales = user?.role === "Sales"; // ✅ check role
  const [printTitle, setPrintTitle] = useState("SALES ORDER");

  const handlePrintNow = useReactToPrint({
    contentRef: printRef,
    documentTitle: printTitle,
  });
  
  const getInvoiceStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'not_invoiced':
        return 'destructive';
      case 'partial':
        return 'secondary';
      case 'invoiced':
        return 'success';
      default:
        return 'secondary';
    }
  };

  const getPaymentStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'unpaid':
        return 'destructive';
      case 'partial':
        return 'secondary';
      case 'paid':
        return 'success';
      default:
        return 'secondary';
    }
  };

  const getShipmentStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'not_shipped':
        return 'destructive';
      case 'partial':
        return 'secondary';
      case 'shipped':
        return 'success';
      default:
        return 'secondary';
    }
  };

  const handlePrintDeliveryReceipt = (order: SalesOrder) => {
    setPrintTitle("DELIVERY RECEIPT");
    setPrintData(order);
    setIsPrintDialogOpen(true);
  };

  const handlePrint = (order: SalesOrder) => {
    setPrintTitle("SALES ORDER");
    setPrintData(order);
    setIsPrintDialogOpen(true);
  };

  const formatStatusText = (status: string) => {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // const handlePrint = () => {
  //   window.print();
  // };

  const handleSendEmail = () => {
    alert('Email functionality would be implemented here');
  };

  const handleCreateInvoice = () => {
    setIsCreateInvoiceOpen(true);
  };

  const handleRecordPayment = () => {
    setIsRecordPaymentOpen(true);
  };

  const handleCreateShipment = () => {
    setIsCreateShipmentOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sales Order {salesOrder.orderNumber}</h2>
          <p className="text-muted-foreground">
            Created on {new Date(salesOrder.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handlePrint(salesOrder)}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          {/* <Button variant="outline" size="sm" onClick={handleSendEmail}>
            <Mail className="mr-2 h-4 w-4" />
            Send Email
          </Button> */}
          {/* ❌ Hide Edit if Sales role */}
          {!isSales && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (
                  ["partial", "invoiced"].includes(salesOrder.invoiceStatus) ||
                  ["partial", "paid"].includes(salesOrder.paymentStatus) ||
                  ["partial", "shipped"].includes(salesOrder.shipmentStatus)
                ) {
                  toast.error("Editing is not available once the order is invoiced, paid, or shipped.");
                  return;
                }
                onEdit();
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Order + Customer Info */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-medium">Order Date:</span>{' '}
              {new Date(salesOrder.date).toLocaleDateString()}
            </div>
            {salesOrder.deliveryDate && (
              <div>
                <span className="font-medium">Date Shipped:</span>{' '}
                {new Date(salesOrder.deliveryDate).toLocaleDateString()}
              </div>
            )}
            {salesOrder.salesPersonName && (
              <div>
                <span className="font-medium">Sales Person:</span>{' '}
                {salesOrder.salesPersonName}
              </div>
            )}
            <div className="space-y-2">
              <div>
                <span className="font-medium">Invoice Status:</span>{' '}
                <Badge variant={getInvoiceStatusBadgeVariant(salesOrder.invoiceStatus)}>
                  {formatStatusText(salesOrder.invoiceStatus)}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Payment Status:</span>{' '}
                <Badge variant={getPaymentStatusBadgeVariant(salesOrder.paymentStatus)}>
                  {formatStatusText(salesOrder.paymentStatus)}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Shipment Status:</span>{' '}
                <Badge variant={getShipmentStatusBadgeVariant(salesOrder.shipmentStatus)}>
                  {formatStatusText(salesOrder.shipmentStatus)}
                </Badge>
              </div>
            </div>
            {salesOrder.quotationId && (
              <div>
                <span className="font-medium">From Quotation #:</span>{' '}
                {salesOrder.quotationId}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-medium">Name:</span> {salesOrder.customerName}
            </div>
            <div>
              <span className="font-medium">Contact Person:</span>{' '}
              {salesOrder.customerContactPerson}
            </div>
            {salesOrder.customerEmail && (
              <div>
                <span className="font-medium">Email:</span> {salesOrder.customerEmail}
              </div>
            )}
            {salesOrder.customerAddress && (
              <div>
                <span className="font-medium">Address:</span>
                <div className="mt-1 text-sm text-muted-foreground whitespace-pre-line">
                  {salesOrder.customerAddress}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
              <div className="col-span-4">Item</div>
              <div className="col-span-2 text-right">Quantity</div>
              <div className="col-span-2 text-right">Unit Price</div>
              <div className="col-span-2 text-right">Tax</div>
              <div className="col-span-2 text-right">Total</div>
            </div>
            <Separator />
            {salesOrder.items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-4 text-sm">
                <div className="col-span-4">
                  <div className="font-medium">{item.productName}</div>
                  {item.description && (
                    <div className="text-muted-foreground">{item.description}</div>
                  )}
                </div>
                <div className="col-span-2 text-right">{item.quantity}</div>
                <div className="col-span-2 text-right">₱ {item.unitPrice.toLocaleString()}</div>
                <div className="col-span-2 text-right">{item.taxRate * 100}%</div>
                <div className="col-span-2 text-right">₱ {item.total.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₱ {salesOrder.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>₱ {salesOrder.tax.toLocaleString()}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>₱ {salesOrder.total.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {salesOrder.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {salesOrder.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action buttons */}
      <div className="flex justify-end gap-2">
        {/* ❌ Hide Edit if Sales role */}
        {!isSales && (
          <>
          {['not_invoiced', 'partial'].includes(salesOrder.invoiceStatus) && (
            <Button onClick={handleCreateInvoice}>
              <Receipt className="mr-2 h-4 w-4" /> Create Invoice
            </Button>
          )}

          {['invoiced', 'partial'].includes(salesOrder.invoiceStatus) &&
            salesOrder.paymentStatus !== 'paid' && (
              <Button onClick={handleRecordPayment}>
                <Wallet className="mr-2 h-4 w-4" /> Record Payment
              </Button>
            )}

          {salesOrder.shipmentStatus !== 'shipped' && (
            <Button onClick={handleCreateShipment}>
              <Truck className="mr-2 h-4 w-4" /> Create Shipment
            </Button>
          )}
          </>
        )}

        {['shipped', 'partial'].includes(salesOrder.shipmentStatus) && (
          <Button onClick={() => handlePrintDeliveryReceipt(salesOrder)}>
            <Printer className="mr-2 h-4 w-4" /> Print Delivery Receipt
          </Button>
        )}


        <Button variant="outline" onClick={onClose}>
          <CircleX className="mr-2 h-4 w-4" />
          Close
        </Button>
      </div>

      {/* Dialogs with refresh */}
      <CreateInvoiceDialog
        open={isCreateInvoiceOpen}
        onOpenChange={setIsCreateInvoiceOpen}
        salesOrder={salesOrder}
        onInvoiceCreated={() => {
          setIsCreateInvoiceOpen(false);
          onRefresh(Number(salesOrder.id));
        }}
      />

      <RecordPaymentDialog
        open={isRecordPaymentOpen}
        onOpenChange={setIsRecordPaymentOpen}
        salesOrder={salesOrder}
        onPaymentRecorded={() => {
          setIsRecordPaymentOpen(false);
          onRefresh(Number(salesOrder.id));
        }}
      />

      <CreateShipmentDialog
        open={isCreateShipmentOpen}
        onOpenChange={setIsCreateShipmentOpen}
        salesOrder={salesOrder}
        onShipmentCreated={() => {
          setIsCreateShipmentOpen(false);
          onRefresh(Number(salesOrder.id));
        }}
      />

      <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Print Delivery Receipt</DialogTitle>
            <DialogDescription>Preview before printing</DialogDescription>
          </DialogHeader>

          {printData && (
            <div>
              <div className="mb-4 flex justify-end space-x-2 no-print">
                <Button onClick={handlePrintNow}>
                  <Printer className="mr-2 h-4 w-4" /> Print Receipt
                </Button>
                <Button variant="outline" onClick={() => setIsPrintDialogOpen(false)}>
                  Cancel
                </Button>
              </div>

              <div className="border rounded-lg">
                <PrintableInvoice
                  ref={printRef}
                  title={printTitle}
                  mode={printTitle === "DELIVERY RECEIPT" ? "delivery" : "sales-order"}
                  invoice={{
                    ...printData,
                    invoiceNumber: printData.orderNumber,
                    date: printData.date,
                    dueDate: printData.deliveryDate || printData.date,
                    items: printData.items,
                    total: printData.total,
                    customerName: printData.customerName,
                    customerAddress: printData.customerAddress,
                  }}
                  companyInfo={{
                    name: 'PENTAMAX ELECTRICAL SUPPLY',
                    address: 'Arty 1 Subd. Brgy. Talipapa Novaliches Quezon City',
                    phone: '0916 453 8406',
                    email: 'pentamaxelectrical@gmail.com',
                    registrationNumber: '314-359-848-00000',
                    logo: '3.png',
                  }}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
