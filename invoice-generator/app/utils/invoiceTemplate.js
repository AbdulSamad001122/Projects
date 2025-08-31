import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 20,
    fontFamily: "Helvetica",
    fontSize: 10,
  },
  // Blue curved header
  headerBackground: {
    backgroundColor: "#1E40AF",
    height: 120,
    marginBottom: 20,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
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
    paddingHorizontal: 30,
    paddingVertical: 20,
  },
  headerCenter: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  companyLogo: {
    width: 60,
    height: 60,
    objectFit: "contain",
  },

  invoiceTitle: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 2,
  },
  invoiceNumber: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  statusContainer: {
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 5,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 10,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    minWidth: 60,
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
  // Main content sections
  contentSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
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
    color: "#374151",
    marginBottom: 8,
  },
  text: {
    fontSize: 10,
    color: "#6B7280",
    marginBottom: 2,
  },
  dateSection: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 15,
    gap: 30,
  },
  dateItem: {
    flexDirection: "column",
  },
  dateLabel: {
    fontSize: 10,
    color: "#6B7280",
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 10,
    color: "#374151",
    fontWeight: "bold",
  },
  // Table styles
  table: {
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1E40AF",
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableHeaderCell: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
  },
  descriptionHeader: {
    width: "40%",
    textAlign: "left",
  },
  qtyHeader: {
    width: "15%",
  },
  priceHeader: {
    width: "20%",
  },
  totalHeader: {
    width: "25%",
    textAlign: "right",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  tableCell: {
    fontSize: 9,
    color: "#374151",
    textAlign: "center",
  },
  descriptionCell: {
    width: "40%",
    textAlign: "left",
  },
  qtyCell: {
    width: "15%",
  },
  priceCell: {
    width: "20%",
  },
  totalCell: {
    width: "25%",
    textAlign: "right",
  },
  // Totals section
  totalsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
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
    backgroundColor: "#1E40AF",
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
  // Footer sections
  footerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  notesSection: {
    width: "45%",
  },
  paymentSection: {
    width: "45%",
  },
  thankYouSection: {
    width: "45%",
    alignItems: "center",
    justifyContent: "center",
  },
  notesTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 5,
  },
  notesText: {
    fontSize: 9,
    color: "#6B7280",
    lineHeight: 1.3,
  },
  paymentTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 5,
  },
  paymentText: {
    fontSize: 9,
    color: "#6B7280",
    marginBottom: 2,
  },
  thankYouText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#374151",
  },
});

// Invoice PDF Document Component
const InvoicePDF = ({ invoiceData }) => {
  const {
    companyName,
    companyEmail,
    companyLogo,
    clientName,
    clientPhone,
    clientEmail,
    invoiceNumber,
    invoiceDate,
    dueDate,
    items,
    taxRate,
    discountRate,
    notes,
  } = invoiceData;

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const taxAmount = (subtotal * (taxRate || 0)) / 100;
  const discountAmount = (subtotal * (discountRate || 0)) / 100;
  const total = subtotal + taxAmount - discountAmount;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Blue Curved Header */}
        <View style={styles.headerBackground}>
          <View style={styles.headerContent}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <View style={styles.statusContainer}>
              <Text style={styles.invoiceNumber}>
                NO: {invoiceNumber || "INV-12345-1"}
              </Text>
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
            </View>
          </View>
          {companyLogo && (
            <View style={styles.headerCenter}>
              <Image src={companyLogo} style={styles.companyLogo} />
            </View>
          )}
        </View>

        {/* Bill To and From Section */}
        <View style={styles.contentSection}>
          <View style={styles.billToSection}>
            <Text style={styles.sectionTitle}>Bill To:</Text>
            <Text style={styles.text}>{clientName || "Estelle Darcy"}</Text>
            <Text style={styles.text}>{clientPhone || "+123-456-7890"}</Text>
            <Text style={styles.text}>
              {clientEmail || "client@example.com"}
            </Text>
          </View>
          <View style={styles.fromSection}>
            <Text style={styles.sectionTitle}>From:</Text>
            <Text style={styles.text}>{companyName || "Samira Hadid"}</Text>
            <Text style={styles.text}>
              {companyEmail || "company@example.com"}
            </Text>
          </View>
        </View>

        {/* Date Section */}
        <View style={styles.dateSection}>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Date:</Text>
            <Text style={styles.dateValue}>
              {invoiceDate || "26 June 2022"}
            </Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.descriptionHeader]}>
              Description
            </Text>
            <Text style={[styles.tableHeaderCell, styles.qtyHeader]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.priceHeader]}>
              Price
            </Text>
            <Text style={[styles.tableHeaderCell, styles.totalHeader]}>
              Total
            </Text>
          </View>

          {/* Table Rows */}
          {items && items.length > 0
            ? items.map((item, index) => (
                <View style={styles.tableRow} key={index}>
                  <Text style={[styles.tableCell, styles.descriptionCell]}>
                    {item.description || "Your Description"}
                  </Text>
                  <Text style={[styles.tableCell, styles.qtyCell]}>
                    {item.quantity || 1}
                  </Text>
                  <Text style={[styles.tableCell, styles.priceCell]}>
                    $ {(item.rate || 0).toFixed(2)}
                  </Text>
                  <Text style={[styles.tableCell, styles.totalCell]}>
                    $ {(item.amount || 0).toFixed(2)}
                  </Text>
                </View>
              ))
            : // Default rows if no items
              Array.from({ length: 6 }, (_, index) => (
                <View style={styles.tableRow} key={index}>
                  <Text style={[styles.tableCell, styles.descriptionCell]}>
                    Your Description
                  </Text>
                  <Text style={[styles.tableCell, styles.qtyCell]}>1</Text>
                  <Text style={[styles.tableCell, styles.priceCell]}>
                    $ 0.00
                  </Text>
                  <Text style={[styles.tableCell, styles.totalCell]}>
                    $ 0.00
                  </Text>
                </View>
              ))}
        </View>

        {/* Totals Section */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Sub Total</Text>
              <Text style={styles.totalValue}>$ {subtotal.toFixed(2)}</Text>
            </View>
            {taxRate > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tax ({taxRate}%)</Text>
                <Text style={styles.totalValue}>$ {taxAmount.toFixed(2)}</Text>
              </View>
            )}
            {discountRate > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  Discount ({discountRate}%)
                </Text>
                <Text style={styles.totalValue}>
                  -$ {discountAmount.toFixed(2)}
                </Text>
              </View>
            )}
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>$ {total.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Footer Section */}
        <View style={styles.footerSection}>
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Note:</Text>
            <Text style={styles.notesText}>
              {notes || "Thank you for your business!"}
            </Text>
          </View>
          <View style={styles.paymentSection}>
            <Text style={styles.paymentTitle}>Payment Information:</Text>
            <Text style={styles.paymentText}>
              Bank: {invoiceData.bankName || "Name Bank"}
            </Text>
            <Text style={styles.paymentText}>
              Account: {invoiceData.bankAccount || "123-456-7890"}
            </Text>
          </View>
          <View style={styles.thankYouSection}>
            <Text style={styles.thankYouText}>Thank You!</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF;
