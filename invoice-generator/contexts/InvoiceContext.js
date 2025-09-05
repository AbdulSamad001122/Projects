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
  const [loadingMore, setLoadingMore] = useState({});
  const [searchLoading, setSearchLoading] = useState({});
  const [error, setError] = useState({});
  const [lastFetch, setLastFetch] = useState({});
  const [pagination, setPagination] = useState({});

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
      // Use functional state update to get current invoicesByClient
      setInvoicesByClient(currentInvoices => {
        Object.keys(prev).forEach(id => {
          if (Object.keys(currentInvoices).includes(id)) {
            cleaned[id] = prev[id];
          }
        });
        return currentInvoices;
      });
      return cleaned;
    });
  }, []);

  const fetchInvoices = useCallback(async (clientId, force = false, reset = false, searchParams = {}) => {
    // Skip if not authenticated or still loading
    if (!isLoaded || !user || !clientId) {
      return;
    }

    // Always fetch when search parameters are provided
    const hasSearchParams = Object.keys(searchParams).some(key => searchParams[key]);

    // Check if we have fresh data and don't need to force refresh
    let lastFetchTime = null;
    setLastFetch(prev => {
      lastFetchTime = prev[clientId];
      return prev;
    });
    
    if (!force && !reset && !hasSearchParams && lastFetchTime && Date.now() - lastFetchTime < CACHE_DURATION) {
      return;
    }

    try {
      // Use functional state updates to avoid dependency issues
      let isInitialLoad = false;
      let currentPagination = { page: 1, limit: 10 };
      
      // Get current state values
      setInvoicesByClient(prev => {
        isInitialLoad = reset || !prev[clientId] || prev[clientId].length === 0;
        return prev;
      });
      
      setPagination(prev => {
        currentPagination = prev[clientId] || { page: 1, limit: 10 };
        if (isInitialLoad) {
          return { ...prev, [clientId]: { page: 1, limit: 10, totalCount: 0, totalPages: 0, hasMore: false } };
        }
        return prev;
      });
      
      // Use different loading states for search vs initial load
      if (hasSearchParams) {
        setSearchLoading(prev => ({ ...prev, [clientId]: true }));
      } else if (isInitialLoad) {
        setLoading(prev => ({ ...prev, [clientId]: true }));
      }
      
      setError(prev => ({ ...prev, [clientId]: null }));
      
      const page = reset ? 1 : currentPagination.page;
      
      // Build query parameters
      const queryParams = new URLSearchParams({
        clientId,
        page: page.toString(),
        limit: currentPagination.limit.toString()
      });
      
      // Add search parameters if provided
      if (searchParams.search) queryParams.append('search', searchParams.search);
      if (searchParams.date) queryParams.append('date', searchParams.date);
      if (searchParams.status) queryParams.append('status', searchParams.status);
      
      const response = await axios.get(`/api/invoices?${queryParams.toString()}`);
      
      const newInvoices = response.data.invoices || [];
      
      if (reset || isInitialLoad) {
        setInvoicesByClient(prev => ({
          ...prev,
          [clientId]: newInvoices
        }));
      } else {
        setInvoicesByClient(prev => {
          const existingInvoices = prev[clientId] || [];
          const existingIds = new Set(existingInvoices.map(invoice => invoice.id));
          const uniqueNewInvoices = newInvoices.filter(invoice => !existingIds.has(invoice.id));
          
          return {
            ...prev,
            [clientId]: [...existingInvoices, ...uniqueNewInvoices]
          };
        });
      }
      
      setPagination(prev => ({
        ...prev,
        [clientId]: {
          page: response.data.pagination.page,
          limit: response.data.pagination.limit,
          totalCount: response.data.pagination.totalCount,
          totalPages: response.data.pagination.totalPages,
          hasMore: response.data.pagination.hasMore,
        }
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
      setSearchLoading(prev => ({ ...prev, [clientId]: false }));
    }
  }, [isLoaded, user, CACHE_DURATION]);

  const loadMoreInvoices = useCallback(async (clientId) => {
    let clientPagination = null;
    let isCurrentlyLoading = false;
    
    // Get current state values using functional updates
    setPagination(prev => {
      clientPagination = prev[clientId];
      return prev;
    });
    
    setLoadingMore(prev => {
      isCurrentlyLoading = prev[clientId];
      return prev;
    });
    
    if (!clientPagination?.hasMore || isCurrentlyLoading) return;

    try {
      setLoadingMore(prev => ({ ...prev, [clientId]: true }));
      setError(prev => ({ ...prev, [clientId]: null }));
      
      const nextPage = clientPagination.page + 1;
      const response = await axios.get(`/api/invoices?clientId=${clientId}&page=${nextPage}&limit=${clientPagination.limit}`);
      
      const newInvoices = response.data.invoices || [];
      
      setInvoicesByClient(prev => {
        const existingInvoices = prev[clientId] || [];
        const existingIds = new Set(existingInvoices.map(invoice => invoice.id));
        const uniqueNewInvoices = newInvoices.filter(invoice => !existingIds.has(invoice.id));
        
        return {
          ...prev,
          [clientId]: [...existingInvoices, ...uniqueNewInvoices]
        };
      });
      
      setPagination(prev => ({
        ...prev,
        [clientId]: {
          page: response.data.pagination.page,
          limit: response.data.pagination.limit,
          totalCount: response.data.pagination.totalCount,
          totalPages: response.data.pagination.totalPages,
          hasMore: response.data.pagination.hasMore,
        }
      }));
    } catch (err) {
      console.error('Error loading more invoices:', err);
      setError(prev => ({
        ...prev,
        [clientId]: 'Failed to load more invoices'
      }));
    } finally {
      setLoadingMore(prev => ({ ...prev, [clientId]: false }));
    }
  }, []);

  const createInvoice = useCallback(async (newInvoice) => {
    try {
      const clientId = newInvoice.clientId;
      
      // Add the already created invoice to the list
      setInvoicesByClient(prev => {
        const existingInvoices = prev[clientId] || [];
        const existingIds = new Set(existingInvoices.map(invoice => invoice.id));
        
        // Only add if it doesn't already exist
        if (!existingIds.has(newInvoice.id)) {
          return {
            ...prev,
            [clientId]: [newInvoice, ...existingInvoices]
          };
        }
        
        return prev;
      });
      
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

  const duplicateInvoice = useCallback(async (invoiceId, clientId) => {
    try {
      const response = await axios.post(`/api/invoices/duplicate`, { invoiceId });
      const duplicatedInvoice = response.data.invoice;
      
      // Add the duplicated invoice to the beginning of the list
      setInvoicesByClient(prev => {
        const existingInvoices = prev[clientId] || [];
        return {
          ...prev,
          [clientId]: [duplicatedInvoice, ...existingInvoices]
        };
      });
      
      setLastFetch(prev => ({
        ...prev,
        [clientId]: Date.now()
      }));
      
      return duplicatedInvoice;
    } catch (err) {
      console.error('Error duplicating invoice:', err);
      throw err;
    }
  }, []);

  const deleteInvoice = useCallback(async (invoiceId, clientId) => {
    try {
      await axios.delete(`/api/invoices?id=${invoiceId}`);
      
      // Refresh the invoice list to get updated invoice numbers after re-arrangement
      await fetchInvoices(clientId, true, true);
    } catch (err) {
      console.error('Error deleting invoice:', err);
      throw err;
    }
  }, [fetchInvoices]);

  const getInvoicesForClient = useCallback((clientId) => {
    return invoicesByClient[clientId] || [];
  }, [invoicesByClient]);

  const getInvoiceById = useCallback((invoiceId, clientId) => {
    const clientInvoices = invoicesByClient[clientId] || [];
    return clientInvoices.find(invoice => invoice.id === invoiceId);
  }, [invoicesByClient]);

  const refreshInvoices = useCallback((clientId) => {
    return fetchInvoices(clientId, true, true); // force refresh and reset pagination
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
    loadingMore,
    searchLoading,
    error,
    pagination,
    fetchInvoices,
    loadMoreInvoices,
    createInvoice,
    updateInvoice,
    updateInvoiceStatus,
    duplicateInvoice,
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