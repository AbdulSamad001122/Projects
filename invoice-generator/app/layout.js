import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ClientProvider } from "@/contexts/ClientContext";
import { ItemProvider } from "@/contexts/ItemContext";
import { InvoiceProvider } from "@/contexts/InvoiceContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { Analytics } from "@vercel/analytics/next";
import {
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import SidebarAwareNavbar from "@/components/SidebarAwareNavbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Invoice Generator",
  description: "Create professional invoices with client management",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning={true}>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ThemeProvider>
            <ToastProvider>
              <ClientProvider>
                <ItemProvider>
                  <InvoiceProvider>
                    <SidebarProvider>
                      <AppSidebar />
                      <SidebarInset>
                        <div className="flex flex-col min-h-screen">
                          <SidebarAwareNavbar />
                          <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                            {children}
                          </main>
                        </div>
                      </SidebarInset>
                    </SidebarProvider>
                    <Analytics />
                  </InvoiceProvider>
                </ItemProvider>
              </ClientProvider>
            </ToastProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
