"use client";

// import { useEffect } from "react"; // No longer needed
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LoadingButton from "@/components/ui/loading-button";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Download, Calendar, DollarSign } from "lucide-react";
import { useInvoices } from "@/contexts/InvoiceContext";

export function ClientDetails({ client, onCreateInvoice }) {
  const { getInvoicesForClient, loading, fetchInvoices } = useInvoices();

  // Get invoices from context
  const invoices = client ? getInvoicesForClient(client.id) : [];
  const isLoading = client ? loading[client.id] || false : false;

  // Removed fetchInvoices call - invoice-list component handles fetching
  // useEffect(() => {
  //   if (client) {
  //     fetchInvoices(client.id);
  //   }
  // }, [client?.id]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "OVERDUE":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  if (!client) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground mb-2 dark:text-gray-300">
            Select a Client
          </h3>
          <p className="text-muted-foreground dark:text-gray-400">
            Choose a client from the sidebar to view their invoices
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      {/* Client Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold dark:text-white">
              {client.name}
            </h1>
            <p className="text-muted-foreground dark:text-gray-400">
              {client.email}
            </p>
          </div>
          <LoadingButton
            onClick={() => onCreateInvoice(client)}
            className="gap-2"
            errorMessage="Failed to create invoice. Please try again."
          >
            <Plus className="h-4 w-4" />
            Create Invoice
          </LoadingButton>
        </div>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">
                  Email
                </p>
                <p className="text-sm dark:text-gray-200">{client.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">
                  Phone
                </p>
                <p className="text-sm dark:text-gray-200">
                  {client.phone || "Not provided"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">
                  Address
                </p>
                <p className="text-sm dark:text-gray-200">
                  {client.address || "Not provided"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold dark:text-white">Invoices</h2>
          <Badge variant="secondary">
            {invoices.length} {invoices.length === 1 ? "Invoice" : "Invoices"}
          </Badge>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground dark:text-gray-400">
              Loading invoices...
            </p>
          </div>
        ) : invoices.length === 0 ? (
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2 dark:text-gray-300">
                  No Invoices Yet
                </h3>
                <p className="text-muted-foreground mb-4 dark:text-gray-400">
                  Create your first invoice for {client.name}
                </p>
                <Button
                  onClick={() => onCreateInvoice(client)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create First Invoice
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {invoices.map((invoice) => {
              const invoiceData =
                typeof invoice.data === "string"
                  ? JSON.parse(invoice.data)
                  : invoice.data;

              const total =
                invoiceData?.items?.reduce((sum, item) => {
                  const subtotal = (item.quantity || 0) * (item.rate || 0);
                  return sum + subtotal;
                }, 0) || 0;

              const taxAmount = (total * (invoiceData?.taxRate || 0)) / 100;
              const discountAmount =
                (total * (invoiceData?.discountRate || 0)) / 100;
              const finalTotal = total + taxAmount - discountAmount;

              return (
                <Card
                  key={invoice.id}
                  className="hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg dark:text-white">
                          {invoiceData?.invoiceNumber ||
                            `Invoice #${invoice.id}`}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-1 dark:text-gray-300">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(
                              invoiceData?.invoiceDate || invoice.createdAt
                            )}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {formatCurrency(finalTotal)}
                          </span>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                        <Button size="sm" variant="outline" className="gap-1">
                          <Download className="h-3 w-3" />
                          PDF
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {invoiceData?.items && invoiceData.items.length > 0 && (
                    <CardContent>
                      <div className="text-sm text-muted-foreground dark:text-gray-400">
                        <p className="font-medium mb-1 dark:text-gray-300">
                          Items:
                        </p>
                        <ul className="list-disc list-inside space-y-1">
                          {invoiceData.items.slice(0, 3).map((item, index) => (
                            <li key={index}>
                              {item.description} - {item.quantity} ×{" "}
                              {formatCurrency(item.rate)}
                            </li>
                          ))}
                          {invoiceData.items.length > 3 && (
                            <li className="text-muted-foreground dark:text-gray-500">
                              +{invoiceData.items.length - 3} more items
                            </li>
                          )}
                        </ul>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
