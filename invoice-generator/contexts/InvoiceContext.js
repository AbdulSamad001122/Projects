"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useUser } from '@clerk/nextjs';

const InvoiceContext = createContext();

export function useInvoices() {
  const context = useContext(InvoiceContext);
  if (!context) {
    throw new Error('useInvoices must be used within an InvoiceProvider');
  }
  return context;
}

export function InvoiceProvider({ children }) {
  const { user, isLoaded } = useUser();
  const [invoicesByClient, setInvoicesByClient] = useState({});
  const [loading, setLoading] = useState({});
  const [error, setError] = useState({});
  const [lastFetch, setLastFetch] = useState({});

  // Cache duration: 2 minutes for invoices (shorter than clients as they change more frequently)
  const CACHE_DURATION = 2 * 60 * 1000;
  const MAX_CACHED_CLIENTS = 50; // Limit number of cached client invoice lists

  // Cleanup old cache entries to prevent memory buildup
  const cleanupCache = useCallback(() => {
    setInvoicesByClient(prev => {
      const clientIds = Object.keys(prev);
      if (clientIds.length <= MAX_CACHED_CLIENTS) return prev;
      
      // Sort by last fetch time and keep only the most recent entries
      const sortedIds = clientIds.sort((a, b) => (lastFetch[b] || 0) - (lastFetch[a] || 0));
      const idsToKeep = sortedIds.slice(0, MAX_CACHED_CLIENTS);
      
      const cleaned = {};
      idsToKeep.forEach(id => {
        cleaned[id] = prev[id];
      });
      return cleaned;
    });
    
    setLastFetch(prev => {
      const cleaned = {};
      Object.keys(prev).forEach(id => {
        if (Object.keys(invoicesByClient).includes(id)) {
          cleaned[id] = prev[id];
        }
      });
      return cleaned;
    });
  }, [lastFetch, invoicesByClient]);

  const fetchInvoices = useCallback(async (clientId, force = false) => {
    // Skip if not authenticated or still loading
    if (!isLoaded || !user || !clientId) {
      return;
    }

    // Check if we have fresh data and don't need to force refresh
    const lastFetchTime = lastFetch[clientId];
    if (!force && lastFetchTime && Date.now() - lastFetchTime < CACHE_DURATION) {
      return;
    }

    try {
      setLoading(prev => ({ ...prev, [clientId]: true }));
      setError(prev => ({ ...prev, [clientId]: null }));
      
      const response = await axios.get(`/api/invoices?clientId=${clientId}`);
      const invoices = response.data.invoices || [];
      
      setInvoicesByClient(prev => ({
        ...prev,
        [clientId]: invoices
      }));
      
      setLastFetch(prev => ({
        ...prev,
        [clientId]: Date.now()
      }));
      
      // Cleanup cache if needed
      setTimeout(cleanupCache, 0);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(prev => ({
        ...prev,
        [clientId]: err.message
      }));
      // Keep existing invoices on error to avoid empty state
    } finally {
      setLoading(prev => ({ ...prev, [clientId]: false }));
    }
  }, [isLoaded, user, lastFetch, CACHE_DURATION]);

  const createInvoice = useCallback(async (newInvoice) => {
    try {
      const clientId = newInvoice.clientId;
      
      // Add the already created invoice to the list
      setInvoicesByClient(prev => ({
        ...prev,
        [clientId]: [newInvoice, ...(prev[clientId] || [])]
      }));
      
      setLastFetch(prev => ({
        ...prev,
        [clientId]: Date.now()
      }));
      
      return newInvoice;
    } catch (err) {
      console.error('Error adding invoice to context:', err);
      throw err;
    }
  }, []);

  const updateInvoice = useCallback(async (invoiceId, updatedInvoice) => {
    try {
      const clientId = updatedInvoice.clientId;
      
      // Update the invoice list with the already updated invoice
      setInvoicesByClient(prev => ({
        ...prev,
        [clientId]: (prev[clientId] || []).map(invoice => 
          invoice.id === invoiceId ? updatedInvoice : invoice
        )
      }));
      
      setLastFetch(prev => ({
        ...prev,
        [clientId]: Date.now()
      }));
      
      return updatedInvoice;
    } catch (err) {
      console.error('Error updating invoice:', err);
      throw err;
    }
  }, []);

  const updateInvoiceStatus = useCallback(async (invoiceId, status, clientId) => {
    try {
      const response = await axios.patch(`/api/invoices?id=${invoiceId}`, { status });
      const updatedInvoice = response.data.invoice;
      
      // Optimistically update the invoice list
      setInvoicesByClient(prev => ({
        ...prev,
        [clientId]: (prev[clientId] || []).map(invoice => 
          invoice.id === invoiceId ? updatedInvoice : invoice
        )
      }));
      
      setLastFetch(prev => ({
        ...prev,
        [clientId]: Date.now()
      }));
      
      return updatedInvoice;
    } catch (err) {
      console.error('Error updating invoice status:', err);
      throw err;
    }
  }, []);

  const deleteInvoice = useCallback(async (invoiceId, clientId) => {
    try {
      await axios.delete(`/api/invoices?id=${invoiceId}`);
      
      // Optimistically update the invoice list
      setInvoicesByClient(prev => ({
        ...prev,
        [clientId]: (prev[clientId] || []).filter(invoice => invoice.id !== invoiceId)
      }));
      
      setLastFetch(prev => ({
        ...prev,
        [clientId]: Date.now()
      }));
    } catch (err) {
      console.error('Error deleting invoice:', err);
      throw err;
    }
  }, []);

  const getInvoicesForClient = useCallback((clientId) => {
    return invoicesByClient[clientId] || [];
  }, [invoicesByClient]);

  const getInvoiceById = useCallback((invoiceId, clientId) => {
    const clientInvoices = invoicesByClient[clientId] || [];
    return clientInvoices.find(invoice => invoice.id === invoiceId);
  }, [invoicesByClient]);

  const refreshInvoices = useCallback((clientId) => {
    return fetchInvoices(clientId, true);
  }, [fetchInvoices]);

  const clearClientInvoices = useCallback((clientId) => {
    setInvoicesByClient(prev => {
      const newState = { ...prev };
      delete newState[clientId];
      return newState;
    });
    setLastFetch(prev => {
      const newState = { ...prev };
      delete newState[clientId];
      return newState;
    });
    setLoading(prev => {
      const newState = { ...prev };
      delete newState[clientId];
      return newState;
    });
    setError(prev => {
      const newState = { ...prev };
      delete newState[clientId];
      return newState;
    });
  }, []);

  const value = {
    invoicesByClient,
    loading,
    error,
    fetchInvoices,
    createInvoice,
    updateInvoice,
    updateInvoiceStatus,
    deleteInvoice,
    getInvoicesForClient,
    getInvoiceById,
    refreshInvoices,
    clearClientInvoices,
    lastFetch
  };

  return (
    <InvoiceContext.Provider value={value}>
      {children}
    </InvoiceContext.Provider>
  );
}