// src/components/forms/CustomerForm.tsx

import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import type { Customer } from "../../types";
import { toast } from "sonner";

interface CustomerFormProps {
  customer?: Customer | null;
  onSave: (customer: Customer) => void;
  onCancel: () => void;
}

export default function CustomerForm({ customer, onSave, onCancel }: CustomerFormProps) {
  const API_URL = import.meta.env.VITE_API_URL;

  const [formData, setFormData] = useState({
    name: customer?.name || "",
    email: customer?.email || "",
    phone: customer?.phone || "",
    address: customer?.address || "",
    contact_person: customer?.contact_person || "",
    status: customer?.status || "new_customer",
    sales_person_id: customer?.sales_person_id?.toString() || "none",

  });

  const [users, setUsers] = useState<{ id: number; name: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API_URL}/users`);
        if (!res.ok) throw new Error("Failed to fetch users");
        const data = await res.json();
        setUsers(data);
      } catch {
        toast.error("Failed to load users");
      }
    };
    fetchUsers();
  }, []);



  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isValidEmail = (email: string) => {
    if (!email) return true; // empty is allowed
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }
  
    if (formData.email && !isValidEmail(formData.email)) {
      toast.error("Invalid email format");
      return;
    }

    setSaving(true);
    try {
      const url = customer
        ? `${API_URL}/customers/${customer.id}`
        : `${API_URL}/customers`;

      const method = customer ? "PUT" : "POST";

      // 🔹 Clean up data before sending
      const bodyData: Record<string, any> = { ...formData };
      Object.keys(bodyData).forEach((key) => {
        if (bodyData[key] === "") {
          bodyData[key] = null;
        }
      });
      // Convert sales_person_id to integer if present
      if (bodyData.sales_person_id === "none" || bodyData.sales_person_id === null) {
        bodyData.sales_person_id = null;
      } else {
        bodyData.sales_person_id = parseInt(bodyData.sales_person_id);
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to save customer");
      }

      const savedCustomer: Customer = await response.json();
      toast.success(customer ? "Customer updated successfully" : "Customer created successfully");
      onSave(savedCustomer);
    } catch (err) {
      console.error("Error saving customer:", err);
      toast.error(err instanceof Error ? err.message : "Failed to save customer");
    } finally {
      setSaving(false);
    }
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          value={formData.address}
          onChange={(e) => handleChange("address", e.target.value)}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact_person">Contact Person</Label>
        <Input
          id="contact_person"
          value={formData.contact_person}
          onChange={(e) => handleChange("contact_person", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sales_person_id">Assigned Sales Person</Label>
        <Select
          value={formData.sales_person_id}
          onValueChange={(value) => handleChange("sales_person_id", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select sales person (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">— None —</SelectItem>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id.toString()}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value) => handleChange("status", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new_customer">New Customer</SelectItem>
            <SelectItem value="regular">Regular</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : customer ? "Update Customer" : "Create Customer"}
        </Button>
      </div>
    </form>
  );
}
