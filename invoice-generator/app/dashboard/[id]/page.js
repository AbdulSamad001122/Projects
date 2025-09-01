"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useClients } from "@/contexts/ClientContext";
import { useInvoices } from "@/contexts/InvoiceContext";
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
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import SidebarAwareNavbar from "@/components/SidebarAwareNavbar";
import InvoiceForm from "@/components/invoice-form";
import InvoiceList from "@/components/invoice-list";
import axios from "axios";

export default function ClientDashboard() {
  const { isLoaded, isSignedIn, user } = useUser();
  const params = useParams();
  const router = useRouter();
  const clientId = params.id;
  const { getClientById, loading: clientsLoading } = useClients();
  const { createInvoice, updateInvoice } = useInvoices();

  const [selectedClientId, setSelectedClientId] = useState(null);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);

  // Get client from context instead of making API call
  const client = getClientById(clientId);
  const loading = clientsLoading;

  useEffect(() => {
    if (clientId) {
      setSelectedClientId(clientId);
    }
  }, [clientId]);

  const handleClientSelect = (selectedClient) => {
    router.push(`/dashboard/${selectedClient.id}`);
  };

  const handleAddClient = (newClient) => {
    // Handle new client addition if needed
  };

  const handleInvoiceCreated = async (responseData) => {
    console.log("Invoice operation completed:", responseData);
    
    try {
      const invoiceObject = responseData.invoice || responseData;
      
      if (editingInvoice) {
        // For updates, pass the complete invoice object to context
        await updateInvoice(editingInvoice.id, invoiceObject);
      } else {
        // For creation, pass the complete invoice object to context
        await createInvoice(invoiceObject);
      }
    } catch (error) {
      console.error("Error updating context:", error);
    }
    
    // Close the form and reset editing state
    setShowInvoiceForm(false);
    setEditingInvoice(null);
  };

  const handleEditInvoice = (invoice) => {
    setEditingInvoice(invoice);
    setShowInvoiceForm(true);
  };

  // Show loading state while Clerk is loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 dark:border-gray-100"></div>
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
          <SidebarAwareNavbar />
          <div className="container mx-auto py-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="h-24 bg-gray-200 dark:bg-gray-700 rounded"
                  ></div>
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
          <SidebarAwareNavbar />
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
        <SidebarAwareNavbar />
        <div className="container mx-auto py-8 pt-20 space-y-8 px-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <SidebarTrigger className="" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/")}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="space-y-2 text-center">
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {client?.name || "Loading..."}
                </h1>
                <div className="flex items-center justify-center space-x-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
                    {client?.email}
                  </p>
                </div>
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
