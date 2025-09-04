import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

// Create styles for Green Classic Template (based on the provided image)
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 30,
    fontFamily: "Helvetica",
    fontSize: 10,
  },
  // Green header background
  headerBackground: {
    backgroundColor: "#9ACD32",
    height: 80,
    marginBottom: 20,
    position: "relative",
  },
  headerContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerLeft: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  companyName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  companyEmail: {
    fontSize: 10,
    color: "#FFFFFF",
  },
  headerCenter: {
    flexDirection: "column",
    alignItems: "center",
  },
  invoiceTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  headerRight: {
    flexDirection: "column",
    alignItems: "flex-end",
  },
  invoiceNumberLabel: {
    fontSize: 10,
    color: "#FFFFFF",
    marginBottom: 2,
  },
  invoiceNumberValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 5,
  },
  dateLabel: {
    fontSize: 10,
    color: "#FFFFFF",
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 10,
    color: "#FFFFFF",
  },

  // Company logo styles
  companyLogo: {
    width: 40,
    height: 40,
    borderRadius: 20, // Make logo circular
    marginBottom: 5,
  },

  // Status badge styles
  statusBadge: {
    fontSize: 10,
    fontWeight: "bold",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12, // More rounded corners
    marginTop: 5,
    textAlign: "center",
  },
  statusPaid: {
    backgroundColor: "#10B981",
    color: "#FFFFFF",
  },
  statusPending: {
    backgroundColor: "#F59E0B",
    color: "#FFFFFF",
  },
  statusCancelled: {
    backgroundColor: "#EF4444",
    color: "#FFFFFF",
  },

  // Content sections for Bill To and From
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
  sectionText: {
    fontSize: 10,
    color: "#000000",
    marginBottom: 2,
  },

  // Date section
  dateSection: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 20,
    gap: 60,
  },
  dateItem: {
    flexDirection: "column",
  },
  dateItemLabel: {
    fontSize: 10,
    color: "#666666",
    marginBottom: 3,
  },
  dateItemValue: {
    fontSize: 11,
    color: "#9ACD32",
    fontWeight: "bold",
  },

  // Table styles
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#9ACD32",
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  tableHeaderCell: {
    color: "#000000",
    fontSize: 11,
    fontWeight: "bold",
    textAlign: "center",
  },

  itemNameHeader: {
    width: "45%",
    textAlign: "left",
  },
  itemNameHeaderWide: {
    width: "55%",
    textAlign: "left",
  },
  descriptionHeader: {
    width: "45%",
    textAlign: "left",
  },
  descriptionHeaderWide: {
    width: "55%",
    textAlign: "left",
  },
  priceHeader: {
    width: "18%",
    textAlign: "center",
  },
  priceHeaderWide: {
    width: "22%",
    textAlign: "center",
  },
  qtyHeader: {
    width: "12%",
    textAlign: "center",
  },
  qtyHeaderWide: {
    width: "18%",
    textAlign: "center",
  },
  totalHeader: {
    width: "15%",
    textAlign: "right",
  },
  totalHeaderWide: {
    width: "25%",
    textAlign: "right",
  },

  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: "#FFFFFF",
  },
  tableRowAlt: {
    backgroundColor: "#F9FAFB",
  },
  tableCell: {
    fontSize: 10,
    color: "#000000",
    textAlign: "center",
  },

  itemNameCell: {
    width: "45%",
    textAlign: "left",
  },
  itemNameCellWide: {
    width: "55%",
    textAlign: "left",
  },
  descriptionCell: {
    width: "45%",
    textAlign: "left",
  },
  descriptionCellWide: {
    width: "55%",
    textAlign: "left",
  },
  priceCell: {
    width: "18%",
    textAlign: "center",
  },
  priceCellWide: {
    width: "22%",
    textAlign: "center",
  },
  qtyCell: {
    width: "12%",
    textAlign: "center",
  },
  qtyCellWide: {
    width: "18%",
    textAlign: "center",
  },
  totalCell: {
    width: "15%",
    textAlign: "right",
  },
  totalCellWide: {
    width: "25%",
    textAlign: "right",
  },

  // Item name and description styles
  itemNameText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 2,
  },
  itemDescriptionText: {
    fontSize: 9,
    color: "#666666",
    fontStyle: "italic",
  },

  // Totals section
  totalsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 15,
  },
  totalsSection: {
    width: 250,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    paddingHorizontal: 15,
  },
  totalLabel: {
    fontSize: 11,
    color: "#000000",
  },
  totalValue: {
    fontSize: 11,
    color: "#000000",
    fontWeight: "bold",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#9ACD32",
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginTop: 5,
  },
  grandTotalLabel: {
    fontSize: 12,
    color: "#000000",
    fontWeight: "bold",
  },
  grandTotalValue: {
    fontSize: 12,
    color: "#000000",
    fontWeight: "bold",
  },

  // Footer sections
  footerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 40,
  },
  termsSection: {
    width: "48%",
  },
  paymentSection: {
    width: "48%",
    alignItems: "flex-end",
  },
  footerTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 8,
  },
  footerText: {
    fontSize: 10,
    color: "#000000",
    lineHeight: 1.4,
    marginBottom: 3,
  },
  footerTitleSpaced: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 8,
    marginTop: 15,
  },
  thankYouText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000000",
    textAlign: "center",
    marginTop: 85,
    marginBottom: 20,
  },

  // Bottom contact section
});

