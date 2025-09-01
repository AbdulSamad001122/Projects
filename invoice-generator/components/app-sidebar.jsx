"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import axios from "axios";

export function AppSidebar({ selectedClientId, onClientSelect, onAddClient }) {
  const { user } = useUser();
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [clientForm, setClientForm] = useState({ name: "", email: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await axios.get("/api/clients");
      setClients(response.data);
    } catch (error) {
      console.error("Error fetching clients:", error);
      // For now, use mock data if API fails
      setClients([
        { id: 1, name: "John Doe", email: "john@example.com" },
        { id: 2, name: "Jane Smith", email: "jane@example.com" },
        { id: 3, name: "Bob Johnson", email: "bob@example.com" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    if (!clientForm.name.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await axios.post("/api/clients", {
        name: clientForm.name,
        email: clientForm.email || null,
      });

      console.log("Created client:", response.data);
      // Add the new client to the list
      setClients((prev) => [response.data, ...prev]);

      // Call the parent callback if provided
      if (onAddClient) {
        onAddClient(response.data);
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

  // Filter clients based on search query
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.email && client.email.toLowerCase().includes(searchQuery.toLowerCase()))
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
                  <DialogTitle className="dark:text-white">Add New Client</DialogTitle>
                  <DialogDescription className="dark:text-gray-300">
                    Create a new client for your invoice system.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateClient}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="dark:text-gray-200">Client Name *</Label>
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
                      <Label htmlFor="email" className="dark:text-gray-200">Email Address</Label>
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
            <SidebarMenu className="space-y-1 overflow-visible">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 dark:border-blue-400"></div>
                </div>
              ) : clients.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <Users className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">No clients yet</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Add your first client to get started
                  </p>
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <Search className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">No clients found</p>
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
                              ? 'bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 border-blue-300 dark:border-blue-600 shadow-lg shadow-blue-100/50 dark:shadow-blue-900/20' 
                              : 'border-transparent dark:border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3 w-full min-h-[3rem] cursor-pointer ">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-lg group-hover:shadow-xl group-hover:shadow-blue-500/30 group-hover:from-blue-700 group-hover:to-blue-800 group-hover:scale-105 transition-all duration-500 ease-out flex-shrink-0 ring-2 ring-white/20 group-hover:ring-blue-300/50">
                              {clientInitials || client.name?.charAt(0)?.toUpperCase() || '?'}
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {user?.firstName?.charAt(0) ||
                user?.emailAddresses?.[0]?.emailAddress?.charAt(0) ||
                "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate dark:text-white">
                {user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user?.emailAddresses?.[0]?.emailAddress || "User"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.emailAddresses?.[0]?.emailAddress}
              </p>
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
