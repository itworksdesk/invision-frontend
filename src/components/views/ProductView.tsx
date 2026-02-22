import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Separator } from '../../components/ui/separator';
import { Edit } from 'lucide-react';
import type { Product } from '../../types';
import { useAuth } from "../../auth/AuthContext";


interface ProductViewProps {
  product: Product;
  onClose: () => void;
  onEdit: () => void;
}

export default function ProductView({ product, onClose, onEdit }: ProductViewProps) {
  const { user } = useAuth(); // ✅ get current user
  const isSales = user?.role === "Sales"; // ✅ check role

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{product.name}</h2>
          <p className="text-muted-foreground">SKU: {product.sku}</p>
        </div>
        <div className="flex items-center space-x-2">
          {!isSales && (  
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-medium">Name:</span>
              <span className="ml-2">{product.name}</span>
            </div>
            <div>
              <span className="font-medium">SKU:</span>
              <span className="ml-2">{product.sku}</span>
            </div>
            <div>
              <span className="font-medium">Unit of Measure:</span>
              <span className="ml-2">{product.unit_measure || '-'}</span>
            </div>
            <div>
              <span className="font-medium">Category:</span>
              <span className="ml-2">{product.category_name || 'Uncategorized'}</span>
            </div>
            <div>
              <span className="font-medium">Stock Quantity:</span>
              <span className="ml-2">{product.quantity}</span>
            </div>
            <div>
              <span className="font-medium">Cost Price:</span>
              <span className="ml-2">₱{product.cost_price.toFixed(2)}</span>
            </div>
            <div>
              <span className="font-medium">Selling Price:</span>
              <span className="ml-2">₱{product.selling_price.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-medium">Description:</span>
              <div className="mt-1 text-sm text-muted-foreground">
                {product.description || '-'}
              </div>
            </div>
            <div>
              <span className="font-medium">Image:</span>
              <div className="mt-1">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-24 w-24 object-contain rounded"
                  />
                ) : (
                  <span className="text-sm text-muted-foreground">No image</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}