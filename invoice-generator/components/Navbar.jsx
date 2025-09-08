"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText, Moon, Sun } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

export default function Navbar({ className, insideSidebar = false }) {
  const { isSignedIn, user } = useUser();
  const { theme, toggleTheme } = useTheme();
  
  let sidebarAwareClass = "";
  
  if (insideSidebar) {
    try {
      const { state } = useSidebar();
      // Adjust navbar width and positioning based on sidebar state
      sidebarAwareClass = state === "expanded" 
        ? "ml-64 w-[calc(100%-16rem)] transition-all duration-300 ease-in-out" 
        : "ml-16 w-[calc(100%-4rem)] transition-all duration-300 ease-in-out";
    } catch (error) {
      // Fallback if useSidebar fails
      sidebarAwareClass = "";
    }
  }

  return (
    <nav className={cn("border-b bg-white dark:bg-gree-900 dark:border-gray-700 fixed top-0 z-40", sidebarAwareClass, className)}>
      <div className="px-4">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <FileText className="h-6 w-6" />
            <span className="font-bold text-xl">Paddu Generator</span>
          </Link>

          {/* Navigation Items */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
            
            {isSignedIn ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                  Welcome,{" "}
                  {user.firstName || user.emailAddresses[0].emailAddress}
                </span>
                <UserButton signOutUrl="/" />
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link href="/signin">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
