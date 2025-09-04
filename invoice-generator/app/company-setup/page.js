"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import CompanyProfileForm from "@/components/company-profile-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";


export default function CompanySetupPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [hasCompanyProfile, setHasCompanyProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [existingProfile, setExistingProfile] = useState(null);

  useEffect(() => {
    const checkCompanyProfile = async () => {
      if (!isSignedIn) {
        router.push("/signin");
        return;
      }

      try {
        const response = await fetch("/api/company-profile");
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setHasCompanyProfile(result.data.hasCompanyProfile);
            if (result.data.hasCompanyProfile) {
              setExistingProfile({
                companyName: result.data.companyName || "",
                companyEmail: result.data.companyEmail || "",
                companyLogo: result.data.companyLogo || ""
              });
            }
          }
        }
      } catch (error) {
        console.error("Error checking company profile:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isLoaded) {
      checkCompanyProfile();
    }
  }, [isLoaded, isSignedIn, router]);

  const handleProfileSaved = (profileData) => {
    // Redirect to dashboard after successful setup
    router.push("/");
  };

  const handleSkip = () => {
    // Allow users to skip setup and go to dashboard
    router.push("/");
  };

  // Show loading state while checking authentication and profile
  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to signin if not authenticated
  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {hasCompanyProfile ? "Edit Company Information" : "Welcome to Invoice Generator!"}
        </h1>
        <p className="text-gray-600">
          {hasCompanyProfile 
            ? "Update your company profile information below."
            : "Let's set up your company profile to get started with creating professional invoices."
          }
        </p>
      </div>

      {/* Company Profile Form */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <CompanyProfileForm
          onSave={handleProfileSaved}
          isModal={false}
          initialData={existingProfile}
        />
      </div>

      {/* Skip Option - Only show for new users */}
      {!hasCompanyProfile && (
        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-gray-500 hover:text-gray-700"
          >
            Skip for now
          </Button>
          <p className="text-xs text-gray-400 mt-2">
            You can set this up later in your account settings
          </p>
        </div>
      )}

      {/* Back to Dashboard */}
      <div className="mt-8 text-center">
        <Button
          variant="outline"
          onClick={() => router.push("/")}
          className="inline-flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}