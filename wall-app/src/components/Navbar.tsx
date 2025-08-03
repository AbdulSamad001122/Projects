"use client";

import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav
      className="flex justify-between items-center px-6 py-4
                 bg-white/60 dark:bg-black/30 
                 backdrop-blur-md shadow-md 
                 border-b border-white/20 sticky top-0 z-50"
    >
      {/* Left side: Logo */}
      <div>
        <Link
          href="/"
          className="text-2xl font-bold text-gray-800 dark:text-white hover:text-blue-600 transition"
        >
          WallApp 🖼️
        </Link>
      </div>

      {/* Right side: Auth buttons or User */}
      <div className="flex items-center space-x-4">
        <SignedOut>
          <SignInButton>
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
              Sign In
            </button>
          </SignInButton>
          <SignUpButton>
            <button className="px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 transition">
              Sign Up
            </button>
          </SignUpButton>
        </SignedOut>

        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </nav>
  );
}
