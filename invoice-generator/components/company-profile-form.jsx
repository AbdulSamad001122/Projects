"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LoadingButton from "@/components/ui/loading-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { X, Upload, Building2, ImageIcon, Trash2 } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useToast } from "@/contexts/ToastContext";

export function CompanyProfileForm({ onClose, onSave, onProfileSaved, isModal = true, initialData = null }) {
  const { userId } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    companyName: "",
    companyEmail: "",
    companyLogo: "",
    bankName: "",
    bankAccount: "",
    defaultDueDays: "",
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [initialLoading, setInitialLoading] = useState(!initialData);
  const [updateOption, setUpdateOption] = useState("fromNow");

  // Initialize form data with initialData or fetch from API
  useEffect(() => {
    if (initialData) {
      const logoUrl = initialData.companyLogo || "";
      setFormData({
        companyName: initialData.companyName || "",
        companyEmail: initialData.companyEmail || "",
        companyLogo: logoUrl,
        bankName: initialData.bankName || "",
        bankAccount: initialData.bankAccount || "",
        defaultDueDays: initialData.defaultDueDays ? initialData.defaultDueDays.toString() : "",
      });
      setLogoPreview(logoUrl);
      setInitialLoading(false);
      return;
    }

    const fetchCompanyProfile = async () => {
      try {
        const response = await fetch("/api/company-profile");
        console.log('API Response Status:', response.status);
        if (response.ok) {
          const result = await response.json();
          console.log('Company Profile API Response:', result);
          if (result.success && result.data) {
            console.log('defaultDueDays from API:', result.data.defaultDueDays, typeof result.data.defaultDueDays);
            console.log('All API data:', result.data);
            const logoUrl = result.data.companyLogo || "";
            const formDataToSet = {
              companyName: result.data.companyName || "",
              companyEmail: result.data.companyEmail || "",
              companyLogo: logoUrl,
              bankName: result.data.bankName || "",
              bankAccount: result.data.bankAccount || "",
              defaultDueDays: result.data.defaultDueDays ? result.data.defaultDueDays.toString() : "",
            };
            console.log('Setting form data:', formDataToSet);
            console.log('defaultDueDays in form data:', formDataToSet.defaultDueDays);
            setFormData(formDataToSet);
            setLogoPreview(logoUrl);
          }
        } else {
          console.log('API Response not OK:', response.status, response.statusText);
        }
      } catch (error) {
        console.error("Error fetching company profile:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    if (userId && !initialData) {
      fetchCompanyProfile();
    }
  }, [userId, initialData]);

  // Handle file selection for logo upload
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, companyLogo: 'Please select a valid image file' }));
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, companyLogo: 'File size must be less than 5MB' }));
        return;
      }
      
      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
      
      // Clear any existing errors
      setErrors(prev => ({ ...prev, companyLogo: '' }));
    }
  };

  // Upload logo file to server
  const uploadLogoFile = async (file) => {
    const formData = new FormData();
    formData.append('logo', file);
    
    const response = await fetch('/api/upload-logo', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload logo');
    }
    
    const result = await response.json();
    return result.logoUrl;
  };

  // Remove logo
  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setFormData(prev => ({ ...prev, companyLogo: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = "Company name is required";
    }

    if (!formData.companyEmail.trim()) {
      newErrors.companyEmail = "Company email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.companyEmail)) {
      newErrors.companyEmail = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      let logoUrl = formData.companyLogo;
      
      // Upload logo file if a new file was selected
      if (logoFile) {
        setUploadingLogo(true);
        try {
          logoUrl = await uploadLogoFile(logoFile);
        } catch (uploadError) {
          console.error('Error uploading logo:', uploadError);
          setErrors({ submit: 'Failed to upload logo. Please try again.' });
          setLoading(false);
          setUploadingLogo(false);
          return;
        }
        setUploadingLogo(false);
      }

      const requestBody = {
        companyName: formData.companyName.trim(),
        companyEmail: formData.companyEmail.trim(),
        companyLogo: logoUrl || null,
        bankName: formData.bankName.trim() || null,
        bankAccount: formData.bankAccount.trim() || null,
        defaultDueDays: formData.defaultDueDays ? parseInt(formData.defaultDueDays) : null,
        updateOption: updateOption,
      };
      
      const response = await fetch("/api/company-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Show success message with invoice update info if applicable
        if (result.data?.updatedInvoicesCount > 0) {
          // Show a user-friendly success message without console warnings
          const message = `Company profile updated successfully! ${result.data.updatedInvoicesCount} existing invoices have been updated with the new information.`;
          toast.success(message);
        } else {
          toast.success('Company profile updated successfully!');
        }
        
        // Use onSave if provided, otherwise fall back to onProfileSaved
        const saveCallback = onSave || onProfileSaved;
        if (saveCallback) {
          saveCallback(result.data);
        }
        if (onClose) {
          onClose();
        }
      } else {
        setErrors({ submit: result.error || "Failed to save company profile" });
      }
    } catch (error) {
      console.error("Error saving company profile:", error);
      setErrors({ submit: "An error occurred while saving the profile" });
    } finally {
      setLoading(false);
      setUploadingLogo(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const formContent = (
    <form onSubmit={handleSubmit} action="/api/company-profile" className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="companyName">Company Name *</Label>
          <Input
            id="companyName"
            type="text"
            value={formData.companyName}
            onChange={(e) => handleInputChange("companyName", e.target.value)}
            placeholder="Enter your company name"
            className={errors.companyName ? "border-red-500" : ""}
          />
          {errors.companyName && (
            <p className="text-sm text-red-500">{errors.companyName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyEmail">Company Email *</Label>
          <Input
            id="companyEmail"
            type="email"
            value={formData.companyEmail}
            onChange={(e) => handleInputChange("companyEmail", e.target.value)}
            placeholder="Enter your company email"
            className={errors.companyEmail ? "border-red-500" : ""}
          />
          {errors.companyEmail && (
            <p className="text-sm text-red-500">{errors.companyEmail}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyLogo">Company Logo (Optional)</Label>
          
          {/* Logo Preview */}
          {logoPreview && (
            <div className="relative inline-block">
              <img
                src={logoPreview}
                alt="Company logo preview"
                className="w-24 h-24 object-contain border border-gray-300 rounded-lg bg-gray-50"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                onClick={removeLogo}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
          
          {/* File Upload */}
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="logoFileInput"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingLogo}
              className="flex items-center gap-2"
            >
              {uploadingLogo ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {logoPreview ? 'Change Logo' : 'Upload Logo'}
            </Button>
            {logoFile && (
              <span className="text-sm text-gray-600">
                {logoFile.name}
              </span>
            )}
          </div>
          
          {errors.companyLogo && (
            <p className="text-sm text-red-500">{errors.companyLogo}</p>
          )}
          <p className="text-sm text-gray-500">
            Upload your company logo image. Supported formats: JPG, PNG, GIF. Max size: 5MB.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bankName">Bank Name (Optional)</Label>
          <Input
            id="bankName"
            type="text"
            value={formData.bankName}
            onChange={(e) => handleInputChange("bankName", e.target.value)}
            placeholder="Enter your bank name"
            className={errors.bankName ? "border-red-500" : ""}
          />
          {errors.bankName && (
            <p className="text-sm text-red-500">{errors.bankName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bankAccount">Bank Account Number (Optional)</Label>
          <Input
            id="bankAccount"
            type="text"
            value={formData.bankAccount}
            onChange={(e) => handleInputChange("bankAccount", e.target.value)}
            placeholder="Enter your bank account number"
            className={errors.bankAccount ? "border-red-500" : ""}
          />
          {errors.bankAccount && (
            <p className="text-sm text-red-500">{errors.bankAccount}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="defaultDueDays">Default Due Days (Optional)</Label>
          <Input
            id="defaultDueDays"
            type="number"
            min="1"
            max="365"
            value={formData.defaultDueDays}
            onChange={(e) => handleInputChange("defaultDueDays", e.target.value)}
            placeholder="Enter default due days (e.g., 7, 30)"
            className={errors.defaultDueDays ? "border-red-500" : ""}
          />
          {errors.defaultDueDays && (
            <p className="text-sm text-red-500">{errors.defaultDueDays}</p>
          )}
          <p className="text-sm text-gray-500">
            Number of days from invoice date to due date (will auto-populate in invoices)
          </p>
        </div>

        <div className="space-y-3">
          <Label>Update Existing Invoices</Label>
          <RadioGroup value={updateOption} onValueChange={setUpdateOption}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="fromNow" id="fromNow" />
              <Label htmlFor="fromNow" className="text-sm font-normal">
                Apply changes to new invoices only
              </Label>
            </div>
            <div className="flex items-center space-x-2">
               <RadioGroupItem value="allInvoices" id="allInvoices" />
               <Label htmlFor="allInvoices" className="text-sm font-normal">
                 Update all existing invoices
               </Label>
             </div>
          </RadioGroup>
        </div>
      </div>

      {errors.submit && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{errors.submit}</p>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        {onClose && (
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        )}
        <LoadingButton
          type="submit"
          loading={loading}
          disabled={loading}
          className="flex-1"
        >
          <Building2 className="w-4 h-4 mr-2" />
          Save Company Profile
        </LoadingButton>
      </div>
    </form>
  );

  if (!isModal) {
    return (
      <div className="max-w-md mx-auto">
        <div className="mb-6 text-center">
          <Building2 className="w-12 h-12 mx-auto mb-4 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Company Profile Setup</h2>
          <p className="text-gray-600 mt-2">
            Set up your company information to personalize your invoices
          </p>
        </div>
        {formContent}
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="relative">
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 h-8 w-8 p-0"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <div className="flex items-center gap-2">
          <Building2 className="w-6 h-6 text-blue-600" />
          <CardTitle>Company Profile Setup</CardTitle>
        </div>
        <CardDescription>
          Set up your company information to personalize your invoices
        </CardDescription>
      </CardHeader>
      <CardContent>{formContent}</CardContent>
    </Card>
  );
}

export default CompanyProfileForm;