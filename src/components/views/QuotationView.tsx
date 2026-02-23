import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Separator } from '../../components/ui/separator';
import { Edit, Download, Send, XCircle, CheckCircle } from 'lucide-react';
import type { Quotation } from '../../types';
import { useAuth } from "../../auth/AuthContext";
import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import PrintableInvoice from '../../components/prints/PrintableInvoice';
import { useReactToPrint } from 'react-to-print';
import { toast } from '../../components/ui/sonner';



interface QuotationViewProps {
  quotation: Quotation;
  onClose: () => void;
  onEdit: () => void;
  onAccept?: (quotation: Quotation) => void;
  onReject?: (quotation: Quotation) => void;
}

export default function QuotationView({ quotation, onClose, onEdit, onAccept, onReject }: QuotationViewProps) {
  const { user } = useAuth(); // ✅ get current user
  const isSales = user?.role === "Sales"; // ✅ check role
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);


  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'open': return 'primary';
      case 'accepted': return 'success';
      case 'rejected': return 'destructive';
      case 'expired': return 'destructive';
      default: return 'secondary';
    }
  };

  const handlePrint = () => {
    setIsPrintDialogOpen(true);
  };

  const handlePrintExecute = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Quotation-${quotation.quotationNumber}`,
    onAfterPrint: () => {
      setIsPrintDialogOpen(false);
      toast.success('Quotation printed successfully');
    },
  });


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Quotation {quotation.quotationNumber}</h2>
          <p className="text-muted-foreground">
            Created on {new Date(quotation.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={getStatusBadgeVariant(quotation.status)}>
            {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}
          </Badge>
          {/* ✏️ Edit only if quotation is open */}
          {quotation.status === "open" && !isSales && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Download className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quotation Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-medium">Quotation Number:</span>
              <span className="ml-2">{quotation.quotationNumber}</span>
            </div>
            <div>
              <span className="font-medium">Date:</span>
              <span className="ml-2">{new Date(quotation.date).toLocaleDateString()}</span>
            </div>
            {quotation.validUntil && (
              <div>
              <span className="font-medium">Valid Until:</span>
              <span className="ml-2">{new Date(quotation.validUntil).toLocaleDateString()}</span>
              </div>
            )}
            <div>
              <span className="font-medium">Status:</span>
              <Badge variant={getStatusBadgeVariant(quotation.status)} className="ml-2">
                {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-medium">Name:</span>
              <span className="ml-2">{quotation.customerName}</span>
            </div>
            <div>
              <span className="font-medium">Contact Person:</span>{' '}
              {quotation.customerContactPerson}
            </div>
            <div>
              <span className="font-medium">Email:</span>
              <span className="ml-2">{quotation.customerEmail}</span>
            </div>
            <div>
              <span className="font-medium">Address:</span>
              <div className="mt-1 text-sm text-muted-foreground">
                {quotation.customerAddress}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Tax</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotation.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">₱{item.unitPrice.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{item.taxRate * 100}%</TableCell>
                  <TableCell className="text-right font-medium">₱{item.total.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Separator className="my-4" />

          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₱{quotation.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>₱{quotation.tax.toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>₱{quotation.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {quotation.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{quotation.notes}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end space-x-2">
        {quotation.status === "open" && !isSales && (
          <>
            <Button onClick={() => onAccept?.(quotation)}>
              <CheckCircle className="mr-2 h-4 w-4" /> Accept
            </Button>
            <Button variant="destructive" onClick={() => onReject?.(quotation)}>
              <XCircle className="mr-2 h-4 w-4" /> Reject
            </Button>
          </>
        )}        
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>

      <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Print Quotation</DialogTitle>
            <DialogDescription>Preview before printing</DialogDescription>
          </DialogHeader>

          <div className="mb-4 flex justify-end space-x-2 no-print">
            <Button onClick={handlePrintExecute}>
              <Download className="mr-2 h-4 w-4" />
              Print Quotation
            </Button>
            <Button variant="outline" onClick={() => setIsPrintDialogOpen(false)}>
              Cancel
            </Button>
          </div>

          <div className="border rounded-lg">
            <PrintableInvoice
              ref={printRef}
              title="QUOTATION"
              mode="quotation"
              invoice={{
                ...quotation,
                invoiceNumber: quotation.quotationNumber,
                date: quotation.date,
                dueDate: quotation.validUntil || quotation.date,
                items: quotation.items,
                total: quotation.total,
                customerName: quotation.customerName,
                customerAddress: quotation.customerAddress,
                customerEmail: quotation.customerEmail,
                notes: quotation.notes,
                validUntil: quotation.validUntil,
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
        </DialogContent>
      </Dialog>

    </div>
  );
}