"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Plus,
  FileText,
  Calendar,
  DollarSign,
  User,
  Mail,
} from "lucide-react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import InvoiceForm from "@/components/invoice-form";
import InvoiceList from "@/components/invoice-list";
import axios from "axios";

export default function ClientDashboard() {
  const { isLoaded, isSignedIn, user } = useUser();
  const params = useParams();
  const router = useRouter();
  const clientId = params.id;

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);

  useEffect(() => {
    if (clientId) {
      setSelectedClientId(parseInt(clientId));
      fetchClientData();
    }
  }, [clientId]);

  const fetchClientData = async () => {
    try {
      const response = await axios.get(`/api/clients/${clientId}`);
      setClient(response.data);
    } catch (error) {
      console.error("Error fetching client:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClientSelect = (selectedClient) => {
    router.push(`/dashboard/${selectedClient.id}`);
  };

  const handleAddClient = (newClient) => {
    // Handle new client addition if needed
  };

  const handleInvoiceCreated = (newInvoice) => {
    console.log("Invoice created:", newInvoice);
    // You can add logic here to update local state or refresh invoice list
    setShowInvoiceForm(false);
    setEditingInvoice(null);
    // Optionally refresh the page or update invoice list
    window.location.reload();
  };

  const handleEditInvoice = (invoice) => {
    setEditingInvoice(invoice);
    setShowInvoiceForm(true);
  };

  // Show loading state while Clerk is loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Redirect to sign in if not authenticated
  if (!isSignedIn) {
    router.push("/signin");
    return null;
  }

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar
          selectedClientId={selectedClientId}
          onClientSelect={handleClientSelect}
          onAddClient={handleAddClient}
        />
        <SidebarInset>
          <div className="container mx-auto py-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (showInvoiceForm) {
    return (
      <SidebarProvider>
        <AppSidebar
          selectedClientId={selectedClientId}
          onClientSelect={handleClientSelect}
          onAddClient={handleAddClient}
        />
        <SidebarInset>
          <div className="container mx-auto py-8">
            <InvoiceForm
              invoice={editingInvoice}
              onInvoiceCreated={handleInvoiceCreated}
              onCancel={() => {
                setShowInvoiceForm(false);
                setEditingInvoice(null);
              }}
              preselectedClient={client}
            />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar
        selectedClientId={selectedClientId}
        onClientSelect={handleClientSelect}
        onAddClient={handleAddClient}
      />
      <SidebarInset>
        <div className="container mx-auto py-8 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/")}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {client?.name || "Loading..."}
                </h1>
                <p className="text-muted-foreground">{client?.email}</p>
              </div>
            </div>
            <Button onClick={() => setShowInvoiceForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </div>

          {/* Invoice List */}
          <div className="mt-8">
            <InvoiceList
              clientId={clientId}
              onEditInvoice={handleEditInvoice}
            />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
