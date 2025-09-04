import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

// Create styles for Green Modern Template
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 20,
    fontFamily: "Helvetica",
    fontSize: 10,
  },
  // Green header section
  headerSection: {
    backgroundColor: "#10B981",
    padding: 20,
    marginBottom: 20,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  companySection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  companyLogo: {
    width: 50,
    height: 50,
    borderRadius: 25, // Make logo circular
  },
  companyInfo: {
    flexDirection: "column",
  },
  companyName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  companyEmail: {
    fontSize: 10,
    color: "#FFFFFF",
  },
  invoiceTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  invoiceDetails: {
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 5,
  },
  invoiceNumber: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  invoiceDate: {
    fontSize: 10,
    color: "#FFFFFF",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    fontSize: 9,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    minWidth: 50,
    borderRadius: 12, // More rounded corners
  },
  statusPaid: {
    backgroundColor: "#059669",
  },
  statusPending: {
    backgroundColor: "#D97706",
  },
  statusCancelled: {
    backgroundColor: "#DC2626",
  },
  // Main content sections
  contentSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  billToSection: {
    width: "45%",
    padding: 15,
    backgroundColor: "#F0FDF4",
    borderLeft: "4px solid #10B981",
  },
  fromSection: {
    width: "45%",
    padding: 15,
    backgroundColor: "#F0FDF4",
    borderLeft: "4px solid #10B981",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#10B981",
    marginBottom: 8,
  },
  text: {
    fontSize: 10,
    color: "#374151",
    marginBottom: 2,
  },
  dateSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    padding: 10,
    backgroundColor: "#F9FAFB",
  },
  dateItem: {
    flexDirection: "column",
    alignItems: "center",
  },
  dateLabel: {
    fontSize: 10,
    color: "#6B7280",
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 12,
    color: "#10B981",
    fontWeight: "bold",
  },
  // Table styles
  table: {
    marginBottom: 20,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#10B981",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tableHeaderCell: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
  },
  itemNameHeader: {
    width: "25%",
    textAlign: "left",
  },
  itemNameHeaderWide: {
    width: "50%",
    textAlign: "left",
  },
  descriptionHeader: {
    width: "25%",
    textAlign: "left",
  },
  qtyHeader: {
    width: "15%",
  },
  qtyHeaderWide: {
    width: "16.67%",
  },
  priceHeader: {
    width: "17.5%",
  },
  priceHeaderWide: {
    width: "16.67%",
  },
  totalHeader: {
    width: "17.5%",
    textAlign: "right",
  },
  totalHeaderWide: {
    width: "16.66%",
    textAlign: "right",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
  },
  tableRowAlt: {
    backgroundColor: "#F9FAFB",
  },
  tableCell: {
    fontSize: 9,
    color: "#374151",
    textAlign: "center",
  },
  itemNameCell: {
    width: "25%",
    textAlign: "left",
  },
  itemNameCellWide: {
    width: "50%",
    textAlign: "left",
  },
  descriptionCell: {
    width: "25%",
    textAlign: "left",
  },
  qtyCell: {
    width: "15%",
  },
  qtyCellWide: {
    width: "16.67%",
  },
  priceCell: {
    width: "17.5%",
  },
  priceCellWide: {
    width: "16.67%",
  },
  totalCell: {
    width: "17.5%",
    textAlign: "right",
  },
  totalCellWide: {
    width: "16.66%",
    textAlign: "right",
  },
  // Totals section
  totalsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  totalsSection: {
    width: 220,
    backgroundColor: "#F9FAFB",
    padding: 15,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  totalLabel: {
    fontSize: 10,
    color: "#6B7280",
  },
  totalValue: {
    fontSize: 10,
    color: "#374151",
    fontWeight: "bold",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#10B981",
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  grandTotalLabel: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  grandTotalValue: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  // Footer sections
  footerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
    marginBottom: 20,
  },
  notesSection: {
    width: "48%",
    padding: 15,
    backgroundColor: "#F0FDF4",
    borderLeft: "4px solid #10B981",
  },
  paymentSection: {
    width: "48%",
    padding: 15,
    backgroundColor: "#F0FDF4",
    borderLeft: "4px solid #10B981",
    alignItems: "flex-end",
    textAlign: "right",
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#10B981",
    marginBottom: 8,
  },
  notesText: {
    fontSize: 10,
    color: "#374151",
    lineHeight: 1.4,
    textAlign: "justify",
  },
  paymentTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#10B981",
    marginBottom: 8,
  },
  paymentText: {
    fontSize: 10,
    color: "#374151",
    marginBottom: 3,
    lineHeight: 1.3,
  },
  termsSection: {
    marginTop: 20,
    marginBottom: 25,
    padding: 15,
    backgroundColor: "#F0FDF4",
  },
  termsTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#10B981",
    marginBottom: 8,
  },
  termsText: {
    fontSize: 10,
    color: "#374151",
    lineHeight: 1.4,
    textAlign: "justify",
  },
  thankYouSection: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    paddingVertical: 15,
  },
  thankYouText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#10B981",
    textAlign: "center",
  },
});

