"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Users,
  Sparkles,
  TrendingUp,
  Calendar,
  FileText,
} from "lucide-react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import SidebarAwareNavbar from "@/components/SidebarAwareNavbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import axios from "axios";

export default function Home() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [clientForm, setClientForm] = useState({ name: "", email: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState([]);

  // Show loading state while Clerk is loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Redirect to sign in if not authenticated
  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Welcome to Invoice Generator
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Please sign in to start creating professional invoices
            </p>
          </div>
          <div className="mt-8 space-y-4">
            <Button asChild className="w-full">
              <a href="/signin">Sign In</a>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <a href="/signup">Create Account</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleCreateClient = async (e) => {
    e.preventDefault();
    if (!clientForm.name.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await axios.post("/api/clients", {
        name: clientForm.name,
        email: clientForm.email || null,
      });

      console.log("Created client:", response.data);
      // Add the new client to the list
      setClients((prev) => [response.data, ...prev]);

      // Reset form and close dialog
      setClientForm({ name: "", email: "" });
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error creating client:", error);
      // You might want to show an error message to the user here
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setClientForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SidebarAwareNavbar />
        <div className="flex-1 space-y-8 p-8 pt-20">
          {/* Enhanced Header with Gradient Background */}
          <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-700 dark:via-purple-700 dark:to-indigo-700 p-8 text-white">
            <div className="absolute inset-0 bg-black/20 dark:bg-black/40"></div>
            <div className="relative z-10 flex justify-between items-center">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <SidebarTrigger className="text-white hover:bg-white/20 border-white/30" />
                  <Sparkles className="h-6 w-6" />
                  <h1 className="text-4xl font-bold tracking-tight">
                    Dashboard
                  </h1>
                </div>
                <p className="text-blue-100 dark:text-blue-200 text-lg">
                  Welcome back,{" "}
                  {user.firstName || user.emailAddresses[0].emailAddress}!
                </p>
                <p className="text-blue-200 dark:text-blue-300 text-sm">
                  Manage your clients and create professional invoices with
                  ease.
                </p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="lg"
                    className="bg-white text-blue-600 hover:bg-blue-50 dark:bg-gray-100 dark:text-blue-700 dark:hover:bg-gray-200 shadow-lg"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Add Client
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] dark:bg-gray-800 dark:border-gray-700">
                  <DialogHeader className="space-y-3">
                    <DialogTitle className="text-2xl font-semibold flex items-center dark:text-white">
                      <Users className="mr-2 h-6 w-6 text-blue-600 dark:text-blue-400" />
                      Add New Client
                    </DialogTitle>
                    <DialogDescription className="text-base dark:text-gray-300">
                      Create a new client to add to your invoice system. Fill in
                      the details below.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateClient}>
                    <div className="space-y-6 py-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium dark:text-gray-200">
                          Client Name *
                        </Label>
                        <Input
                          id="name"
                          value={clientForm.name}
                          onChange={(e) =>
                            handleInputChange("name", e.target.value)
                          }
                          className="h-11"
                          placeholder="Enter client's full name"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">
                          Email Address
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={clientForm.email}
                          onChange={(e) =>
                            handleInputChange("email", e.target.value)
                          }
                          className="h-11"
                          placeholder="client@example.com (optional)"
                        />
                      </div>
                    </div>
                    <DialogFooter className="space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                        disabled={isSubmitting}
                        className="h-11"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting || !clientForm.name.trim()}
                        className="h-11 bg-blue-600 hover:bg-blue-700"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Creating...
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Client
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Welcome Cards Section */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 dark:bg-gray-800 hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-800 dark:text-green-300">
                  Quick Start
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                  Get Started
                </div>
                <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                  Add your first client to begin creating invoices
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 dark:bg-gray-800 hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  Client Management
                </CardTitle>
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">Organize</div>
                <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                  Manage all your clients in one place
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/20 dark:bg-gray-800 hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-800 dark:text-purple-300">
                  Professional Invoices
                </CardTitle>
                <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">Create</div>
                <p className="text-xs text-purple-700 dark:text-purple-400 mt-1">
                  Generate beautiful, professional invoices
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Getting Started Section */}
          <Card className="border-0 shadow-lg dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center dark:text-white">
                <Sparkles className="mr-2 h-5 w-5 text-yellow-500 dark:text-yellow-400" />
                Getting Started
              </CardTitle>
              <CardDescription className="text-base">
                Follow these simple steps to set up your invoice system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-start space-x-3 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Add Your First Client
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Click the "Add Client" button to add your first client
                      with their contact information.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Create Your Invoice
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Select a client from the sidebar and create professional
                      invoices with ease.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
