import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { Product, Category } from "@/types";

interface ProductFormProps {
  product: Product | null;
  categories: Category[];
  onSuccess: () => void;
  onClose: () => void;
}

export default function ProductsForm({ product, categories, onSuccess, onClose }: ProductFormProps) {
  const API_URL = import.meta.env.VITE_API_URL;
  const UNIT_MEASURE_OPTIONS = ["PCS", "BOX", "MTR", "ROLL"];
  
  const [isCustomUnit, setIsCustomUnit] = useState(
    !!product?.unit_measure && !["PCS", "BOX", "MTR", "ROLL"].includes(product?.unit_measure || "")
  );

  const [formData, setFormData] = useState({
    name: product?.name || "",
    sku: product?.sku || "",
    description: product?.description || "",
    category_id: product?.category_id?.toString() || "",
    category_name: product?.category_name || "",
    quantity: product?.quantity?.toString() || "0",
    cost_price: product?.cost_price?.toString() || "0",
    selling_price: product?.selling_price?.toString() || "0",
    image: product?.image || null,
    unit_measure: product?.unit_measure || "",
  });
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(product?.image || null);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle category select
  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({ ...prev, category_id: value }));
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append("file", file);

    try {
      setUploading(true);
      const res = await fetch(`${API_URL}/upload-image`, {
        method: "POST",
        body: formDataUpload,
      });

      if (!res.ok) throw new Error("Image upload failed");
      const data = await res.json();

      // Backend returns { image_path: "/uploads/images/..." }
      let imagePath = data.image_path;
      // Remove "/uploads/products" prefix if it exists
      if (imagePath.startsWith("/uploads/products/")) {
        imagePath = imagePath.replace("/uploads/products/", "");
      }
      setFormData(prev => ({ ...prev, image: imagePath }));
      const url = new URL(API_URL);
      const baseUrl = url.origin; // Extract base URL (protocol + host)
      setPreview(`${baseUrl}/uploads/products/${imagePath}`);
      toast.success("Image uploaded successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let imageValue = formData.image;

    // Normalize: keep only filename if it's a full URL
    if (imageValue && (imageValue.startsWith("http") || imageValue.startsWith("https"))) {
      const parts = imageValue.split("/uploads/products/");
      if (parts.length > 1) {
        imageValue = parts[1]; // just "product_xxx.jpg"
      }
    }    

    const payload = {
        name: formData.name,
        sku: formData.sku || null,   // ✅ null instead of ""
        description: formData.description || null,
        category_id: formData.category_id ? Number(formData.category_id) : null,
        category_name: categories.find(cat => cat.id.toString() === formData.category_id)?.name || null,
        quantity: Number(formData.quantity),
        cost_price: Number(formData.cost_price),
        selling_price: Number(formData.selling_price),
        image: imageValue || null,
        unit_measure: formData.unit_measure || null,
    };

    try {
      const method = product ? "PUT" : "POST";
      const url = product ? `${API_URL}/products/${product.id}` : `${API_URL}/products`;

        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

      if (!res.ok) throw new Error("Failed to save product");

      toast.success(product ? "Product updated" : "Product created");
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Error saving product");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
      </div>

      {/* SKU */}
      <div>
        <Label htmlFor="sku">SKU (optional)</Label>
        <Input id="sku" name="sku" value={formData.sku} onChange={handleChange} />
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" value={formData.description} onChange={handleChange} />
      </div>

      {/* Category */}
      <div>
        <Label>Category</Label>
        <Select value={formData.category_id} onValueChange={handleCategoryChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.id.toString()}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Quantity */}
      <div>
        <Label htmlFor="quantity">Quantity</Label>
        <Input id="quantity" name="quantity" type="number" value={formData.quantity} onChange={handleChange} />
      </div>

      {/* Cost Price */}
      <div>
        <Label htmlFor="cost_price">Cost Price</Label>
        <Input id="cost_price" name="cost_price" type="number" step="0.01" value={formData.cost_price} onChange={handleChange} />
      </div>

      {/* Selling Price */}
      <div>
        <Label htmlFor="selling_price">Selling Price</Label>
        <Input id="selling_price" name="selling_price" type="number" step="0.01" value={formData.selling_price} onChange={handleChange} />
      </div>
      
      {/* Unit of Measure */}
      <div>
        <Label>Unit of Measure</Label>
        <div className="flex gap-2">
          <Select
            value={isCustomUnit ? "__custom__" : (formData.unit_measure || "__none__")}
            onValueChange={(value) => {
              if (value === "__custom__") {
                setIsCustomUnit(true);
                setFormData(prev => ({ ...prev, unit_measure: "" }));
              } else if (value === "__none__") {
                setIsCustomUnit(false);
                setFormData(prev => ({ ...prev, unit_measure: "" }));
              } else {
                setIsCustomUnit(false);
                setFormData(prev => ({ ...prev, unit_measure: value }));
              }
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">None</SelectItem>
              {UNIT_MEASURE_OPTIONS.map(u => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
              <SelectItem value="__custom__">Custom...</SelectItem>
            </SelectContent>
          </Select>

          {isCustomUnit && (
            <Input
              placeholder="e.g. SET, LITER, PAIR"
              value={formData.unit_measure}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, unit_measure: e.target.value }))
              }
              className="flex-1"
            />
          )}
        </div>
      </div>

      {/* Image Upload */}
      <div>
        <Label>Product Image</Label>
        <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
        {preview && (
            <div className="mt-2">
                <img
                src={preview}
                alt="Preview"
                className="max-h-32 max-w-32 object-contain rounded border"
                />
            </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">{product ? "Update" : "Create"}</Button>
      </div>
    </form>
  );
}
