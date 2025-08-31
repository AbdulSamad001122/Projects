"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
  FileText,
  Download,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  Search,
  X,
} from "lucide-react";
import axios from "axios";
import { pdf } from "@react-pdf/renderer";
import InvoicePDF from "@/app/utils/invoiceTemplate";

export default function InvoiceList({ clientId, onEditInvoice }) {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [searchStatus, setSearchStatus] = useState("");

  useEffect(() => {
    if (clientId) {
      fetchInvoices();
    }
  }, [clientId]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      // You can implement this API endpoint later
      const response = await axios.get(`/api/invoices?clientId=${clientId}`);
      const invoiceData = response.data.invoices || [];
      setInvoices(invoiceData);
      setFilteredInvoices(invoiceData);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      setError("Failed to load invoices");
      // For now, set empty array if API doesn't exist
      setInvoices([]);
      setFilteredInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter invoices based on search criteria
  useEffect(() => {
    let filtered = invoices;

    // Filter by invoice number/name
    if (searchTerm) {
      filtered = filtered.filter((invoice) => {
        const invoiceData = invoice.data || {};
        const invoiceNumber = invoiceData.invoiceNumber || "";
        return invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    // Filter by issue date
    if (searchDate) {
      filtered = filtered.filter((invoice) => {
        const invoiceData = invoice.data || {};
        const issueDate = invoiceData.invoiceDate || invoiceData.issueDate;
        if (!issueDate) return false;
        const formattedIssueDate = new Date(issueDate)
          .toISOString()
          .split("T")[0];
        return formattedIssueDate === searchDate;
      });
    }

    // Filter by status
    if (searchStatus) {
      filtered = filtered.filter((invoice) => {
        const invoiceData = invoice.data || {};
        const status = invoiceData.status || "PENDING";
        return status === searchStatus;
      });
    }

    setFilteredInvoices(filtered);
  }, [invoices, searchTerm, searchDate, searchStatus]);

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
        clientName: invoiceData.clientName || "",
        clientEmail: invoiceData.clientEmail || "",
        clientPhone: invoiceData.clientPhone || "",
        invoiceNumber: invoiceData.invoiceNumber || "",
        invoiceDate: invoiceData.issueDate || invoiceData.invoiceDate || "",
        dueDate: invoiceData.dueDate || "",
        status: invoiceData.status || "PENDING",
        items:
          invoiceData.items?.map((item) => ({
            description: item.description || "",
            quantity: item.quantity || 0,
            rate: item.rate || 0,
            amount: (item.quantity || 0) * (item.rate || 0),
          })) || [],
        taxRate: invoiceData.taxRate || 0,
        discountRate: invoiceData.discountRate || 0,
        notes: invoiceData.notes || "Thank you for your business!",
        terms: invoiceData.terms || "",
        bankName: invoiceData.bankName || "",
        bankAccount: invoiceData.bankAccount || "",
      };

      // Generate and download the PDF
      const blob = await pdf(<InvoicePDF invoiceData={pdfData} />).toBlob();
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
    if (window.confirm("Are you sure you want to delete this invoice?")) {
      try {
        await axios.delete(`/api/invoices?id=${invoiceId}`);
        setInvoices(invoices.filter((invoice) => invoice.id !== invoiceId));
      } catch (error) {
        console.error("Error deleting invoice:", error);
      }
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
          return "bg-green-100 text-green-800";
        case "PENDING":
          return "bg-yellow-100 text-yellow-800";
        case "CANCELLED":
          return "bg-red-100 text-red-800";
        default:
          return "bg-yellow-100 text-yellow-800";
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>Loading invoices...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>Error loading invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
          <Button onClick={fetchInvoices} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Invoices</span>
        </CardTitle>
        <CardDescription>
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
              <Search className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">
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
                Showing {filteredInvoices.length} of {invoices.length} invoices
              </div>
            )}
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
          <div className="space-y-4">
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadPDF(invoice)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditInvoice && onEditInvoice(invoice)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteInvoice(invoice.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
