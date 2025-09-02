"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LoadingButton from "@/components/ui/loading-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { useItems } from "@/contexts/ItemContext";
import { useClients } from "@/contexts/ClientContext";

export function ItemForm({ onClose, onItemAdded, editItem = null }) {
  const { addItem, updateItem } = useItems();
  const { clients } = useClients();
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    isForAllClients: true,
    clientIds: [],
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedClients, setSelectedClients] = useState([]);

  // Initialize form data if editing
  useEffect(() => {
    if (editItem) {
      setFormData({
        name: editItem.name || "",
        price: editItem.price?.toString() || "",
        description: editItem.description || "",
        isForAllClients: editItem.isForAllClients || false,
        clientIds: editItem.itemClients?.map((ic) => ic.clientId) || [],
      });

      if (!editItem.isForAllClients && editItem.itemClients) {
        setSelectedClients(editItem.itemClients.map((ic) => ic.client));
      }
    }
  }, [editItem]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Item name is required";
    }

    if (!formData.price.trim()) {
      newErrors.price = "Price is required";
    } else if (
      isNaN(parseFloat(formData.price)) ||
      parseFloat(formData.price) < 0
    ) {
      newErrors.price = "Please enter a valid positive price";
    }

    if (!formData.isForAllClients && formData.clientIds.length === 0) {
      newErrors.clients =
        "Please select at least one client or choose 'For all clients'";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const itemData = {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        description: formData.description.trim() || null,
        isForAllClients: formData.isForAllClients,
        clientIds: formData.isForAllClients ? [] : formData.clientIds,
      };

      let savedItem;
      if (editItem) {
        savedItem = await updateItem(editItem.id, itemData);
      } else {
        savedItem = await addItem(itemData);
      }

      onItemAdded?.(savedItem);
      onClose();
    } catch (error) {
      console.error("Error saving item:", error);
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleClientToggle = (client) => {
    const isSelected = formData.clientIds.includes(client.id);

    if (isSelected) {
      setFormData((prev) => ({
        ...prev,
        clientIds: prev.clientIds.filter((id) => id !== client.id),
      }));
      setSelectedClients((prev) => prev.filter((c) => c.id !== client.id));
    } else {
      setFormData((prev) => ({
        ...prev,
        clientIds: [...prev.clientIds, client.id],
      }));
      setSelectedClients((prev) => [...prev, client]);
    }

    if (errors.clients) {
      setErrors((prev) => ({ ...prev, clients: "" }));
    }
  };

  const handleForAllClientsChange = (checked) => {
    setFormData((prev) => ({
      ...prev,
      isForAllClients: checked,
      clientIds: checked ? [] : prev.clientIds,
    }));

    if (checked) {
      setSelectedClients([]);
    }

    if (errors.clients) {
      setErrors((prev) => ({ ...prev, clients: "" }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>{editItem ? "Edit Item" : "Add New Item"}</CardTitle>
            <CardDescription>
              {editItem
                ? "Update item details and client assignments"
                : "Create a new item with pricing and client assignments"}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Item Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., Laptop, Consulting Service"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="price">Price (USD) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g., 1200.00"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                className={errors.price ? "border-red-500" : ""}
              />
              {errors.price && (
                <p className="text-sm text-red-500">{errors.price}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Additional details about the item..."
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                rows={3}
              />
            </div>

            {/* Client Assignment */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="forAllClients"
                  checked={formData.isForAllClients}
                  onCheckedChange={handleForAllClientsChange}
                />
                <Label htmlFor="forAllClients" className="text-sm font-medium">
                  Available for all clients
                </Label>
              </div>

              {!formData.isForAllClients && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Select Clients *
                  </Label>

                  {selectedClients.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedClients.map((client) => (
                        <Badge
                          key={client.id}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {client.name}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => handleClientToggle(client)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="border rounded-lg p-3 max-h-40 overflow-y-auto">
                    {clients.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-2">
                        No clients available. Create a client first.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {clients.map((client) => {
                          const isSelected = formData.clientIds.includes(
                            client.id
                          );
                          return (
                            <div
                              key={client.id}
                              className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                                isSelected
                                  ? "bg-blue-50 border border-blue-200"
                                  : "hover:bg-gray-50"
                              }`}
                              onClick={() => handleClientToggle(client)}
                            >
                              <div>
                                <p className="font-medium text-sm">
                                  {client.name}
                                </p>
                                {client.email && (
                                  <p className="text-xs text-gray-500">
                                    {client.email}
                                  </p>
                                )}
                              </div>
                              <div
                                className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                  isSelected
                                    ? "bg-blue-500 border-blue-500"
                                    : "border-gray-300"
                                }`}
                              >
                                {isSelected && (
                                  <Plus className="h-2 w-2 text-white rotate-45" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {errors.clients && (
                    <p className="text-sm text-red-500">{errors.clients}</p>
                  )}
                </div>
              )}
            </div>

            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <LoadingButton
                type="submit"
                disabled={loading}
                onClick={handleSubmit}
                errorMessage={
                  editItem
                    ? "Failed to update item. Please check your data and try again."
                    : "Failed to add item. Please check your data and try again."
                }
              >
                {editItem ? "Update Item" : "Add Item"}
              </LoadingButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default ItemForm;
