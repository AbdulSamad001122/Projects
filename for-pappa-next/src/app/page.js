"use client";
import { useState } from "react";
import { useUser, SignIn, SignUp, UserButton } from "@clerk/nextjs";
import axios from "axios";

export default function Home() {
  const { isSignedIn, user, isLoaded } = useUser();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [processResult, setProcessResult] = useState(null);
  const [error, setError] = useState(null);
  const [showSignUp, setShowSignUp] = useState(false);
  const [serialColumn, setSerialColumn] = useState("Del.Challan");
  const [createXlsxFiles, setCreateXlsxFiles] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.name.toLowerCase().endsWith(".xlsx")) {
        setError("Please select an XLSX file");
        return;
      }
      // Validate file size (10MB limit)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
    setUploadResult(null);
    setProcessResult(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    setUploading(true);
    setError(null);
    setProcessResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || "Upload failed";
        } catch {
          errorMessage = `Upload failed with status ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      setUploadResult(result);
      setFile(null);
      // Reset file input
      const fileInput = document.getElementById("file-input");
      if (fileInput) fileInput.value = "";
    } catch (error) {
      console.error("Upload error:", error);
      setError(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleProcess = async () => {
    if (!uploadResult) {
      setError("No file uploaded to process");
      return;
    }

    if (!serialColumn.trim()) {
      setError("Please specify a serial column name");
      return;
    }

    setProcessing(true);
    setError(null);
    setProcessResult(null);

    try {
      const response = await axios.post("/api/process", {
        publicId: uploadResult.publicId,
        serialColumn: serialColumn,
        createXlsxFiles: createXlsxFiles
      });

      if (response.data) {
        setProcessResult(response.data);
      } else {
        throw new Error("No data received from processing");
      }
    } catch (error) {
      console.error("Processing error:", error);
      if (error.response) {
        // Server responded with error status
        setError(error.response.data?.error || `Processing failed: ${error.response.status}`);
      } else if (error.request) {
        // Request was made but no response received
        setError("No response from server. Please check your connection.");
      } else {
        // Something else happened
        setError(error.message || "Processing failed");
      }
    } finally {
      setProcessing(false);
    }
  };

  const downloadAllPDFs = async () => {
    if (!processResult?.results) return;
    
    try {
      for (const result of processResult.results) {
        await downloadSinglePDF(result.pdfPublicId, result.serialNumber);
        // Add delay between downloads
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    } catch (error) {
      console.error('Failed to download all PDFs:', error);
      alert('Some downloads may have failed. Please try downloading individual PDFs.');
    }
  };

  const downloadSinglePDF = async (pdfPublicId, serialNumber) => {
    try {
      const filename = `Serial_${serialNumber}.pdf`;
      
      // Use our API endpoint to download the PDF
      const downloadUrl = `/api/download-pdf?publicId=${encodeURIComponent(pdfPublicId)}&filename=${encodeURIComponent(filename)}`;
      
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error(`Failed to download PDF for serial ${serialNumber}:`, error);
      alert(`Failed to download PDF for serial ${serialNumber}. Error: ${error.message}`);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };



  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">For Pappa</h1>
            <p className="text-gray-600">Upload and process your XLSX files</p>
          </div>

          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="flex justify-center mb-6">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setShowSignUp(false)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    !showSignUp
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setShowSignUp(true)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    showSignUp
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Sign Up
                </button>
              </div>
            </div>

            <div className="flex justify-center">
              {showSignUp ? (
                <SignUp
                  appearance={{
                    elements: {
                      rootBox: "w-full",
                      card: "shadow-none border-0 bg-transparent",
                    },
                  }}
                />
              ) : (
                <SignIn
                  appearance={{
                    elements: {
                      rootBox: "w-full",
                      card: "shadow-none border-0 bg-transparent",
                    },
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="flex justify-between items-start mb-8">
            <div className="text-center flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome,{" "}
                {user?.firstName ||
                  user?.emailAddresses?.[0]?.emailAddress ||
                  "User"}
                !
              </h1>
              <p className="text-gray-600">
                Upload your XLSX files to process them with Cloudinary
              </p>
            </div>
            <div className="ml-4">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label
                htmlFor="file-input"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Select XLSX File
              </label>
              <input
                id="file-input"
                type="file"
                onChange={handleFileChange}
                accept=".xlsx"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-gray-300 rounded-md"
              />
              {file && (
                <p className="mt-2 text-sm text-green-600">
                  Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)}{" "}
                  MB)
                </p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-md transition-colors"
            >
              {uploading ? "Uploading..." : "Upload File"}
            </button>

            {uploadResult && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <h3 className="text-green-800 font-medium mb-2">
                  Upload Successful!
                </h3>
                <div className="text-sm text-green-700 space-y-1">
                  <p>
                    <strong>File ID:</strong>{" "}
                    {uploadResult.publicId || uploadResult.public_id}
                  </p>
                  <p>
                    <strong>Size:</strong> {formatFileSize(uploadResult.bytes)}
                  </p>
                  <p>
                    <strong>Format:</strong> {uploadResult.format}
                  </p>
                  <p>
                    <strong>URL:</strong>{" "}
                    <a
                      href={uploadResult.secureUrl || uploadResult.secure_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View File
                    </a>
                  </p>
                </div>
              </div>
            )}

            {uploadResult && (
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <h3 className="text-gray-800 font-medium mb-3">
                  Processing Options
                </h3>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="serial-column"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Serial Column Name
                    </label>
                    <input
                      id="serial-column"
                      type="text"
                      value={serialColumn}
                      onChange={(e) => setSerialColumn(e.target.value)}
                      placeholder="Del.Challan"
                      className="w-full px-3 text-black py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      The column name to group rows by (e.g., &quot;Del.Challan&quot;, &quot;Serial&quot;, etc.)
                    </p>
                  </div>
                  {/* <div>
                    <div className="flex items-center">
                      <input
                        id="create-xlsx"
                        type="checkbox"
                        checked={createXlsxFiles}
                        onChange={(e) => setCreateXlsxFiles(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="create-xlsx" className="ml-2 block text-sm text-gray-700">
                        Also create split XLSX files (in addition to PDFs)
                      </label>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 ml-6">
                      Each serial number group will be saved as a separate XLSX file
                    </p>
                  </div> */}
                </div>
              </div>
            )}

            <button
              onClick={handleProcess}
              disabled={!uploadResult || processing}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-md transition-colors"
            >
              {processing ? "Processing..." : uploadResult ? "Process File" : "Upload a file first"}
            </button>

            {processResult && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h3 className="text-blue-800 font-medium mb-2">
                  Processing Complete!
                </h3>
                <div className="text-sm text-blue-700 space-y-2">
                  <p>
                    <strong>Status:</strong> {processResult.success ? 'Success' : 'Failed'}
                  </p>
                  <p>
                    <strong>Total Groups:</strong> {processResult.totalGroups}
                  </p>
                  <p>
                    <strong>Total Rows Processed:</strong> {processResult.totalRows}
                  </p>
                  {processResult.skippedRows > 0 && (
                    <p>
                      <strong>Skipped Rows:</strong> {processResult.skippedRows} (missing serial numbers)
                    </p>
                  )}
                  <p>
                    <strong>PDFs Created:</strong> {processResult.pdfsCreated}
                  </p>
                  {processResult.xlsxCreated !== null && (
                    <p>
                      <strong>XLSX Files Created:</strong> {processResult.xlsxCreated}
                    </p>
                  )}
                  {processResult.serialNumberRange && (
                    <p>
                      <strong>Serial Number Range:</strong> {processResult.serialNumberRange.min} - {processResult.serialNumberRange.max}
                    </p>
                  )}
                  {processResult.results && processResult.results.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p><strong>Generated Files:</strong></p>
                        <button
                          onClick={downloadAllPDFs}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium"
                        >
                          Download All PDFs
                        </button>
                      </div>
                      <div className="mt-2 space-y-1">
                        {processResult.results.map((result, index) => (
                          <div key={index} className="bg-white p-3 rounded border">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <span className="text-sm font-medium">Serial: {result.serialNumber}</span>
                                <span className="text-xs text-gray-500 ml-2">({result.rowCount} rows)</span>
                              </div>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              {/* PDF buttons */}
                              <button
                                onClick={() => downloadSinglePDF(result.pdfPublicId, result.serialNumber)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium"
                              >
                                📄 Download PDF
                              </button>
                              <a
                                href={result.pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-xs font-medium inline-block"
                              >
                                👁️ View PDF
                              </a>
                              {/* XLSX buttons if available */}
                              {result.xlsxUrl && (
                                <>
                                  <a
                                    href={`/api/download-xlsx?url=${encodeURIComponent(result.xlsxUrl)}&filename=${encodeURIComponent(`Serial_${result.serialNumber}.xlsx`)}`}
                                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium inline-block"
                                  >
                                    📊 Download XLSX
                                  </a>
                                  <a
                                    href={result.xlsxUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-xs font-medium inline-block"
                                  >
                                    🔗 View XLSX
                                  </a>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}