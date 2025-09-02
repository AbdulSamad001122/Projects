"use client";

import { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Globe,
  Users,
} from "lucide-react";
import { useItems } from "@/contexts/ItemContext";
import { ItemForm } from "./item-form";

export function ItemList({ selectedClients = [], showAllClients = false }) {
  const { items, loading, loadingMore, pagination, deleteItem, loadMoreItems } = useItems();
  const itemsContainerRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItemId, setDeletingItemId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const filteredItems = items.filter((item) => {
    // First apply search filter
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // If no client filter is applied, show all items
    if (!showAllClients && selectedClients.length === 0) {
      return true;
    }

    // If "Show All Items" is selected, show all items
    if (showAllClients) {
      return true;
    }

    // Filter by selected clients
    if (selectedClients.length > 0) {
      // Show items that are for all clients
      if (item.isForAllClients) {
        return true;
      }

      // Show items that are assigned to any of the selected clients
      if (item.itemClients && item.itemClients.length > 0) {
        return item.itemClients.some((ic) =>
          selectedClients.some(
            (selectedClient) => selectedClient.id === ic.client.id
          )
        );
      }

      // If item has no client assignments and is not for all clients, don't show it
      return false;
    }

    return true;
  });

  const handleEditItem = (item) => {
    setEditingItem(item);
    setShowItemForm(true);
  };

  const handleDeleteItem = async (itemId) => {
    setItemToDelete(itemId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      setDeletingItemId(itemToDelete);
      try {
        await deleteItem(itemToDelete);
        setDeleteDialogOpen(false);
        setItemToDelete(null);
      } catch (error) {
        console.error("Error deleting item:", error);
        alert("Failed to delete item. Please try again.");
      } finally {
        setDeletingItemId(null);
      }
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleCloseForm = () => {
    setShowItemForm(false);
    setEditingItem(null);
  };

  const handleItemAdded = () => {
    // Item list will automatically update through context
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading items...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Saved Items</CardTitle>
              <CardDescription>
                Manage your reusable items for invoice creation
              </CardDescription>
            </div>
            <Button onClick={() => setShowItemForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Items List */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Plus className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? "No items found" : "No items yet"}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "Create your first reusable item to speed up invoice creation"}
              </p>
              {!searchQuery && (
                <Button onClick={() => setShowItemForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Item
                </Button>
              )}
            </div>
          ) : (
            <div 
              ref={itemsContainerRef}
              className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
              onScroll={(e) => {
                const { scrollTop, scrollHeight, clientHeight } = e.target;
                if (scrollHeight - scrollTop <= clientHeight + 50 && !loadingMore && pagination.hasMore) {
                  loadMoreItems();
                }
              }}
            >
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{item.name}</h3>
                        <span className="text-lg font-bold text-green-600">
                          ${parseFloat(item.price).toFixed(2)}
                        </span>
                      </div>

                      {item.description && (
                        <p className="text-gray-600 mb-3">{item.description}</p>
                      )}

                      <div className="flex items-center gap-2">
                        {item.isForAllClients ? (
                          <Badge
                            variant="default"
                            className="flex items-center gap-1"
                          >
                            <Globe className="h-3 w-3" />
                            All Clients
                          </Badge>
                        ) : (
                          <>
                            <Badge
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              <Users className="h-3 w-3" />
                              {item.itemClients?.length || 0} Client(s)
                            </Badge>
                            {item.itemClients &&
                              item.itemClients.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {item.itemClients.slice(0, 3).map((ic) => (
                                    <Badge
                                      key={ic.client.id}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {ic.client.name}
                                    </Badge>
                                  ))}
                                  {item.itemClients.length > 3 && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      +{item.itemClients.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              )}
                          </>
                        )}
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditItem(item)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-600"
                          disabled={deletingItemId === item.id}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {deletingItemId === item.id
                            ? "Deleting..."
                            : "Delete"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
              
              {/* Loading more indicator */}
              {loadingMore && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 dark:border-blue-400"></div>
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">Loading more items...</span>
                </div>
              )}
              
              {/* End of list indicator */}
              {!pagination.hasMore && items.length > 0 && filteredItems.length > 0 && (
                <div className="text-center py-4">
                  <span className="text-xs text-gray-500 dark:text-gray-400">No more items to load</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Item Form Modal */}
      {showItemForm && (
        <ItemForm
          onClose={handleCloseForm}
          onItemAdded={handleItemAdded}
          editItem={editingItem}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this item? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={cancelDelete}
              className="cursor-pointer hover:bg-gray-100 transition-colors duration-200"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              className="cursor-pointer hover:bg-red-700 transition-colors duration-200"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function ItemListWrapper(props) {
  return <ItemList {...props} />;
}
