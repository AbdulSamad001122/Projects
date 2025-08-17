// "use client";

// import Link from "next/link";
// import {
//   SignedIn,
//   SignedOut,
//   UserButton,
//   SignInButton,
//   SignUpButton,
// } from "@clerk/nextjs";

// export default function Navbar() {
//   return (
//     <nav className="w-full bg-black border-b border-gray-800 text-gray-100">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
//         {/* Left: Logo */}
//         <Link href="/" className="flex items-center gap-2">
//           {/* If you have an image logo, uncomment:
//           <img src="/logo.svg" alt="Logo" className="h-6 w-6" />
//           */}
//           <span className="text-lg font-semibold tracking-tight">MyApp</span>
//         </Link>

//         {/* Right: Auth area */}
//         <div className="flex items-center gap-3">
//           {/* When signed in: show Clerk user avatar/dropdown */}
//           <SignedIn>
//             <UserButton afterSignOutUrl="/" />
//           </SignedIn>

//           {/* When signed out: show Login / Sign Up */}
//           <SignedOut>
//             <div className="flex items-center gap-2">
//               <SignInButton mode="modal">
//                 <button className="px-3 py-1.5 rounded-md border border-gray-700 hover:bg-gray-900 transition">
//                   Log in
//                 </button>
//               </SignInButton>
//               <SignUpButton mode="modal">
//                 <button className="px-3 py-1.5 rounded-md bg-white text-black hover:bg-gray-200 transition">
//                   Sign up
//                 </button>
//               </SignUpButton>
//             </div>
//           </SignedOut>
//         </div>
//       </div>
//     </nav>
//   );
// }

"use client";

import Link from "next/link";
import {
  SignedIn,
  SignedOut,
  UserButton,
  SignInButton,
  SignUpButton,
} from "@clerk/nextjs";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react"; // ✅ Plus icon

export default function Navbar({ searchQuery, setSearchQuery }) {
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const router = useRouter();
  const [loading, setLoading] = useState(false); // 🔹 New state for spinner

  // Handle create new doc
  const handleCreateDoc = async () => {
    if (!title.trim()) return;
    try {
      setLoading(true); // 🔹 Start loading
      const res = await axios.post("/api/newDoc", { title });
      console.log("Doc created:", res.data);

      // Close modal + reset input
      setShowModal(false);
      setTitle("");

      // ✅ Redirect to the new doc page (assuming response has id)
      if (res.data?.data?.id) {
        router.push(`/documents/${res.data.data.id}`);
      }
    } catch (err) {
      console.error("Error creating doc:", err);
    } finally {
      setLoading(false); // 🔹 Stop loading
    }
  };

  return (
    <nav className="w-full bg-black border-b border-gray-800 text-gray-100 gap-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-semibold tracking-tight">MyApp</span>
        </Link>

        {/* Center: Search bar */}
        <div className="flex-1 px-4">
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-700 bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Create New Doc button - only for logged in users */}
          <SignedIn>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-800 transition cursor-pointer"
            >
              <Plus size={16} /> {/* ✅ Plus icon */}
              New Doc
            </button>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>

          {/* Show login/signup when logged out */}
          <SignedOut>
            <div className="flex items-center gap-2">
              <SignInButton mode="modal">
                <button className="px-3 py-1.5 rounded-md border border-gray-700 hover:bg-gray-900 transition">
                  Log in
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="px-3 py-1.5 rounded-md bg-white text-black hover:bg-gray-200 transition">
                  Sign up
                </button>
              </SignUpButton>
            </div>
          </SignedOut>
        </div>
      </div>

      {/* Modal for entering doc title */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white/80 backdrop-blur-md p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4 text-black">
              Create New Document
            </h2>
            <input
              type="text"
              placeholder="Enter title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-black-300 rounded-md mb-4 text-black"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-3 py-1.5 rounded-md border border-gray-300 bg-black text-white hover:bg-gray-500 cursor-pointer"
                disabled={loading} // 🔹 Disable while loading
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDoc}
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-800 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
                disabled={loading}
              >
                {loading && (
                  <Loader2 className="animate-spin w-5 h-5 text-white" />
                )}
                <span>{loading ? "Creating..." : "Create"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