// Green Classic Template Component
const GreenClassicTemplate = ({ invoiceData }) => {
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
    status,
    items,
    taxRate,
    discountRate,
    notes,
    terms,
    bankName,
    bankAccount,
    showStatusOnPDF = false,
    includeDescription = false,
  } = invoiceData;

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const taxAmount = (subtotal * (taxRate || 0)) / 100;
  const discountAmount = (subtotal * (discountRate || 0)) / 100;
  const total = subtotal + taxAmount - discountAmount;

  // Format currency
  const formatCurrency = (amount) => {
    return `$${(amount || 0).toFixed(2)}`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Green Header Background */}
        <View style={styles.headerBackground}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              {companyLogo && (
                <Image
                  src={companyLogo}
                  style={styles.companyLogo}
                  alt="Company Logo"
                />
              )}
              <Text style={styles.companyName}>{companyName || "Adzilla"}</Text>
            </View>
            <View style={styles.headerCenter}>
              <Text style={styles.invoiceTitle}>INVOICE</Text>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.invoiceNumberLabel}>NO:</Text>
              <Text style={styles.invoiceNumberValue}>
                {invoiceNumber || "INV-39"}
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
            <Text style={styles.sectionText}>
              {clientName || "M. Haris Junianto"}
            </Text>
            <Text style={styles.sectionText}>
              {clientEmail || "client@example.com"}
            </Text>
            {clientCustomFields.slice(0, 10).map(
              (field, index) =>
                field.name &&
                field.value && (
                  <Text key={index} style={styles.sectionText}>
                    {field.name.substring(0, 50)}:{" "}
                    {field.value.substring(0, 100)}
                  </Text>
                )
            )}
          </View>
          <View style={styles.fromSection}>
            <Text style={styles.sectionTitle}>From:</Text>
            <Text style={styles.sectionText}>
              {companyName || "YOUR COMPANY"}
            </Text>
            <Text style={styles.sectionText}>
              {companyEmail || "company@example.com"}
            </Text>
            {companyCustomFields.slice(0, 10).map(
              (field, index) =>
                field.name &&
                field.value && (
                  <Text key={index} style={styles.sectionText}>
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
            <Text style={styles.dateItemLabel}>Issue Date:</Text>
            <Text style={styles.dateItemValue}>
              {invoiceDate || "2025-09-04"}
            </Text>
          </View>
          <View style={styles.dateItem}>
            <Text style={styles.dateItemLabel}>Due Date:</Text>
            <Text style={styles.dateItemValue}>{dueDate || "2025-09-06"}</Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text
              style={[
                styles.tableHeaderCell,
                includeDescription
                  ? styles.itemNameHeader
                  : styles.itemNameHeaderWide,
              ]}
            >
              Item Name
            </Text>
            {includeDescription && (
              <Text style={[styles.tableHeaderCell, styles.descriptionHeader]}>
                Description
              </Text>
            )}
            <Text
              style={[
                styles.tableHeaderCell,
                includeDescription ? styles.qtyHeader : styles.qtyHeaderWide,
              ]}
            >
              Quantity
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                includeDescription
                  ? styles.priceHeader
                  : styles.priceHeaderWide,
              ]}
            >
              Price
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                includeDescription
                  ? styles.totalHeader
                  : styles.totalHeaderWide,
              ]}
            >
              Subtotal
            </Text>
          </View>

          {/* Table Rows */}
          {items.map((item, index) => (
            <View
              key={index}
              style={[
                styles.tableRow,
                index % 2 === 1 ? styles.tableRowAlt : {},
              ]}
            >
              <Text
                style={[
                  styles.tableCell,
                  includeDescription
                    ? styles.itemNameCell
                    : styles.itemNameCellWide,
                ]}
              >
                {item.itemName || "Item Name"}
              </Text>
              {includeDescription && (
                <Text style={[styles.tableCell, styles.descriptionCell]}>
                  {item.description || ""}
                </Text>
              )}
              <Text
                style={[
                  styles.tableCell,
                  includeDescription ? styles.qtyCell : styles.qtyCellWide,
                ]}
              >
                {item.quantity || 1}
              </Text>
              <Text
                style={[
                  styles.tableCell,
                  includeDescription ? styles.priceCell : styles.priceCellWide,
                ]}
              >
                {formatCurrency(item.rate)}
              </Text>
              <Text
                style={[
                  styles.tableCell,
                  includeDescription ? styles.totalCell : styles.totalCellWide,
                ]}
              >
                {formatCurrency(item.amount)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals Section */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
            </View>
            {taxRate > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Taxes ({taxRate}%)</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(taxAmount)}
                </Text>
              </View>
            )}
            {discountRate > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  Discount ({discountRate}%)
                </Text>
                <Text style={styles.totalValue}>
                  -{formatCurrency(discountAmount)}
                </Text>
              </View>
            )}
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>TOTAL</Text>
              <Text style={styles.grandTotalValue}>
                {formatCurrency(total)}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer Section */}
        {(terms || notes || bankName || bankAccount) && (
          <View style={styles.footerSection}>
            {(terms || notes) && (
              <View style={styles.termsSection}>
                {terms && (
                  <>
                    <Text style={styles.footerTitle}>Term & Condition</Text>
                    <Text style={styles.footerText}>{terms}</Text>
                  </>
                )}
                {notes && (
                  <>
                    <Text
                      style={[
                        styles.footerTitle,
                        terms ? styles.footerTitleSpaced : {},
                      ]}
                    >
                      Notes
                    </Text>
                    <Text style={styles.footerText}>{notes}</Text>
                  </>
                )}
              </View>
            )}
            {(bankName || bankAccount) && (
              <View style={styles.paymentSection}>
                <Text style={styles.footerTitle}>Payment Method :</Text>
                {bankAccount && (
                  <Text style={styles.footerText}>
                    Account# : {bankAccount}
                  </Text>
                )}
                {bankName && (
                  <Text style={styles.footerText}>A/C Name : {bankName}</Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* Thank You Message */}
        <Text style={styles.thankYouText}>Thank You</Text>
      </Page>
    </Document>
  );
};

export default GreenClassicTemplate;
