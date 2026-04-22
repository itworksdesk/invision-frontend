import { useState, useEffect } from 'react';
import { Plus, Eye, Edit, Copy, Trash2, CheckCircle, XCircle, Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { DataTable } from '../components/ui/data-table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { toast } from 'sonner';
import type { Quotation } from '../types';
import QuotationForm from '../components/forms/QuotationForm';
import { Input } from '@/components/ui/input';
import QuotationView from '@/components/views/QuotationView';
import { useAuth } from "../auth/AuthContext";

// -----------------
// API functions
// -----------------
const API_URL = import.meta.env.VITE_API_URL;

const fetchQuotations = async (): Promise<Quotation[]> => {
  const response = await fetch(`${API_URL}/quotations`);
  if (!response.ok) throw new Error('Failed to fetch quotations');
  return response.json();
};

const fetchQuotation = async (id: number): Promise<Quotation> => {
  const response = await fetch(`${API_URL}/quotations/${id}`);
  if (!response.ok) throw new Error('Failed to fetch quotation');
  return response.json();
};

const deleteQuotation = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/quotations/${id}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to delete quotation');
};

const acceptQuotation = async (id: number): Promise<Quotation> => {
  const response = await fetch(`${API_URL}/quotations/${id}/accept`, { method: 'POST' });
  if (!response.ok) throw new Error('Failed to accept quotation');
  return response.json();
};

const rejectQuotation = async (id: number): Promise<Quotation> => {
  const response = await fetch(`${API_URL}/quotations/${id}/reject`, { method: 'POST' });
  if (!response.ok) throw new Error('Failed to reject quotation');
  return response.json();
};

const checkStockAvailability = async (quotation: Quotation): Promise<{ isValid: boolean; message?: string }> => {
  try {
    const response = await fetch(`${API_URL}/products-with-stock`);
    if (!response.ok) {
      return { isValid: false, message: "Failed to fetch stock information" };
    }
    
    const products = await response.json();
    
    for (const item of quotation.items) {
      const product = products.find((p: any) => String(p.id) === String(item.productId));
      
      if (!product) {
        return { 
          isValid: false, 
          message: `Product "${item.productName}" not found in inventory` 
        };
      }
      
      if (item.quantity > product.stock_info.available) {
        return { 
          isValid: false, 
          message: `Insufficient stock for "${item.productName}": requested ${item.quantity}, available ${product.stock_info.available}` 
        };
      }
    }
    
    return { isValid: true };
  } catch (error) {
    console.error('Stock check error:', error);
    return { isValid: false, message: "Error checking stock availability" };
  }
};

