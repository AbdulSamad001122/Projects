"use client";

import { useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useClients } from "@/contexts/ClientContext";
import { useInvoices } from "@/contexts/InvoiceContext";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Plus,
  Users,
  FileText,
  User,
  Sparkles,
  Crown,
  Mail,
  Building2,
  Calendar,
  Clock,
  Search,
  Package,
  Edit,
  Trash2,
} from "lucide-react";
import axios from "axios";

export function AppSidebar({ selectedClientId, onClientSelect, onAddClient }) {
  const { user } = useUser();
  const router = useRouter();
  const {
    clients,
    loading,
    loadingMore,
    pagination,
    addClient,
    updateClient,
    deleteClient,
    refreshClients,
    loadMoreClients,
  } = useClients();
  const { refreshInvoices } = useInvoices();
  const clientsContainerRef = useRef(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [clientForm, setClientForm] = useState({ name: "", email: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "" });
  const [updateOption, setUpdateOption] = useState("fromNow"); // "fromNow" or "allInvoices"
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreateClient = async (e) => {
    e.preventDefault();
    if (!clientForm.name.trim()) return;

    setIsSubmitting(true);
    try {
      const newClient = await addClient({
        name: clientForm.name,
        email: clientForm.email || null,
      });

      console.log("Created client:", newClient);

      // Call the parent callback if provided
      if (onAddClient) {
        onAddClient(newClient);
      }

      // Reset form and close dialog
      setClientForm({ name: "", email: "" });
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error creating client:", error);
      // You might want to show an error message to the user here
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setClientForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditClient = (client) => {
    setEditingClient(client);
    setEditForm({ name: client.name, email: client.email || "" });
    setUpdateOption("fromNow"); // Reset to default
    setIsEditDialogOpen(true);
  };

  const handleUpdateClient = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim() || !editingClient) return;

    setIsEditSubmitting(true);
    try {
      await updateClient(
        editingClient.id,
        {
          name: editForm.name,
          email: editForm.email || null,
        },
        updateOption
      );

      // If updating all invoices, refresh invoice data to show updated client info
      if (updateOption === "allInvoices") {
        refreshInvoices(editingClient.id);
      }

      // Reset form and close dialog
      setEditForm({ name: "", email: "" });
      setUpdateOption("fromNow");
      setEditingClient(null);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating client:", error);
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleDeleteClick = (client) => {
    setClientToDelete(client);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;

    setIsDeleting(true);
    try {
      await deleteClient(clientToDelete.id);
      setClientToDelete(null);
      setDeleteConfirmOpen(false);
    } catch (error) {
      console.error("Error deleting client:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditInputChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  // Filter clients based on search query
  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.email &&
        client.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-3 px-4 py-6">
          <div className="p-2 bg-blue-600 rounded-lg">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Invoice Generator</h2>
            <p className="text-sm text-gray-600">Professional invoicing</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Navigation Menu */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => router.push("/items")}
                  className="w-full justify-start mx-2 my-1 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30 hover:border-green-300 dark:hover:border-green-600 hover:shadow-lg hover:shadow-green-100/50 dark:hover:shadow-green-900/20 transition-all duration-200 border border-transparent"
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center text-white shadow-lg">
                      <Package className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-sm dark:text-white">
                      Manage Items
                    </span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Clients Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between px-4 py-2">
            <span className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4" />
              Clients
            </span>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="h-6 w-6 p-0 bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] dark:bg-gray-800 dark:border-gray-700">
                <DialogHeader>
                  <DialogTitle className="dark:text-white">
                    Add New Client
                  </DialogTitle>
                  <DialogDescription className="dark:text-gray-300">
                    Create a new client for your invoice system.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateClient}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="dark:text-gray-200">
                        Client Name *
                      </Label>
                      <Input
                        id="name"
                        value={clientForm.name}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                        placeholder="Enter client's full name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="dark:text-gray-200">
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={clientForm.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        placeholder="client@example.com (optional)"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || !clientForm.name.trim()}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creating...
                        </>
                      ) : (
                        "Create Client"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </SidebarGroupLabel>

          {/* Search Bar */}
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input
                type="text"
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-600 focus:border-blue-300 focus:ring-blue-200 dark:text-white dark:placeholder-gray-400"
              />
            </div>
          </div>

          <SidebarGroupContent className="px-2 overflow-visible">
            <div 
              ref={clientsContainerRef}
              className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
              onScroll={(e) => {
                const { scrollTop, scrollHeight, clientHeight } = e.target;
                if (scrollHeight - scrollTop <= clientHeight + 50 && !loadingMore && pagination.hasMore) {
                  loadMoreClients();
                }
              }}
            >
              <SidebarMenu className="space-y-1 overflow-visible">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 dark:border-blue-400"></div>
                </div>
              ) : clients.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <Users className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    No clients yet
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Add your first client to get started
                  </p>
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <Search className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    No clients found
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Try adjusting your search terms
                  </p>
                </div>
              ) : (
                filteredClients.map((client, index) => {
                  const isActive = selectedClientId === client.id;
                  const clientInitials = client.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <div key={client.id}>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() => {
                            if (onClientSelect) {
                              onClientSelect(client);
                            }
                            router.push(`/dashboard/${client.id}`);
                          }}
                          isActive={isActive}
                          className={`w-full justify-start mx-2 my-2 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg hover:shadow-blue-100/50 dark:hover:shadow-blue-900/20 hover:-translate-y-0.5 border transition-all duration-500 ease-out group overflow-visible backdrop-blur-sm ${
                            isActive
                              ? "bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 border-blue-300 dark:border-blue-600 shadow-lg shadow-blue-100/50 dark:shadow-blue-900/20"
                              : "border-transparent dark:border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-3 w-full min-h-[3rem] cursor-pointer ">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-lg group-hover:shadow-xl group-hover:shadow-blue-500/30 group-hover:from-blue-700 group-hover:to-blue-800 group-hover:scale-105 transition-all duration-500 ease-out flex-shrink-0 ring-2 ring-white/20 group-hover:ring-blue-300/50">
                              {clientInitials ||
                                client.name?.charAt(0)?.toUpperCase() ||
                                "?"}
                            </div>
                            <div className="flex flex-col flex-1 min-w-0 py-1">
                              <span className="font-medium text-sm truncate dark:text-white">
                                {client.name}
                              </span>
                              {client.email && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                  {client.email}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <div
                                className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md flex items-center justify-center cursor-pointer transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditClient(client);
                                }}
                              >
                                <Edit className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                              </div>
                              <div
                                className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md flex items-center justify-center cursor-pointer transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(client);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-gray-600 dark:text-gray-400 hover:text-red-600" />
                              </div>
                            </div>
                          </div>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      {index < filteredClients.length - 1 && (
                        <div className="mx-4 my-2">
                          <div className="h-px bg-gray-200 dark:bg-gray-700"></div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              
              {/* Loading more indicator */}
              {loadingMore && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 dark:border-blue-400"></div>
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">Loading more clients...</span>
                </div>
              )}
              
              {/* End of list indicator */}
              {!pagination.hasMore && clients.length > 0 && filteredClients.length > 0 && (
                <div className="text-center py-4">
                  <span className="text-xs text-gray-500 dark:text-gray-400">No more clients to load</span>
                </div>
              )}
            </SidebarMenu>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>



      {/* Edit Client Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>
              Update the client information below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateClient}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) =>
                    handleEditInputChange("name", e.target.value)
                  }
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-email" className="text-right">
                  Email
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    handleEditInputChange("email", e.target.value)
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid gap-3 pt-4">
                <Label className="text-sm font-medium">Update Options</Label>
                <RadioGroup
                  value={updateOption}
                  onValueChange={setUpdateOption}
                  className="grid gap-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fromNow" id="fromNow" />
                    <Label
                      htmlFor="fromNow"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Update from now on (keep previous invoices unchanged)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="allInvoices" id="allInvoices" />
                    <Label
                      htmlFor="allInvoices"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Update all previous invoices with new information
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isEditSubmitting}>
                {isEditSubmitting ? "Updating..." : "Update Client"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Client</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{clientToDelete?.name}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}
