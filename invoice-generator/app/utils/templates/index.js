// Template Manager for Invoice Templates
// This module provides a centralized way to manage multiple invoice templates
// while maintaining consistent data structure across all templates

import BlueModernTemplate from "./blue-modern-template";
import YellowClassicTemplate from "./yellow-classic-template";
import GreenModernTemplate from "./green-modern-template";
import GreenClassicTemplate from "./green-classic-template";

// Template registry - add new templates here
export const INVOICE_TEMPLATES = {
  "blue-modern": {
    id: "blue-modern",
    name: "Blue Modern",
    description: "Professional blue template with curved header",
    component: BlueModernTemplate,
    preview: "/templates/blue-modern-preview.png", // Add preview images later
  },
  "yellow-classic": {
    id: "yellow-classic",
    name: "Yellow Classic",
    description: "Classic yellow template with clean layout",
    component: YellowClassicTemplate,
    preview: "/templates/yellow-classic-preview.png",
  },
  "green-modern": {
    id: "green-modern",
    name: "Green Modern",
    description: "Fresh and vibrant green-themed template",
    component: GreenModernTemplate,
    preview: "/templates/green-modern-preview.png",
  },
  "green-classic": {
    id: "green-classic",
    name: "Green Classic",
    description: "Classic green template with professional layout",
    component: GreenClassicTemplate,
    preview: "/templates/green-classic-preview.png",
  },
};

// Default template - can be changed by user
const INITIAL_DEFAULT_TEMPLATE = "blue-modern";

// Get user's preferred default template from localStorage
export const getDefaultTemplate = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('defaultTemplate') || INITIAL_DEFAULT_TEMPLATE;
  }
  return INITIAL_DEFAULT_TEMPLATE;
};

// Set user's preferred default template
export const setDefaultTemplate = (templateId) => {
  if (typeof window !== 'undefined' && INVOICE_TEMPLATES[templateId]) {
    localStorage.setItem('defaultTemplate', templateId);
    return true;
  }
  return false;
};

// For backward compatibility
export const DEFAULT_TEMPLATE = getDefaultTemplate();

// Get all available templates
export const getAvailableTemplates = () => {
  return Object.values(INVOICE_TEMPLATES);
};

// Get template by ID
export const getTemplateById = (templateId) => {
  return INVOICE_TEMPLATES[templateId] || INVOICE_TEMPLATES[DEFAULT_TEMPLATE];
};

// Get template component
export const getTemplateComponent = (templateId) => {
  const template = getTemplateById(templateId);
  return template.component;
};

// Validate template data structure
export const validateInvoiceData = (invoiceData) => {
  const requiredFields = [
    "companyName",
    "companyEmail",
    "clientName",
    "clientEmail",
    "invoiceNumber",
    "invoiceDate",
    "dueDate",
    "items",
  ];

  const missingFields = requiredFields.filter((field) => {
    const value = invoiceData[field];
    return (
      value === undefined ||
      value === null ||
      (Array.isArray(value) && value.length === 0) ||
      (typeof value === "string" && value.trim() === "")
    );
  });

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
};

// Standard data structure that all templates must support
export const TEMPLATE_DATA_STRUCTURE = {
  // Company Information
  companyName: "string",
  companyEmail: "string",
  companyLogo: "string|null",
  companyCustomFields: "array",

  // Client Information
  clientName: "string",
  clientEmail: "string",
  clientCustomFields: "array",

  // Invoice Details
  invoiceNumber: "string",
  invoiceDate: "string",
  dueDate: "string",
  status: "string",

  // Items
  items: "array", // [{itemName, description, quantity, rate, amount}]
  includeDescription: "boolean",

  // Financial
  taxRate: "number",
  discountRate: "number",

  // Additional
  notes: "string",
  terms: "string",
  bankName: "string",
  bankAccount: "string",
  showStatusOnPDF: "boolean",
};
