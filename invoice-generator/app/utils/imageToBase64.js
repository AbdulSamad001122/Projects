/**
 * Utility function to convert image URLs to base64 data URLs
 * This is needed for PDF generation as @react-pdf/renderer cannot access external URLs
 */

export const convertImageToBase64 = async (imageUrl) => {
  console.log('🔄 Starting base64 conversion for:', imageUrl);
  
  if (!imageUrl) {
    console.log('❌ No image URL provided');
    return null;
  }

  // If it's already a data URL, return as is
  if (imageUrl.startsWith('data:')) {
    console.log('✅ Image is already a data URL');
    return imageUrl;
  }

  try {
    // Use our proxy API to fetch and convert the image
    console.log('📡 Using proxy API to fetch image:', imageUrl);
    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
    const response = await fetch(proxyUrl);

    console.log('📡 Proxy API response status:', response.status);
    
    if (!response.ok) {
      console.log('❌ Proxy API failed with status:', response.status, response.statusText);
      console.log('🔄 Returning original URL for @react-pdf/renderer to handle');
      return imageUrl; // Let @react-pdf/renderer handle the original URL
    }

    const result = await response.json();
    
    if (result.success && result.dataUrl) {
      console.log('✅ Base64 conversion completed via proxy, size:', result.size, 'bytes');
      return result.dataUrl;
    } else {
      console.log('❌ Proxy API returned error:', result.error);
      return imageUrl; // Fallback to original URL
    }
  } catch (error) {
    console.log('❌ Error during base64 conversion:', error.message);
    console.log('🔄 Returning original URL for @react-pdf/renderer to handle');
    return imageUrl; // Fallback to original URL
  }
};

/**
 * Convert company logo in invoice data for PDF generation
 */
export const prepareInvoiceDataForPDF = async (invoiceData) => {
  console.log('🔄 Preparing invoice data for PDF generation');
  console.log('📋 Original company logo URL:', invoiceData.companyLogo);
  
  if (!invoiceData.companyLogo) {
    console.log('❌ No company logo found in invoice data');
    return invoiceData;
  }

  // If it's already a data URL, return as is
  if (invoiceData.companyLogo.startsWith('data:')) {
    console.log('✅ Company logo is already a data URL');
    return invoiceData;
  }

  // For Cloudinary URLs, try to optimize for PDF rendering
  let optimizedLogo = invoiceData.companyLogo;
  if (invoiceData.companyLogo.includes('cloudinary.com')) {
    console.log('🌤️ Optimizing Cloudinary URL for PDF rendering');
    // Add transformations that might help with PDF rendering
    // Convert to PNG format and ensure proper size
    optimizedLogo = invoiceData.companyLogo
      .replace('/upload/', '/upload/f_png,w_200,h_200,c_fit/')
      .replace('.webp', '.png');
    console.log('🌤️ Optimized Cloudinary URL:', optimizedLogo);
  }

  console.log('🖼️ Attempting base64 conversion...');
  const base64Logo = await convertImageToBase64(optimizedLogo);
  
  if (base64Logo && base64Logo.startsWith('data:')) {
    console.log('✅ Base64 conversion successful, length:', base64Logo.length);
  } else if (base64Logo) {
    console.log('⚠️ Base64 conversion returned original URL (fallback)');
  } else {
    console.log('❌ Base64 conversion failed, returned null');
  }
  
  // If base64 conversion failed, use the optimized URL
  const finalLogo = base64Logo || optimizedLogo;
  console.log('🖼️ Final logo for PDF:', finalLogo.startsWith('data:') ? 'Base64 Data URL' : finalLogo);
  
  const result = {
    ...invoiceData,
    companyLogo: finalLogo
  };
  
  console.log('✅ Invoice data prepared for PDF generation');
  return result;
};