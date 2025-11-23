import { useState, useEffect } from 'react';
import { Plus, Eye, Edit, Trash2, Package, Download, Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { DataTable } from '../components/ui/data-table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import type { Product, Category } from '../types';
import ProductView from '../components/views/ProductView';
import { ImageOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import ProductsForm from '@/components/forms/ProductForm';
import { useAuth } from "../auth/AuthContext";


export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const API_URL = import.meta.env.VITE_API_URL;
  const { user } = useAuth(); // 👈 Get logged-in user
  const isSales = user?.role === "Sales"; // 👈 Check if role is "Sales"
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);


  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/categories`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/products`);
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data);
      console.log('Products loaded:', data);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsViewOpen(true);
  };

  const handleDeleteProduct = async (product: Product) => {
    if (window.confirm(`Are you sure you want to delete product ${product.name}?`)) {
      try {
        const response = await fetch(`${API_URL}/products/${product.id}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('This is included inside 1 or more documents and cannot be deleted');
        setProducts(prev => prev.filter(p => p.id !== product.id));
        toast.success('Product deleted successfully');
      } catch (error) {
        console.error('Error deleting product:', error);
        toast.error((error as Error).message);
      }
    }
  };

  const handleAdjustStock = async (product: Product, change: number) => {
    try {
      const response = await fetch(`${API_URL}/products/${product.id}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity_change: change }),
      });
      if (!response.ok) throw new Error('Failed to adjust stock');
      const updatedProduct = await response.json();
      setProducts(prev =>
        prev.map(p => (p.id === updatedProduct.id ? updatedProduct : p))
      );
      toast.success('Stock adjusted successfully');
    } catch (error) {
      console.error('Error adjusting stock:', error);
      toast.error('Failed to adjust stock');
    }
  };

  const getStatusBadge = (quantity: number) => {
    if (quantity === 0) {
      return <Badge variant="destructive" className="text-destructive">Out of Stock</Badge>;
    }

    if (quantity < 10) {
      return <Badge variant="secondary">Low Stock</Badge>;
    }

    return <Badge variant="success">In Stock</Badge>;
  };

  const columns = [
    {
      key: 'image',
      label: 'Image',
      render: (value: string) =>
        value ? (
          <img
            src={value}
            alt="Product"
            className="h-10 w-10 object-contain rounded"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : null,
    },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
    },
    {
      key: 'product_code',
      label: 'ID',
      sortable: true,
      render: (value: string) => value || <Badge variant="outline" className="text-muted-foreground"><ImageOff className="mr-2 h-4 w-4" />No Code</Badge>,
    },
    {
      key: 'sku',
      label: 'SKU',
      sortable: true,
    },
    {
      key: 'category_name',
      label: 'Category',
      sortable: true,
      render: (value: string) => value || 'Uncategorized',
    },
    {
      key: 'quantity',
      label: 'Stock',
      sortable: true,
      render: (_: any, item: Product) => item.quantity,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_: any, item: Product) => getStatusBadge(item.quantity),
    },
    {
      key: 'cost_price',
      label: 'Cost Price',
      sortable: true,
      render: (value: number) => `₱${value.toLocaleString()}`,
    },
    {
      key: 'selling_price',
      label: 'Selling Price',
      sortable: true,
      render: (value: number) => `₱${value.toLocaleString()}`,
    },
  ];

  if (!isSales) {
    columns.push({
      key: 'actions',
      label: 'Actions',
      sortable: false, // 👈 explicitly set
      render: (_: any, product: Product) => getActionItems(product),
    });
  }


  const filteredProducts = categoryFilter === 'all'
    ? products
    : products.filter(p => p.category_id?.toString() === categoryFilter);

  const totalInventoryValue = products.reduce(
    (sum, p) => sum + p.quantity * p.cost_price,
    0
  );

  const getActionItems = (product: Product) => {
    if (isSales) return null; // 👈 Hide actions for Sales role

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
        <DropdownMenuItem onClick={() => handleViewProduct(product)}>
          <Eye className="mr-2 h-4 w-4" />
          View
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleEditProduct(product)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        {/* <DropdownMenuItem onClick={() => handleAdjustStock(product, 10)}>
          <Package className="mr-2 h-4 w-4" />
          Add Stock (+10)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleAdjustStock(product, -10)}>
          <Package className="mr-2 h-4 w-4" />
          Reduce Stock (-10)
        </DropdownMenuItem> */}
        <DropdownMenuItem
          onClick={() => handleDeleteProduct(product)}
          className="text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Products</h1>
            <p className="text-muted-foreground">Manage your product inventory</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <div>Loading products...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Manage your product inventory</p>
        </div>
        <div className="flex items-center space-x-2">
          {!isSales && ( 
            <>
              <Button variant="outline" onClick={() => setIsImportOpen(true)}>
                  <Download className="mr-2 h-4 w-4" />
                  Import Products
              </Button>
              <Button onClick={handleCreateProduct}>
                <Plus className="mr-2 h-4 w-4" />
                New Product
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {products.filter(p => p.quantity < 10).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {products.filter(p => p.quantity === 0).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{totalInventoryValue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-[250px]"
                />
              </div>

              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[200px] text-muted-foreground">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DataTable
            data={filteredProducts}
            columns={columns}
            searchTerm={searchTerm}          // 👈 controlled search
            onRowClick={handleViewProduct}
            // actions={getActionItems}
          />
        </CardContent>
      </Card>


      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Create New Product'}</DialogTitle>
            <DialogDescription>
              {editingProduct
                ? 'Update the product details below.'
                : 'Fill in the details to create a new product.'
              }
            </DialogDescription>
          </DialogHeader>
          <ProductsForm
            product={editingProduct}
            categories={categories}
            onSuccess={loadProducts}
            onClose={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <ProductView
              product={selectedProduct}
              onClose={() => setIsViewOpen(false)}
              onEdit={() => {
                setIsViewOpen(false);
                handleEditProduct(selectedProduct);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Import Products Dialog */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Products</DialogTitle>
            <DialogDescription>Upload an Excel file (.xlsx) to import products.</DialogDescription>
          </DialogHeader>

          <input
            type="file"
            accept=".xlsx"
            onChange={(e) => setImportFile(e.target.files?.[0] || null)}
            className="border p-2 rounded w-full"
          />

          <Button
            className="mt-4"
            disabled={!importFile}
            onClick={async () => {
              if (!importFile) return;

              const formData = new FormData();
              formData.append("file", importFile);

              try {
                const res = await fetch(`${API_URL}/products/import`, {
                  method: "POST",
                  body: formData,
                });
                if (!res.ok) throw new Error("Import failed");

                toast.success("Products imported successfully!");
                setIsImportOpen(false);
                loadProducts(); // reload table
              } catch (error) {
                toast.error("Import failed");
              }
            }}
          >
            Upload & Import
          </Button>
        </DialogContent>
      </Dialog>

    </div>
  );
}