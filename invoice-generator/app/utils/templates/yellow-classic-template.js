import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

// Create styles for Yellow Classic Template
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#F5D547", // Yellow background
    padding: 20,
    fontFamily: "Helvetica",
    fontSize: 10,
  },
  // Header section
  headerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 30,
    paddingBottom: 20,
  },
  logoSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  companyLogo: {
    width: 50,
    height: 50,
    borderRadius: 25, // Make logo circular
  },
  companyName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
  },
  invoiceTitleSection: {
    alignItems: "center",
  },
  invoiceTitle: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#000000",
    letterSpacing: 3,
    marginBottom: 5,
  },
  invoiceDetails: {
    alignItems: "flex-end",
  },
  invoiceNumber: {
    fontSize: 12,
    color: "#000000",
    fontWeight: "bold",
    marginBottom: 5,
  },
  invoiceDate: {
    fontSize: 10,
    color: "#000000",
    marginBottom: 2,
  },
  dueDate: {
    fontSize: 10,
    color: "#000000",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    fontSize: 10,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    minWidth: 60,
    marginTop: 5,
    borderRadius: 12, // More rounded corners
  },
  statusPaid: {
    backgroundColor: "#10B981",
  },
  statusPending: {
    backgroundColor: "#F59E0B",
  },
  statusCancelled: {
    backgroundColor: "#EF4444",
  },
  // Bill To and From Section
  contentSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  billToSection: {
    width: "45%",
  },
  fromSection: {
    width: "45%",
    alignItems: "flex-end",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 8,
  },
  text: {
    fontSize: 10,
    color: "#000000",
    marginBottom: 2,
  },
  // Payment Method Section
  paymentMethodSection: {
    marginBottom: 20,
  },
  paymentMethodTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 5,
  },
  paymentMethodText: {
    fontSize: 10,
    color: "#000000",
  },
  // Table styles
  table: {
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#000000",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#000000",
    paddingVertical: 8,
    paddingHorizontal: 10,
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
    borderBottomColor: "#000000",
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#F5D547",
  },
  tableCell: {
    fontSize: 9,
    color: "#000000",
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
    marginBottom: 20,
  },
  totalsSection: {
    width: 200,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  totalLabel: {
    fontSize: 10,
    color: "#000000",
  },
  totalValue: {
    fontSize: 10,
    color: "#000000",
    fontWeight: "bold",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#000000",
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 5,
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
  // Footer section
  footerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 20,
  },
  paymentSection: {
    width: "48%",
    alignItems: "flex-end",
    textAlign: "right",
  },
  paymentTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 8,
  },
  paymentText: {
    fontSize: 10,
    color: "#000000",
    marginBottom: 3,
  },
  // Notes and Terms sections
  notesSection: {
    width: "48%",
    marginBottom: 15,
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 5,
  },
  notesText: {
    fontSize: 10,
    color: "#000000",
    lineHeight: 1.4,
  },
  termsSection: {
    marginBottom: 15,
  },
  termsTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 5,
  },
  termsText: {
    fontSize: 10,
    color: "#000000",
    lineHeight: 1.4,
  },
});

// Yellow Classic Invoice Template Component
const YellowClassicTemplate = ({ invoiceData }) => {
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
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.logoSection}>
            {companyLogo && (
              <Image
                src={companyLogo}
                style={styles.companyLogo}
                alt="Company Logo"
              />
            )}
            <Text style={styles.companyName}>
              {companyName || "Devesh Sharma"}
            </Text>
          </View>

          <View style={styles.invoiceTitleSection}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
          </View>

          <View style={styles.invoiceDetails}>
            <Text style={styles.invoiceNumber}>
              Invoice No.: {invoiceNumber || "#405"}
            </Text>
            <Text style={styles.invoiceDate}>
              Date: {invoiceDate || "16th July 2025"}
            </Text>
            <Text style={styles.dueDate}>Due: {dueDate || "5th Aug 2025"}</Text>
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

        {/* Bill To and From Section */}
        <View style={styles.contentSection}>
          <View style={styles.billToSection}>
            <Text style={styles.sectionTitle}>Bill to:</Text>
            <Text style={styles.text}>{clientName || "Client Name"}</Text>
            <Text style={styles.text}>{clientEmail || "client@email.com"}</Text>
            {clientCustomFields.slice(0, 8).map(
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
            <Text style={styles.text}>{companyName || "Devesh Sharma"}</Text>
            <Text style={styles.text}>
              {companyEmail || "devesh2023@gmail.com"}
            </Text>
            {companyCustomFields.slice(0, 6).map(
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
              Total
            </Text>
          </View>

          {/* Table Rows */}
          {items && items.length > 0 ? (
            items.map((item, index) => (
              <View style={styles.tableRow} key={index}>
                <Text
                  style={[
                    styles.tableCell,
                    invoiceData.includeDescription
                      ? styles.itemNameCell
                      : styles.itemNameCellWide,
                  ]}
                >
                  {item.itemName || "1 Logo Design"}
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
                  ${(item.rate || 0).toFixed(2)}
                </Text>
                <Text
                  style={[
                    styles.tableCell,
                    invoiceData.includeDescription
                      ? styles.totalCell
                      : styles.totalCellWide,
                  ]}
                >
                  ${(item.amount || 0).toFixed(2)}
                </Text>
              </View>
            ))
          ) : (
            // Default row if no items
            <View style={styles.tableRow}>
              <Text
                style={[
                  styles.tableCell,
                  invoiceData.includeDescription
                    ? styles.itemNameCell
                    : styles.itemNameCellWide,
                ]}
              >
                1 Logo Design
              </Text>
              {invoiceData.includeDescription && (
                <Text style={[styles.tableCell, styles.descriptionCell]}>
                  Professional logo design
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
                1
              </Text>
              <Text
                style={[
                  styles.tableCell,
                  invoiceData.includeDescription
                    ? styles.priceCell
                    : styles.priceCellWide,
                ]}
              >
                $1,200
              </Text>
              <Text
                style={[
                  styles.tableCell,
                  invoiceData.includeDescription
                    ? styles.totalCell
                    : styles.totalCellWide,
                ]}
              >
                $1,200
              </Text>
            </View>
          )}
        </View>

        {/* Totals Section */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Discount ({discountRate || 0}%):
              </Text>
              <Text style={styles.totalValue}>
                {discountRate > 0 ? `-$${discountAmount.toFixed(2)}` : "$0.00"}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax ({taxRate || 0}%):</Text>
              <Text style={styles.totalValue}>
                {taxRate > 0 ? `$${taxAmount.toFixed(2)}` : "$0.00"}
              </Text>
            </View>
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>${total.toFixed(2)}</Text>
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

        {/* Terms Section */}
        {terms && (
          <View style={styles.termsSection}>
            <Text style={styles.termsTitle}>Terms and Conditions:</Text>
            <Text style={styles.termsText}>{terms}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
};

export default YellowClassicTemplate;