// Green Modern Template Component
const GreenModernTemplate = ({ invoiceData }) => {
  const {
    companyName,
    companyEmail,
    companyLogo,
    companyCustomFields = [],
    clientName,
    clientEmail,
    clientCustomFields = [],
    invoiceNumber,
    invoiceDate,
    dueDate,
    items,
    taxRate,
    discountRate,
    notes,
    terms,
    showStatusOnPDF = false,
  } = invoiceData;

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const taxAmount = (subtotal * (taxRate || 0)) / 100;
  const discountAmount = (subtotal * (discountRate || 0)) / 100;
  const total = subtotal + taxAmount - discountAmount;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Green Header */}
        <View style={styles.headerSection}>
          <View style={styles.headerContent}>
            <View style={styles.companySection}>
              {companyLogo && (
                <Image
                  src={companyLogo}
                  style={styles.companyLogo}
                  alt="Company Logo"
                />
              )}
              <View style={styles.companyInfo}>
                <Text style={styles.companyName}>
                  {companyName || "Company Name"}
                </Text>
                <Text style={styles.companyEmail}>
                  {companyEmail || "company@example.com"}
                </Text>
              </View>
            </View>

            <Text style={styles.invoiceTitle}>INVOICE</Text>

            <View style={styles.invoiceDetails}>
              <Text style={styles.invoiceNumber}>
                NO: {invoiceNumber || "INV-12345-1"}
              </Text>
              <Text style={styles.invoiceDate}>
                Date: {invoiceDate || "26 June 2022"}
              </Text>
              <Text style={styles.invoiceDate}>
                Due: {dueDate || "26 July 2022"}
              </Text>
              {showStatusOnPDF && (
                <Text
                  style={[
                    styles.statusBadge,
                    invoiceData.status === "PAID"
                      ? styles.statusPaid
                      : invoiceData.status === "CANCELLED"
                      ? styles.statusCancelled
                      : styles.statusPending,
                  ]}
                >
                  {invoiceData.status || "PENDING"}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Bill To and From Section */}
        <View style={styles.contentSection}>
          <View style={styles.billToSection}>
            <Text style={styles.sectionTitle}>Bill To:</Text>
            <Text style={styles.text}>{clientName || "Client Name"}</Text>
            <Text style={styles.text}>
              {clientEmail || "client@example.com"}
            </Text>
            {clientCustomFields.slice(0, 10).map(
              (field, index) =>
                field.name &&
                field.value && (
                  <Text key={index} style={styles.text}>
                    {field.name.substring(0, 50)}:{" "}
                    {field.value.substring(0, 100)}
                  </Text>
                )
            )}
          </View>
          <View style={styles.fromSection}>
            <Text style={styles.sectionTitle}>From:</Text>
            <Text style={styles.text}>{companyName || "Company Name"}</Text>
            <Text style={styles.text}>
              {companyEmail || "company@example.com"}
            </Text>
            {companyCustomFields.slice(0, 10).map(
              (field, index) =>
                field.name &&
                field.value && (
                  <Text key={index} style={styles.text}>
                    {field.name.substring(0, 50)}:{" "}
                    {field.value.substring(0, 100)}
                  </Text>
                )
            )}
          </View>
        </View>

        {/* Date Section */}
        <View style={styles.dateSection}>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Issue Date</Text>
            <Text style={styles.dateValue}>
              {invoiceDate || "26 June 2022"}
            </Text>
          </View>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Due Date</Text>
            <Text style={styles.dateValue}>{dueDate || "26 July 2022"}</Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text
              style={[
                styles.tableHeaderCell,
                invoiceData.includeDescription
                  ? styles.itemNameHeader
                  : styles.itemNameHeaderWide,
              ]}
            >
              Item Name
            </Text>
            {invoiceData.includeDescription && (
              <Text style={[styles.tableHeaderCell, styles.descriptionHeader]}>
                Description
              </Text>
            )}
            <Text
              style={[
                styles.tableHeaderCell,
                invoiceData.includeDescription
                  ? styles.qtyHeader
                  : styles.qtyHeaderWide,
              ]}
            >
              Quantity
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                invoiceData.includeDescription
                  ? styles.priceHeader
                  : styles.priceHeaderWide,
              ]}
            >
              Price
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                invoiceData.includeDescription
                  ? styles.totalHeader
                  : styles.totalHeaderWide,
              ]}
            >
              Subtotal
            </Text>
          </View>

          {/* Table Rows */}
          {items && items.length > 0
            ? items.map((item, index) => (
                <View
                  style={[
                    styles.tableRow,
                    index % 2 === 1 ? styles.tableRowAlt : null,
                  ]}
                  key={index}
                >
                  <Text
                    style={[
                      styles.tableCell,
                      invoiceData.includeDescription
                        ? styles.itemNameCell
                        : styles.itemNameCellWide,
                    ]}
                  >
                    {item.itemName || "Your Item Name"}
                  </Text>
                  {invoiceData.includeDescription && (
                    <Text style={[styles.tableCell, styles.descriptionCell]}>
                      {item.description || ""}
                    </Text>
                  )}
                  <Text
                    style={[
                      styles.tableCell,
                      invoiceData.includeDescription
                        ? styles.qtyCell
                        : styles.qtyCellWide,
                    ]}
                  >
                    {item.quantity || 1}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      invoiceData.includeDescription
                        ? styles.priceCell
                        : styles.priceCellWide,
                    ]}
                  >
                    $ {(item.rate || 0).toFixed(2)}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      invoiceData.includeDescription
                        ? styles.totalCell
                        : styles.totalCellWide,
                    ]}
                  >
                    $ {((item.quantity || 0) * (item.rate || 0)).toFixed(2)}
                  </Text>
                </View>
              ))
            : null}
        </View>

        {/* Totals Section */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>$ {subtotal.toFixed(2)}</Text>
            </View>
            {discountRate > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  Discount ({discountRate}%):
                </Text>
                <Text style={styles.totalValue}>
                  - $ {discountAmount.toFixed(2)}
                </Text>
              </View>
            )}
            {taxRate > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tax ({taxRate}%):</Text>
                <Text style={styles.totalValue}>$ {taxAmount.toFixed(2)}</Text>
              </View>
            )}
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Total:</Text>
              <Text style={styles.grandTotalValue}>$ {total.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Footer Section */}
        <View style={styles.footerSection}>
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Notes:</Text>
            <Text style={styles.notesText}>
              {notes ||
                "Thank you for your business! We appreciate your trust in our services and look forward to working with you again."}
            </Text>
          </View>
          {(invoiceData.bankName || invoiceData.bankAccount) && (
            <View style={styles.paymentSection}>
              <Text style={styles.paymentTitle}>Payment Information:</Text>
              {invoiceData.bankName && (
                <Text style={styles.paymentText}>
                  Bank: {invoiceData.bankName}
                </Text>
              )}
              {invoiceData.bankAccount && (
                <Text style={styles.paymentText}>
                  Account: {invoiceData.bankAccount}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Terms and Conditions Section */}
        {terms && (
          <View style={styles.termsSection}>
            <Text style={styles.termsTitle}>Terms and Conditions:</Text>
            <Text style={styles.termsText}>{terms}</Text>
          </View>
        )}

        {/* Thank You Section */}
        <View style={styles.thankYouSection}>
          <Text style={styles.thankYouText}>Thank You!</Text>
        </View>
      </Page>
    </Document>
  );
};

export default GreenModernTemplate;
