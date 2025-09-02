import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ClientProvider } from "@/contexts/ClientContext";
import { ItemProvider } from "@/contexts/ItemContext";
import { InvoiceProvider } from "@/contexts/InvoiceContext";
import { Analytics } from "@vercel/analytics/next";
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
            <ClientProvider>
              <ItemProvider>
                <InvoiceProvider>
                  <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
                    {children}
                  </main>
                  <Analytics />
                </InvoiceProvider>
              </ItemProvider>
            </ClientProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