// -----------------
// Page Component
// -----------------
export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quotationToDelete, setQuotationToDelete] = useState<Quotation | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth(); // 👈 Get logged-in user
  const isSales = user?.role === "Sales"; // 👈 Check if role is "Sales"

  useEffect(() => {
    loadQuotations();
  }, []);

  const loadQuotations = async () => {
    try {
      setLoading(true);
      const data = await fetchQuotations();
      setQuotations(data);
    } catch (err) {
      toast.error('Failed to load quotations');
    } finally {
      setLoading(false);
    }
  };

  const refreshQuotation = async (id: number) => {
    try {
      const updated = await fetchQuotation(id);
      setQuotations(prev => prev.map(q => q.id === id ? updated : q));
      setSelectedQuotation(prev => (prev && prev.id === id ? updated : prev));
    } catch (err) {
      toast.error('Failed to refresh quotation');
    }
  };

  const handleCreateQuotation = () => {
    setEditingQuotation(null);
    setIsFormOpen(true);
  };

  const handleEditQuotation = (q: Quotation) => {
    setEditingQuotation(q);
    setIsFormOpen(true);
  };

  const handleDuplicateQuotation = async (q: Quotation) => {
    try {
      const payload = {
        customer_id: q.customerId,
        sales_person_id: q.salesPersonId,
        date: new Date().toISOString().split("T")[0],
        valid_until: q.validUntil,
        notes: q.notes,
        items: q.items.map(item => ({
          product_id: parseInt(item.productId),
          quantity: item.quantity,
          price: item.unitPrice,
          tax_rate: item.taxRate
        }))
      };

      const response = await fetch(`${API_URL}/quotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to duplicate quotation");
      const newQuotation = await response.json();

      setQuotations(prev => [newQuotation, ...prev]);
      toast.success("Quotation duplicated successfully");
    } catch (err) {
      toast.error("Error duplicating quotation");
    }
  };

  const handleDeleteQuotation = (q: Quotation) => {
    setQuotationToDelete(q);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteQuotation = async () => {
    if (!quotationToDelete) return;
    try {
      await deleteQuotation(quotationToDelete.id);
      await loadQuotations();
      toast.success("Quotation deleted successfully");
    } catch (err) {
      toast.error("Failed to delete quotation");
    } finally {
      setDeleteDialogOpen(false);
      setQuotationToDelete(null);
    }
  };

  const handleAcceptQuotation = async (q: Quotation) => {
    try {
      const stockCheck = await checkStockAvailability(q);
      
      if (!stockCheck.isValid) {
        toast.warning(stockCheck.message || "Some quantities exceed available stock. Inventory may go negative.");
      }
      
      const updated = await acceptQuotation(q.id);
      refreshQuotation(updated.id);
      toast.success("Quotation accepted");
    } catch (error) {
      console.error('Accept quotation error:', error);
      toast.error("Failed to accept quotation");
    }
  };

  const handleRejectQuotation = async (q: Quotation) => {
    try {
      const updated = await rejectQuotation(q.id);
      refreshQuotation(updated.id);
      toast.success("Quotation rejected");
    } catch {
      toast.error("Failed to reject quotation");
    }
  };

  const handleSaveQuotation = async () => {
    try {
      await loadQuotations();
      setIsFormOpen(false);
      setEditingQuotation(null);
      toast.success(editingQuotation ? 'Quotation updated successfully' : 'Quotation created successfully');
    } catch {
      toast.error('Failed to save quotation');
    }
  };

  // -----------------
  // Helpers
  // -----------------
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'open': return 'secondary';
      case 'accepted': return 'success';
      case 'rejected': return 'destructive';
      case 'expired': return 'destructive';
      default: return 'secondary';
    }
  };

  const formatStatusLabel = (status: string) =>
    status.charAt(0).toUpperCase() + status.slice(1);

  const columns = [
    { key: 'quotationNumber', label: 'Quotation #', sortable: true },
    { key: 'customerName', label: 'Customer', sortable: true },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'validUntil',
      label: 'Valid Until',
      sortable: true,
      render: (value: string | null) => value ? new Date(value).toLocaleDateString() : "",
    },
    {
      key: 'total',
      label: 'Total',
      sortable: true,
      render: (value: number) => `₱ ${Number(value).toLocaleString()}`,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => (
        <Badge variant={getStatusBadgeVariant(value)}>
          {formatStatusLabel(value)}
        </Badge>
      ),
    },
  ];

  const getActionItems = (q: Quotation) => {
    if (isSales) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="inline-flex justify-center items-center w-7 h-7 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-200 focus:outline-none">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 12h.01M12 12h.01M19 12h.01" />
              </svg>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSelectedQuotation(q)}>
              <Eye className="mr-2 h-4 w-4" /> View
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>        
      )
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="inline-flex justify-center items-center w-7 h-7 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-200 focus:outline-none">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 12h.01M12 12h.01M19 12h.01" />
            </svg>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setSelectedQuotation(q)}>
            <Eye className="mr-2 h-4 w-4" /> View
          </DropdownMenuItem>
          {/* ✏️ Only allow edit if status is "open" */}
          {q.status === "open" && (
            <DropdownMenuItem onClick={() => handleEditQuotation(q)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => handleDuplicateQuotation(q)}>
            <Copy className="mr-2 h-4 w-4" /> Duplicate
          </DropdownMenuItem>
          {q.status === "open" && (
            <>
              <DropdownMenuItem onClick={() => handleAcceptQuotation(q)}>
                <CheckCircle className="mr-2 h-4 w-4" /> Accept
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleRejectQuotation(q)}>
                <XCircle className="mr-2 h-4 w-4" /> Reject
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuItem onClick={() => handleDeleteQuotation(q)} className="text-red-600">
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  // -----------------
  // Render
  // -----------------
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          Loading quotations...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quotations</h1>
          <p className="text-muted-foreground">Manage your quotations</p>
        </div>
        {!isSales && (
          <Button onClick={handleCreateQuotation}>
            <Plus className="mr-2 h-4 w-4" /> New Quotation
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-4">
            <div className="relative w-[250px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search quotations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <DataTable
            data={quotations}
            columns={columns}
            searchTerm={searchTerm}
            onRowClick={(q) => setSelectedQuotation(q)}
            actions={getActionItems}
          />
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingQuotation ? 'Edit Quotation' : 'Create Quotation'}</DialogTitle>
            <DialogDescription>
              {editingQuotation ? 'Update the quotation details below.' : 'Fill in the details to create a new quotation.'}
            </DialogDescription>
          </DialogHeader>
          <QuotationForm
            quotation={editingQuotation}
            onSave={handleSaveQuotation}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

        <Dialog open={!!selectedQuotation} onOpenChange={(open) => !open && setSelectedQuotation(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
            <DialogTitle>Quotation Details</DialogTitle>
            </DialogHeader>
            {selectedQuotation && (
            <QuotationView
                quotation={selectedQuotation}
                onClose={() => setSelectedQuotation(null)}
                onEdit={() => {
                setSelectedQuotation(null);
                handleEditQuotation(selectedQuotation);
                }}
                onAccept={handleAcceptQuotation}
                onReject={handleRejectQuotation}
            />
            )}
        </DialogContent>
        </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Quotation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{quotationToDelete?.quotationNumber}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeleteQuotation}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
