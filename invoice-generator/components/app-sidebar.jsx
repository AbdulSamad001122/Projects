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
import { Plus, Users, FileText, User } from "lucide-react";
import axios from "axios";

export function AppSidebar({ selectedClientId, onClientSelect, onAddClient }) {
  const { user } = useUser();
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [clientForm, setClientForm] = useState({ name: "", email: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const response = await axios.post('/api/clients', {
        name: clientForm.name,
        email: clientForm.email || null,
      });
      
      console.log("Created client:", response.data);
      // Add the new client to the list
      setClients(prev => [response.data, ...prev]);
      
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
    setClientForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <FileText className="h-6 w-6 text-blue-600" />
          <span className="font-semibold text-lg">Invoice Generator</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Clients
            </span>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Client</DialogTitle>
                  <DialogDescription>
                    Create a new client to add to your invoice system.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateClient}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Name *
                      </Label>
                      <Input
                        id="name"
                        value={clientForm.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        className="col-span-3"
                        placeholder="Client name"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="email" className="text-right">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={clientForm.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className="col-span-3"
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
                    <Button type="submit" disabled={isSubmitting || !clientForm.name.trim()}>
                      {isSubmitting ? "Creating..." : "Create Client"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {loading ? (
                <div className="px-4 py-2 text-sm text-muted-foreground">
                  Loading clients...
                </div>
              ) : clients.length === 0 ? (
                <div className="px-4 py-2 text-sm text-muted-foreground">
                  No clients yet. Add your first client!
                </div>
              ) : (
                clients.map((client) => (
                  <SidebarMenuItem key={client.id}>
                    <SidebarMenuButton
                      onClick={() => {
                        if (onClientSelect) {
                          onClientSelect(client);
                        }
                        router.push(`/dashboard/${client.id}`);
                      }}
                      isActive={selectedClientId === client.id}
                      className="w-full justify-start"
                    >
                      <User className="h-4 w-4" />
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{client.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {client.email}
                        </span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="px-4 py-2 border-t">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">
                {user?.firstName?.charAt(0) ||
                  user?.emailAddresses?.[0]?.emailAddress?.charAt(0) ||
                  "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user?.emailAddresses?.[0]?.emailAddress || "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.emailAddresses?.[0]?.emailAddress}
              </p>
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
