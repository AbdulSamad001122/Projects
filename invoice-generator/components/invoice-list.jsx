"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import LoadingButton from "@/components/ui/loading-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  FileText,
  Download,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  Search,
  X,
  CheckCircle,
  Copy,
} from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import InvoicePDF from "@/app/utils/invoiceTemplate";
import { getTemplateComponent, DEFAULT_TEMPLATE } from "@/app/utils/templates";
import { prepareInvoiceDataForPDF } from "@/app/utils/imageToBase64";
import { useInvoices } from "@/contexts/InvoiceContext";

export default function InvoiceList({ clientId, onEditInvoice }) {
  const {
    getInvoicesForClient,
    loading,
    loadingMore,
    searchLoading,
    pagination,
    error,
    fetchInvoices,
    loadMoreInvoices,
    deleteInvoice,
    updateInvoiceStatus,
    duplicateInvoice,
  } = useInvoices();
  const invoicesContainerRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [searchStatus, setSearchStatus] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);

  // Get invoices from context
  const rawInvoices = getInvoicesForClient(clientId);
  const invoices = useMemo(() => rawInvoices, [rawInvoices]);
  const isLoading = loading[clientId] || false;
  const isLoadingMore = loadingMore[clientId] || false;
  const isSearchLoading = searchLoading[clientId] || false;
  const fetchError = error[clientId] || null;
  const clientPagination = pagination[clientId] || { hasMore: false };

  useEffect(() => {
    if (clientId) {
      fetchInvoices(clientId, true); // Reset pagination when client changes
    }
  }, [clientId, fetchInvoices]);

  // Debounced search effect to prevent excessive API calls
  useEffect(() => {
    if (!clientId) return;
    
    const timeoutId = setTimeout(() => {
      const searchParams = {
        search: searchTerm,
        date: searchDate,
        status: searchStatus
      };
      
      fetchInvoices(clientId, false, true, searchParams); // Reset pagination for search
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [clientId, searchTerm, searchDate, searchStatus, fetchInvoices]);

  // Use invoices directly since filtering is now done server-side
  const filteredInvoices = invoices;

  const clearSearch = () => {
    setSearchTerm("");
    setSearchDate("");
    setSearchStatus("");
  };

  const handleDownloadPDF = async (invoice) => {
    try {
      const invoiceData = invoice.data || {};

      // Prepare the invoice data for PDF generation
      const pdfData = {
        companyName: invoiceData.companyName || "",
        companyEmail: invoiceData.companyEmail || "",
        companyLogo: invoiceData.companyLogo || "",
        companyCustomFields: invoiceData.companyCustomFields || [],
        clientName: invoiceData.clientName || "",
        clientEmail: invoiceData.clientEmail || "",
        clientCustomFields: invoiceData.clientCustomFields || [],
        invoiceNumber: invoiceData.invoiceNumber || "",
        invoiceDate: invoiceData.issueDate || invoiceData.invoiceDate || "",
        dueDate: invoiceData.dueDate || "",
        status: invoiceData.status || "PENDING",
        items:
          invoiceData.items?.map((item) => ({
            itemName: item.itemName || "",
            description: item.description || "",
            quantity: item.quantity || 0,
            rate: item.rate || 0,
            amount: (item.quantity || 0) * (item.rate || 0),
          })) || [],
        includeDescription: invoiceData.includeDescription || false,
        taxRate: invoiceData.taxRate || 0,
        discountRate: invoiceData.discountRate || 0,
        notes: invoiceData.notes || "Thank you for your business!",
        terms: invoiceData.terms || "",
        bankName: invoiceData.bankName || "",
        bankAccount: invoiceData.bankAccount || "",
      };

      // Convert company logo URL to base64 for PDF generation
      console.log('🚀 About to prepare PDF data with logo:', pdfData.companyLogo);
      const preparedPdfData = await prepareInvoiceDataForPDF(pdfData);
      console.log('🚀 PDF data prepared, logo is now:', preparedPdfData.companyLogo?.substring(0, 50) + '...');

      // Generate and download the PDF using selected template
      const selectedTemplate = invoiceData.selectedTemplate || DEFAULT_TEMPLATE;
      const TemplateComponent = getTemplateComponent(selectedTemplate);
      const blob = await pdf(
        <TemplateComponent invoiceData={preparedPdfData} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${invoiceData.invoiceNumber || "unknown"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log("PDF downloaded successfully");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Error generating PDF. Please try again.");
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    setInvoiceToDelete(invoiceId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (invoiceToDelete) {
      try {
        await deleteInvoice(invoiceToDelete, clientId);
        setDeleteDialogOpen(false);
        setInvoiceToDelete(null);
      } catch (error) {
        console.error("Error deleting invoice:", error);
        alert("Error deleting invoice. Please try again.");
      }
    }
  };

  const handleDuplicateInvoice = async (invoiceId) => {
    try {
      await duplicateInvoice(invoiceId, clientId);
    } catch (error) {
      console.error("Error duplicating invoice:", error);
      alert("Error duplicating invoice. Please try again.");
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setInvoiceToDelete(null);
  };

  const handleStatusChange = async (invoiceId, newStatus) => {
    try {
      await updateInvoiceStatus(invoiceId, newStatus, clientId);
      console.log(`Invoice status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating invoice status:", error);
      alert("Error updating invoice status. Please try again.");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const calculateInvoiceTotal = (invoice) => {
    const invoiceData = invoice.data || {};
    if (!invoiceData.items || !Array.isArray(invoiceData.items)) return 0;

    const subtotal = invoiceData.items.reduce((total, item) => {
      return total + item.quantity * item.rate;
    }, 0);

    const taxAmount = (subtotal * (invoiceData.taxRate || 0)) / 100;
    const discountAmount = (subtotal * (invoiceData.discountRate || 0)) / 100;

    return subtotal + taxAmount - discountAmount;
  };

  const getStatusBadge = (invoice) => {
    const invoiceData = invoice.data || {};
    const status = invoiceData.status || "PENDING";

    const getStatusColor = (status) => {
      switch (status) {
        case "PAID":
          return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
        case "PENDING":
          return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
        case "CANCELLED":
          return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
        case "AVAILABLE":
          return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
        default:
          return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      }
    };

    const formatStatusText = (status) => {
      return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    };

    return (
      <Badge className={getStatusColor(status)}>
        {formatStatusText(status)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-white">Invoices</CardTitle>
          <CardDescription className="dark:text-gray-300">
            Loading invoices...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-20 bg-gray-200 dark:bg-gray-700 rounded"
              ></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (fetchError) {
    return (
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-white">Invoices</CardTitle>
          <CardDescription className="dark:text-gray-300">
            Error loading invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-500 dark:text-red-400">{fetchError}</p>
          <Button
            onClick={() => fetchInvoices(clientId, true)}
            className="mt-4"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 dark:text-white">
            <FileText className="h-5 w-5" />
            <span>Invoices</span>
          </CardTitle>
          <CardDescription className="dark:text-gray-300">
            {invoices.length === 0
              ? "No invoices created yet for this client."
              : `${invoices.length} invoice(s) for this client.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search Section */}
          {invoices.length > 0 && (
            <div className="mb-6 space-y-4">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Search Invoices
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search by invoice number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-8"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    type="date"
                    placeholder="Filter by issue date..."
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                    className="pr-8"
                  />
                  {searchDate && (
                    <button
                      onClick={() => setSearchDate("")}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Select value={searchStatus} onValueChange={setSearchStatus}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Filter by status..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  {searchStatus && (
                    <button
                      onClick={() => setSearchStatus("")}
                      className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {(searchTerm || searchDate || searchStatus) && (
                  <Button
                    variant="outline"
                    onClick={clearSearch}
                    className="flex items-center space-x-2"
                  >
                    <X className="h-4 w-4" />
                    <span>Clear All</span>
                  </Button>
                )}
              </div>
              {(searchTerm || searchDate || searchStatus) && (
                <div className="text-sm text-gray-600">
                  Showing {filteredInvoices.length} of {invoices.length}{" "}
                  invoices
                </div>
              )}
            </div>
          )}

          {/* Invoice List Area with Search Loading Overlay */}
          <div className="relative">
            {isSearchLoading && (
              <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm">Searching...</span>
                </div>
              </div>
            )}
            
            {invoices.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No invoices
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Create your first invoice for this client.
                </p>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="text-center py-8">
                <Search className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No invoices found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your search criteria.
                </p>
              </div>
            ) : (
            <div
              ref={invoicesContainerRef}
              className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
              onScroll={(e) => {
                const { scrollTop, scrollHeight, clientHeight } = e.target;
                if (
                  scrollHeight - scrollTop <= clientHeight + 50 &&
                  !isLoadingMore &&
                  clientPagination.hasMore
                ) {
                  loadMoreInvoices(clientId);
                }
              }}
            >
              {filteredInvoices.map((invoice) => {
                const invoiceData = invoice.data || {};
                return (
                  <div
                    key={invoice.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-semibold text-lg">
                            #{invoiceData.invoiceNumber || "N/A"}
                          </h4>
                          {getStatusBadge(invoice)}
                        </div>
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Issue:{" "}
                              {invoiceData.invoiceDate || invoiceData.issueDate
                                ? formatDate(
                                    invoiceData.invoiceDate ||
                                      invoiceData.issueDate
                                  )
                                : "N/A"}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Due:{" "}
                              {invoiceData.dueDate
                                ? formatDate(invoiceData.dueDate)
                                : "N/A"}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <DollarSign className="h-4 w-4" />
                            <span>
                              Total:{" "}
                              {formatCurrency(calculateInvoiceTotal(invoice))}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4" />
                            <span>Items: {invoiceData.items?.length || 0}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <LoadingButton
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadPDF(invoice)}
                          errorMessage="Failed to download PDF. Please try again."
                        >
                          <Download className="h-4 w-4" />
                        </LoadingButton>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            onEditInvoice && onEditInvoice(invoice)
                          }
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <LoadingButton
                          variant="outline"
                          size="sm"
                          onClick={() => handleDuplicateInvoice(invoice.id)}
                          errorMessage="Failed to duplicate invoice. Please try again."
                          title="Duplicate Invoice"
                        >
                          <Copy className="h-4 w-4" />
                        </LoadingButton>
                        <Select
                          value={invoiceData.status || "PENDING"}
                          onValueChange={(newStatus) =>
                            handleStatusChange(invoice.id, newStatus)
                          }
                        >
                          <SelectTrigger className="w-[120px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="PAID">Paid</SelectItem>
                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        <LoadingButton
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteInvoice(invoice.id)}
                          className="text-red-600 hover:text-red-700 cursor-pointer"
                          errorMessage="Failed to delete invoice. Please try again."
                        >
                          <Trash2 className="h-4 w-4" />
                        </LoadingButton>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Loading more indicator */}
              {isLoadingMore && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 dark:border-blue-400"></div>
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                    Loading more invoices...
                  </span>
                </div>
              )}

              {/* End of list indicator */}
              {!clientPagination.hasMore &&
                invoices.length > 0 &&
                filteredInvoices.length > 0 &&
                !isLoadingMore && (
                  <div className="text-center py-4">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      All invoices loaded successfully
                    </span>
                  </div>
                )}
            </div>
          )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this invoice? This action cannot
              be undone.
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
            <LoadingButton
              variant="destructive"
              onClick={confirmDelete}
              className="cursor-pointer hover:bg-red-700 transition-colors duration-200"
              errorMessage="Failed to delete invoice. Please try again."
            >
              Delete
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
