// Invoice Re-numbering Utility
// Handles automatic re-numbering of invoices when deletions occur

import prisma from '@/lib/prisma';

/**
 * Re-numbers invoices for a specific client in sequential order
 * @param {string} clientId - The client ID whose invoices need re-numbering
 * @param {string} userId - The user ID for security validation
 * @returns {Promise<void>}
 */
export async function renumberClientInvoices(clientId, userId) {
  try {
    // Get all invoices for the client, ordered by creation date
    const invoices = await prisma.invoice.findMany({
      where: {
        clientId: clientId,
        userId: userId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Update each invoice with sequential numbering
    const updatePromises = invoices.map(async (invoice, index) => {
      const newInvoiceNumber = `INV-${index + 1}`;
      
      // Parse the existing data and update the invoice number
      const invoiceData = typeof invoice.data === 'string' 
        ? JSON.parse(invoice.data) 
        : invoice.data;
      
      const updatedData = {
        ...invoiceData,
        invoiceNumber: newInvoiceNumber,
      };

      return prisma.invoice.update({
        where: { id: invoice.id },
        data: { data: updatedData },
      });
    });

    await Promise.all(updatePromises);
    
    console.log(`Successfully renumbered ${invoices.length} invoices for client ${clientId}`);
  } catch (error) {
    console.error('Error renumbering invoices:', error);
    throw new Error('Failed to renumber invoices');
  }
}

/**
 * Generates the next sequential invoice number for a client
 * @param {string} clientId - The client ID
 * @param {string} userId - The user ID for security validation
 * @param {boolean} autoRenumber - Whether auto-renumbering is enabled for this client
 * @returns {Promise<string>} The next invoice number
 */
export async function generateNextInvoiceNumber(clientId, userId, autoRenumber = true) {
  try {
    const invoiceCount = await prisma.invoice.count({
      where: {
        clientId: clientId,
        userId: userId,
      },
    });

    if (autoRenumber) {
      // For auto-renumbering clients, always use sequential numbering
      return `INV-${invoiceCount + 1}`;
    } else {
      // For non-auto-renumbering clients, find the highest existing number and add 1
      const invoices = await prisma.invoice.findMany({
        where: {
          clientId: clientId,
          userId: userId,
        },
        select: {
          data: true,
        },
      });

      let maxNumber = 0;
      invoices.forEach(invoice => {
        const invoiceData = typeof invoice.data === 'string' 
          ? JSON.parse(invoice.data) 
          : invoice.data;
        
        if (invoiceData.invoiceNumber) {
          const match = invoiceData.invoiceNumber.match(/INV-(\d+)/);
          if (match) {
            const number = parseInt(match[1], 10);
            if (number > maxNumber) {
              maxNumber = number;
            }
          }
        }
      });

      return `INV-${maxNumber + 1}`;
    }
  } catch (error) {
    console.error('Error generating invoice number:', error);
    throw new Error('Failed to generate invoice number');
  }
}

/**
 * Checks if a client has auto-renumbering enabled
 * @param {string} clientId - The client ID
 * @param {string} userId - The user ID for security validation
 * @returns {Promise<boolean>} Whether auto-renumbering is enabled
 */
export async function isAutoRenumberingEnabled(clientId, userId) {
  try {
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId: userId,
      },
      select: {
        autoRenumberInvoices: true,
      },
    });

    return client?.autoRenumberInvoices ?? true; // Default to true if not found
  } catch (error) {
    console.error('Error checking auto-renumbering setting:', error);
    return true; // Default to true on error
  }
}