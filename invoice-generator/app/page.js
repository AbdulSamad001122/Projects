"use client";

import { useState } from "react";
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
import { Plus, FileText, Calendar, DollarSign } from "lucide-react";
import InvoiceForm from "@/components/invoice-form";
import { Separator } from "@/components/ui/separator";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default function Home() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [invoices, setInvoices] = useState([]);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Welcome to Invoice Generator
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Please sign in to start creating professional invoices
            </p>
          </div>
          <div className="mt-8 space-y-4">
            <Button asChild className="w-full">
              <a href="/signin">Sign In</a>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <a href="/signup">Create Account</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleInvoiceCreated = (newInvoice) => {
    const invoiceWithId = {
      ...newInvoice,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      userId: user.id,
    };
    setInvoices((prev) => [invoiceWithId, ...prev]);
    setShowInvoiceForm(false);
    setEditingInvoice(null);
  };

  const handleEditInvoice = (invoice) => {
    setEditingInvoice(invoice);
    setShowInvoiceForm(true);
  };

  const handleDeleteInvoice = (invoiceId) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceId));
  };

  const totalAmount = invoices.reduce((sum, invoice) => {
    const invoiceTotal =
      invoice.items?.reduce((itemSum, item) => {
        return itemSum + item.quantity * item.rate;
      }, 0) || 0;
    return sum + invoiceTotal;
  }, 0);

  if (showInvoiceForm) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="container mx-auto py-8">
            <InvoiceForm
              invoice={editingInvoice}
              onInvoiceCreated={handleInvoiceCreated}
              onCancel={() => {
                setShowInvoiceForm(false);
                setEditingInvoice(null);
              }}
            />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back,{" "}
            {user.firstName || user.emailAddresses[0].emailAddress}
          </p>
        </div>
        <Button onClick={() => setShowInvoiceForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Invoice
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Invoices
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalAmount.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Invoice</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $
              {invoices.length > 0
                ? (totalAmount / invoices.length).toFixed(2)
                : "0.00"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
          <CardDescription>
            {invoices.length === 0
              ? "No invoices created yet."
              : `You have ${invoices.length} invoice(s).`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No invoices
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new invoice.
              </p>
              <div className="mt-6">
                <Button onClick={() => setShowInvoiceForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Invoice
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => {
                const invoiceTotal =
                  invoice.items?.reduce((sum, item) => {
                    return sum + item.quantity * item.rate;
                  }, 0) || 0;

                return (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">
                          Invoice #{invoice.invoiceNumber || invoice.id}
                        </h3>
                        <Badge variant="outline">
                          {invoice.status || "Draft"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {invoice.clientName} • ${invoiceTotal.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(invoice.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditInvoice(invoice)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteInvoice(invoice.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
